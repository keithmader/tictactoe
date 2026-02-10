const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const isDev = !app.isPackaged;
const logFile = path.join(os.tmpdir(), "wargames-electron.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
}

app.commandLine.appendSwitch("no-sandbox");

log(`App starting. isDev=${isDev}, __dirname=${__dirname}`);
log(`process.resourcesPath=${process.resourcesPath}`);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    backgroundColor: "#0a0a0a",
    title: "WarGames - Tic Tac Toe",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (isDev) {
    log("Loading dev URL: http://localhost:5173");
    win.loadURL("http://localhost:5173");
  } else {
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    log(`Loading file: ${indexPath}`);
    log(`File exists: ${fs.existsSync(indexPath)}`);
    win.loadFile(indexPath);
  }

  win.webContents.on("did-fail-load", (event, errorCode, errorDescription) => {
    log(`did-fail-load: code=${errorCode} desc=${errorDescription}`);
  });

  win.webContents.on("render-process-gone", (event, details) => {
    log(`render-process-gone: reason=${details.reason} exitCode=${details.exitCode}`);
  });

  win.on("closed", () => {
    log("Window closed");
  });
}

app.whenReady().then(() => {
  log("App ready, creating window");
  createWindow();
});

app.on("window-all-closed", () => {
  log("All windows closed, quitting");
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

process.on("uncaughtException", (err) => {
  log(`uncaughtException: ${err.stack || err.message}`);
});
