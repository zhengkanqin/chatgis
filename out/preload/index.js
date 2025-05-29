"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
let isDev = false;
electron.ipcRenderer.on("is-dev", (_, value) => {
  isDev = value;
});
const api = {
  minimizeWindow: () => {
    electron.ipcRenderer.send("minimize-window");
  },
  closeWindow: () => {
    electron.ipcRenderer.send("close-window");
  },
  readConfig: (configPath) => electron.ipcRenderer.invoke("read-config", configPath),
  saveConfig: (configPath, config) => electron.ipcRenderer.invoke("save-config", configPath, config),
  selectFolder: () => electron.ipcRenderer.invoke("select-folder"),
  selectFile: () => electron.ipcRenderer.invoke("select-file"),
  readDirectory: (dirPath) => electron.ipcRenderer.invoke("read-directory", dirPath),
  getFileStats: (filePath) => electron.ipcRenderer.invoke("get-file-stats", filePath)
};
try {
  electron.contextBridge.exposeInMainWorld("env", {
    isDev: () => isDev
  });
  electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
  electron.contextBridge.exposeInMainWorld("api", api);
} catch (error) {
  console.error("Error exposing APIs:", error);
}
