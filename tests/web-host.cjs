// Local fallback for hosts without a downloadable Chromium binary. No app preload.
const {app,BrowserWindow}=require('electron');
app.whenReady().then(()=>{
 const win=new BrowserWindow({width:1100,height:780,minWidth:960,minHeight:680,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.loadURL('about:blank');
});
