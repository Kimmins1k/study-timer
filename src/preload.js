const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  state: () => ipcRenderer.invoke('state'),
  toggle: () => ipcRenderer.send('toggle'),
  quit: () => ipcRenderer.send('quit'),
});
