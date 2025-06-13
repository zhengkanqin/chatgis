"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
const fs = require("fs").promises;
const icon = path.join(__dirname, "../../resources/icon.ico");
const { screen } = electron;
const { dialog } = electron;
if (typeof electron === "string") {
  throw new TypeError("Not running in an Electron environment!");
}
const { env } = process;
const isEnvSet = "ELECTRON_IS_DEV" in env;
const getFromEnv = Number.parseInt(env.ELECTRON_IS_DEV, 10) === 1;
const isDev = isEnvSet ? getFromEnv : !electron.app.isPackaged;
let backendProcess;
let mainWindow;
function startBackend() {
  const backendPath = isDev ? path.join(__dirname, "..", "back", "chatgis_server.exe") : path.join(process.resourcesPath, "chatgis_server.exe");
  backendProcess = child_process.spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    windowsHide: true
    // ✅ 防止黑框
  });
  backendProcess.stdout?.on("data", (data) => {
    console.log("[FastAPI]", data.toString());
  });
  backendProcess.stderr?.on("data", (data) => {
    console.error("[FastAPI Error]", data.toString());
  });
}
function killBackend() {
  if (backendProcess?.pid) {
    child_process.exec(`taskkill /PID ${backendProcess.pid} /T /F`, (err) => {
      if (err) {
        console.error("[Kill Error]", err);
      } else {
        console.log("[FastAPI] Backend process terminated.");
      }
    });
  }
}
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = Math.floor(screenWidth * 0.8);
  const winHeight = Math.floor(screenHeight * 0.8);
  const minWidth = Math.floor(screenWidth * 0.5);
  const minHeight = Math.floor(screenHeight * 0.5);
  mainWindow = new electron.BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth,
    minHeight,
    x: Math.floor((screenWidth - winWidth) / 2),
    y: Math.floor((screenHeight - winHeight) / 2),
    frame: false,
    // 去掉系统默认窗口框架，使用自定义标题栏
    resizable: true,
    // 允许调整大小
    maximizable: true,
    // 允许最大化
    minimizable: true,
    // 允许最小化（可选）
    hasShadow: true,
    // 窗口阴影
    autoHideMenuBar: true,
    show: false,
    transparent: true,
    // 启用透明支持
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false
      // 禁用web安全策略，允许file://协议
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-state-change", { isMaximized: true });
  });
  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-state-change", { isMaximized: false });
  });
  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow.webContents.send("is-dev", isDev);
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  startBackend();
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("window:minimize", () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });
  electron.ipcMain.on("window:close", () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });
  electron.ipcMain.on("minimize-window", () => {
    console.log("Minimize event received");
    mainWindow.minimize();
  });
  electron.ipcMain.on("close-window", () => {
    console.log("Close event received");
    mainWindow.close();
  });
  electron.ipcMain.on("toggle-maximize", () => {
    console.log("Toggle maximize event received");
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });
  electron.ipcMain.handle("save-config", async (event, configPath, config) => {
    try {
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
      return { success: true };
    } catch (error) {
      console.error("保存配置失败:", error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("read-config", async (event, configPath) => {
    try {
      const content = await fs.readFile(configPath, "utf-8");
      return { success: true, data: JSON.parse(content) };
    } catch (error) {
      console.error("读取配置失败:", error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("select-folder", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return result;
  });
  electron.ipcMain.handle("select-file", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "支持的文件", extensions: ["shp", "tif", "png", "jpg", "gdb", "doc", "docx", "pdf"] }
      ]
    });
    return result;
  });
  electron.ipcMain.handle("read-directory", async (event, dirPath) => {
    try {
      const items = await fs.readdir(dirPath);
      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("get-file-stats", async (event, filePath) => {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        data: {
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          size: stats.size,
          mtime: stats.mtime
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("read-file-as-buffer", async (event, filePath) => {
    try {
      const buffer = await fs.readFile(filePath);
      return { success: true, data: buffer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("save-file", async (event, { filePath, data }) => {
    try {
      await fs.writeFile(filePath, Buffer.from(data));
      return { success: true };
    } catch (error) {
      console.error("保存文件失败:", error);
      return { success: false, error: error.message };
    }
  });
  electron.ipcMain.handle("read-text-file", async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return { success: true, data: content };
    } catch (error) {
      console.error("读取文本文件失败:", error);
      return { success: false, error: error.message };
    }
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  killBackend();
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
