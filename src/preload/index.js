import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

let isDev = false;
ipcRenderer.on('is-dev', (_, value) => {
  isDev = value;
});

// Custom APIs for renderer
const api = {
  minimizeWindow: () => {ipcRenderer.send('minimize-window')},
  closeWindow: () => {ipcRenderer.send('close-window')},
  readConfig: (configPath) => ipcRenderer.invoke('read-config', configPath),
  saveConfig: (configPath, config) => ipcRenderer.invoke('save-config', configPath, config),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  readFileAsBuffer: (filePath) => ipcRenderer.invoke('read-file-as-buffer', filePath),
  saveFile: (options) => ipcRenderer.invoke('save-file', options),
  readTextFile: (filePath) => ipcRenderer.invoke('read-text-file', filePath)
};

// 确保 API 被正确暴露
try {
  contextBridge.exposeInMainWorld('env', {
    isDev: () => isDev
  });
  contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
      invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
      on: (channel, func) => ipcRenderer.on(channel, func),
      send: (channel, ...args) => ipcRenderer.send(channel, ...args)
    }
  });
  contextBridge.exposeInMainWorld('api', api);
} catch (error) {
  console.error('Error exposing APIs:', error);
}