const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  state: () => ipcRenderer.invoke('state'),
  toggle: () => ipcRenderer.send('toggle'),
  quit: () => ipcRenderer.send('quit'),
  open: () => ipcRenderer.send('open'),
  setIcons: (ring, button) => ipcRenderer.send('icons', ring, button),
});
