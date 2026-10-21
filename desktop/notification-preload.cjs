'use strict';
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('desktopToast', {
  onPayload: callback => ipcRenderer.on('toast:payload', (_event, data) => callback(data)),
  open: () => ipcRenderer.send('toast:open'),
  dismiss: () => ipcRenderer.send('toast:dismiss')
});
