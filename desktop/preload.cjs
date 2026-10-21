'use strict';
const {contextBridge, ipcRenderer} = require('electron');
const subscribe = channel => callback => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  fileOpen: () => ipcRenderer.invoke('file:open'),
  fileCreate: () => ipcRenderer.invoke('file:create'),
  fileRead: token => ipcRenderer.invoke('file:read', token),
  fileWrite: (token, text) => ipcRenderer.invoke('file:write', token, text),
  info: () => ipcRenderer.invoke('app:info'),
  windowAction: action => ipcRenderer.invoke('window:action', action),
  setDirty: dirty => ipcRenderer.send('document:dirty', dirty),
  notify: payload => ipcRenderer.invoke('alert:show', payload),
  onCommand: subscribe('app:command'),
  onReminder: subscribe('alert:open'),
  onResume: subscribe('app:resume'),
  onWindowState: subscribe('window:state')
});
