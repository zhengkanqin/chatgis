"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
require("path");
require("fs");
let isDev = false;
electron.ipcRenderer.on("is-dev", (_, value) => {
  isDev = value;
});
electron.contextBridge.exposeInMainWorld("env", {
  isDev: () => isDev
});
const api = {
  minimizeWindow: () => {
    electron.ipcRenderer.send("minimize-window");
  },
  closeWindow: () => {
    electron.ipcRenderer.send("close-window");
  },
  readConfig: (configPath) => electron.ipcRenderer.invoke("read-config", configPath),
  saveConfig: (configPath, config) => electron.ipcRenderer.invoke("save-config", configPath, config)
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
