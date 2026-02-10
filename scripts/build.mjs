import * as esbuild from "esbuild";
import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const distDir = resolve(projectRoot, "dist");

// Ensure dist directory exists
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Plugin to shim react-devtools-core (optional dep in ink, not needed at runtime)
const shimDevtoolsPlugin = {
  name: "shim-devtools",
  setup(build) {
    build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
      path: "react-devtools-core",
      namespace: "shim",
    }));
    build.onLoad({ filter: /.*/, namespace: "shim" }, () => ({
      contents: "export default undefined;",
      loader: "js",
    }));
  },
};

// Step 1: Bundle with esbuild as ESM (ink/yoga-layout require top-level await)
console.log("Bundling with esbuild (ESM)...");
await esbuild.build({
  entryPoints: [resolve(projectRoot, "src/index.tsx")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: resolve(distDir, "bundle.mjs"),
  jsx: "automatic",
  plugins: [shimDevtoolsPlugin],
  supported: {
    "top-level-await": true,
  },
  // Inject createRequire so CJS shims in the ESM bundle can resolve Node builtins.
  // Also log bundle startup for diagnostics.
  banner: {
    js: [
      `import { createRequire } from 'module';`,
      `const require = createRequire(import.meta.url);`,
      `import { appendFileSync as __logWrite } from 'fs';`,
      `import { tmpdir as __tmpdir } from 'os';`,
      `function __log(m) { try { __logWrite(__tmpdir() + '/tictactoe-debug.log', new Date().toISOString() + ' [bundle] ' + m + '\\n'); } catch {} }`,
      `__log('ESM bundle executing...');`,
    ].join(' '),
  },
  logLevel: "warning",
});
console.log("ESM bundle created: dist/bundle.mjs");

// Step 1b: Post-process bundle to fix RegExp "v" flag usage from string-width.
// pkg's patched Node 20 binary crashes (0xC0000005 access violation) on RegExp
// constructions with the "v" flag. Replace with "u" flag equivalents.
// The "v" flag adds \p{RGI_Emoji} and \p{Surrogate} support; we provide fallbacks.
{
  const bundlePath = resolve(distDir, "bundle.mjs");
  let code = readFileSync(bundlePath, "utf-8");
  const replacements = [
    // zeroWidthClusterRegex: remove \p{Surrogate} (not in "u"), use "u" flag
    [
      `new RegExp("^(?:\\\\p{Default_Ignorable_Code_Point}|\\\\p{Control}|\\\\p{Format}|\\\\p{Mark}|\\\\p{Surrogate})+$", "v")`,
      `new RegExp("^(?:\\\\p{Default_Ignorable_Code_Point}|\\\\p{Control}|\\\\p{Format}|\\\\p{Mark}|[\\\\uD800-\\\\uDFFF])+$", "u")`,
    ],
    // leadingNonPrintingRegex: same fix
    [
      `new RegExp("^[\\\\p{Default_Ignorable_Code_Point}\\\\p{Control}\\\\p{Format}\\\\p{Mark}\\\\p{Surrogate}]+", "v")`,
      `new RegExp("^[\\\\p{Default_Ignorable_Code_Point}\\\\p{Control}\\\\p{Format}\\\\p{Mark}\\\\uD800-\\\\uDFFF]+", "u")`,
    ],
    // rgiEmojiRegex: \p{RGI_Emoji} not available in "u" mode, use basic emoji range
    [
      `new RegExp("^\\\\p{RGI_Emoji}$", "v")`,
      `new RegExp("^[\\\\p{Emoji_Presentation}\\\\p{Extended_Pictographic}]$", "u")`,
    ],
  ];
  let replaced = 0;
  for (const [from, to] of replacements) {
    if (code.includes(from)) {
      code = code.replace(from, to);
      replaced++;
    }
  }
  // Inject diagnostic logging at key points to find native crashes
  const yogaLoadLine = `var Yoga = wrapAssembly(await yoga_wasm_base64_esm_default());`;
  if (code.includes(yogaLoadLine)) {
    code = code.replace(
      yogaLoadLine,
      `__log('yoga WASM loading...'); var Yoga = wrapAssembly(await yoga_wasm_base64_esm_default()); __log('yoga WASM loaded OK');`
    );
    replaced++;
  }

  // Inject logging before render
  const renderCall = `render(<App />);`;
  const renderCallActual = code.includes('render(/* @__PURE__ */') ? null : renderCall;
  if (code.includes(renderCall)) {
    code = code.replace(
      renderCall,
      `__log('calling render...'); render(<App />); __log('render() returned');`
    );
    replaced++;
  }

  if (replaced > 0) {
    writeFileSync(bundlePath, code);
    console.log(`Post-processed bundle: ${replaced} modifications`);
  } else {
    console.warn("Warning: Could not find patterns to replace in bundle");
  }
}

// Step 2: Create a CJS entry point that dynamically imports the ESM bundle.
// pkg's snapshot filesystem doesn't support dynamic import(), so we extract
// the bundle and assets to a temp directory and run from there.
const entryContent = `
const path = require('path');
const url = require('url');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const MP3_FILES = [
  'WargamesKeystrokeSoundEdited.mp3',
  'ShallWePlayAGameEdited.mp3',
  'StrangeGameEdited.mp3',
];

// Write diagnostic log to a temp dir (always a native Windows path)
var logFile;
function log(msg) {
  if (!process.pkg) return;
  try {
    if (!logFile) {
      logFile = path.join(os.tmpdir(), 'tictactoe-debug.log');
    }
    fs.appendFileSync(logFile, new Date().toISOString() + ' ' + msg + '\\n');
  } catch {}
}

// Log when the process is about to exit (helps diagnose premature exits)
process.on('exit', function(code) {
  log('Process exiting with code=' + code);
});

// CRITICAL: When the EXE is launched from a UNC path (e.g. \\\\wsl.localhost\\...),
// Node's ESM loader crashes natively during dynamic import(). To fix this, we
// detect the UNC path situation, copy the EXE to a native Windows temp path,
// and re-execute from there using spawnSync so the parent blocks and keeps
// the console window open.
if (process.pkg && process.execPath && process.execPath.startsWith('\\\\\\\\')) {
  log('UNC path detected: ' + process.execPath);
  var tempExe = path.join(os.tmpdir(), 'tictactoe.exe');
  try {
    // Only copy if the temp EXE doesn't exist or is a different size
    var needCopy = true;
    try {
      var srcStat = fs.statSync(process.execPath);
      var dstStat = fs.statSync(tempExe);
      if (srcStat.size === dstStat.size) needCopy = false;
    } catch {}
    if (needCopy) {
      log('Copying EXE to ' + tempExe);
      fs.copyFileSync(process.execPath, tempExe);
    } else {
      log('Using cached EXE at ' + tempExe);
    }
    var safeCwd = os.homedir() || os.tmpdir();
    log('Using CWD=' + safeCwd);

    // WSL's stdio are pipes (not TTYs), which causes Ink/pkg to crash with
    // 0xC0000005 (access violation) during render. Use PowerShell Start-Process
    // -Wait to launch in a NEW console window so the child gets proper TTY streams.
    if (!process.stdout.isTTY) {
      log('Non-TTY detected (WSL pipes) — launching in new console via Start-Process...');
      var psArgs = [
        '-NoProfile', '-Command',
        'Start-Process', '-Wait',
        '-FilePath', "'" + tempExe + "'",
      ];
      var extraArgs = process.argv.slice(1);
      if (extraArgs.length > 0) {
        psArgs.push('-ArgumentList', extraArgs.map(a => "'" + a + "'").join(','));
      }
      var result = spawnSync('powershell.exe', psArgs, {
        stdio: 'ignore',
        windowsHide: false,
        cwd: safeCwd,
      });
    } else {
      log('TTY detected — re-executing with inherited stdio...');
      var result = spawnSync(tempExe, process.argv.slice(1), {
        stdio: 'inherit',
        windowsHide: false,
        cwd: safeCwd,
      });
    }
    log('Child exited with code=' + (result.status || 0) + ' signal=' + (result.signal || 'none'));
    if (result.error) {
      log('Re-exec error: ' + result.error.message);
    }
    process.exit(result.status || 0);
  } catch (e) {
    log('UNC re-exec failed: ' + e.message);
    // Fall through to normal execution as last resort
    runMain();
  }
} else {
  runMain();
}

// Catch ALL uncaught errors so the window stays open
function keepOpen(err) {
  log('UNCAUGHT: ' + (err && err.stack || err));
  console.error(err);
  process.stdout.write('\\nFatal error: ' + (err && err.message || err) + '\\n');
  process.stdout.write('Window will close in 30 seconds...\\n');
  setTimeout(() => process.exit(1), 30000);
}
process.on('uncaughtException', keepOpen);
process.on('unhandledRejection', keepOpen);

function runMain() {
  main().catch(err => {
    log('FATAL: ' + (err && err.stack || err));
    console.error(err);
    if (process.pkg) {
      process.stdout.write('\\nError: ' + (err && err.message || err) + '\\n');
      process.stdout.write('\\nPress any key to exit...\\n');
      try {
        process.stdin.setRawMode && process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => process.exit(1));
      } catch {
        setTimeout(() => process.exit(1), 30000);
      }
    } else {
      process.exit(1);
    }
  });
}

async function main() {
  log('Starting... platform=' + process.platform + ' node=' + process.version);
  log('execPath=' + process.execPath);
  log('__dirname=' + __dirname);
  log('cwd=' + process.cwd());

  const bundleSnapshot = path.join(__dirname, 'bundle.mjs');
  let bundleUrl;

  if (process.pkg) {
    // Inside pkg: extract bundle + MP3 assets from snapshot to temp dir
    const tempDir = path.join(os.tmpdir(), 'tictactoe-' + process.pid);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    log('tempDir=' + tempDir);

    // Extract bundle
    const tempBundle = path.join(tempDir, 'bundle.mjs');
    fs.copyFileSync(bundleSnapshot, tempBundle);
    bundleUrl = url.pathToFileURL(tempBundle).href;
    log('bundleUrl=' + bundleUrl);

    // Extract MP3 assets
    for (const mp3 of MP3_FILES) {
      const src = path.join(__dirname, mp3);
      const dest = path.join(tempDir, mp3);
      try {
        fs.copyFileSync(src, dest);
        log('Extracted ' + mp3);
      } catch (e) {
        log('Failed to extract ' + mp3 + ': ' + e.message);
      }
    }

    // Tell the audio module where to find the extracted assets
    process.env.TICTACTOE_ASSET_DIR = tempDir;

    // Clean up on exit
    process.on('exit', () => {
      try { fs.unlinkSync(tempBundle); } catch {}
      for (const mp3 of MP3_FILES) {
        try { fs.unlinkSync(path.join(tempDir, mp3)); } catch {}
      }
      try { fs.rmdirSync(tempDir); } catch {}
    });
  } else {
    bundleUrl = url.pathToFileURL(bundleSnapshot).href;
  }

  if (process.pkg) {
    // WORKAROUND: Disable globalThis.fetch before importing the bundle.
    // Yoga-layout's Emscripten WASM loader tries WebAssembly.instantiateStreaming
    // via fetch() first, which may not work in pkg. Force base64 fallback.
    var _savedFetch = globalThis.fetch;
    delete globalThis.fetch;
    log('Disabled globalThis.fetch for WASM workaround');

    // NOTE: V8 WASM flags (--liftoff --no-wasm-tier-up) removed —
    // they were causing native crashes (exit code 5) in pkg's Node 20.
    log('Skipping V8 WASM flags (removed to fix crash)');
  }

  log('Importing bundle...');
  try {
    await import(bundleUrl);
    log('Bundle imported successfully');
  } catch (err) {
    log('Import FAILED: ' + (err && err.stack || err));
    throw err;
  }
}
`;
writeFileSync(resolve(distDir, "entry.cjs"), entryContent);
console.log("CJS entry wrapper created: dist/entry.cjs");

// Step 3: Copy MP3 assets to dist (for pkg to find them alongside the entry)
const mp3Files = [
  "WargamesKeystrokeSoundEdited.mp3",
  "ShallWePlayAGameEdited.mp3",
  "StrangeGameEdited.mp3",
];

for (const mp3 of mp3Files) {
  const src = resolve(projectRoot, mp3);
  const dest = resolve(distDir, mp3);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`Copied ${mp3} to dist/`);
  } else {
    console.warn(`Warning: ${mp3} not found in project root`);
  }
}

// Step 4: Create a pkg config that correctly maps assets relative to the entry
// pkg needs assets paths relative to the config file location
const pkgConfig = {
  name: "tictactoe",
  bin: "entry.cjs",
  pkg: {
    assets: [
      "bundle.mjs",
      ...mp3Files,
    ],
    targets: ["node20-win-x64", "node20-macos-x64", "node20-macos-arm64"],
    outputPath: distDir,
  },
};
writeFileSync(resolve(distDir, "package.json"), JSON.stringify(pkgConfig, null, 2));
console.log("pkg config created: dist/package.json");

// Step 5: Compile with pkg
console.log("\nCompiling executables with pkg...");

const pkgCmd = [
  "npx", "@yao-pkg/pkg",
  resolve(distDir, "package.json"),
  "--no-bytecode",
  "--public",
].join(" ");

console.log(`Running: ${pkgCmd}`);
try {
  execSync(pkgCmd, { stdio: "inherit", cwd: distDir });
  console.log("\nBuild complete! Executables:");
  console.log("  dist/tictactoe-win.exe     (Windows x64)");
  console.log("  dist/tictactoe-macos       (macOS x64)");
  console.log("  dist/tictactoe-macos-arm64 (macOS ARM64)");
} catch (error) {
  console.error("pkg compilation failed:", error.message);
  process.exit(1);
}
