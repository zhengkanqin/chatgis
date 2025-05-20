import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
const path = require("path");
const fs = require('fs');


let isDev = false;
ipcRenderer.on('is-dev', (_, value) => {
  isDev = value;
});
contextBridge.exposeInMainWorld('env', {
  isDev: () => isDev
});


// Custom APIs for renderer
const api = {
  minimizeWindow: () => {ipcRenderer.send('minimize-window')},
  closeWindow: () => {ipcRenderer.send('close-window')},
  readConfig: (configPath) => ipcRenderer.invoke('read-config', configPath),
  saveConfig: (configPath, config) => ipcRenderer.invoke('save-config', configPath, config),
};


if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
  window.api = api;
}