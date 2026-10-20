const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('vixenn', {
  action: (name, value) => ipcRenderer.invoke('action', name, value),
  onState: callback => ipcRenderer.on('state', (_event, state) => callback(state)),
  onFocusAddress: callback => ipcRenderer.on('focus-address', () => callback())
});
