'use strict';
const {app, BrowserWindow, ipcMain, dialog, Menu, Tray, nativeImage, Notification, screen, shell, powerMonitor, session} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const {fileURLToPath} = require('node:url');
const {FileService} = require('./file-service.cjs');
const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const TOAST = path.join(__dirname, 'notification.html');
let main, tray, files, quitting = false, dirty = false, dialogBusy = false;
const toasts = new Map(), nativeNotifications = new Set();
let windowState = {width:1440, height:940};
const stateFile = () => path.join(app.getPath('userData'), 'window.json');
const icon = () => nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
const showMain = () => { if (!main || main.isDestroyed()) return; if (main.isMinimized()) main.restore(); main.show(); main.focus(); };
const command = name => { showMain(); main.webContents.send('app:command', name); };
const trusted = (event, window, filename) => {
  if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== event.sender.mainFrame) return false;
  try { return fileURLToPath(event.senderFrame.url) === filename; } catch { return false; }
};
function guard(event) { if (!trusted(event, main, INDEX)) throw Error('Origem não autorizada.'); }
function lockNavigation(win) {
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.setWindowOpenHandler(({url}) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => {});
    return {action:'deny'};
  });
}
async function pick(create) {
  if (dialogBusy) return null;
  dialogBusy = true;
  try {
    const options = {title:create?'Criar espaço de trabalho':'Abrir espaço de trabalho',filters:[{name:'Dados Techlead Desk',extensions:['json']}]};
    const result = create ? await dialog.showSaveDialog(main, {...options,defaultPath:'techlead-desk.json'}) : await dialog.showOpenDialog(main, {...options,properties:['openFile']});
    if (result.canceled) return null;
    return await files.select(create?result.filePath:result.filePaths[0], {create});
  } finally { dialogBusy = false; }
}
function layoutToasts() {
  if (!main || main.isDestroyed()) return;
  let offset = 18;
  const area = screen.getDisplayMatching(main.getBounds()).workArea;
  const display = area.width>=400&&area.height>=240?area:{x:0,y:0,width:1280,height:800};
  const width = Math.min(396, display.width - 24), height = 226;
  for (const entry of [...toasts.values()].reverse()) {
    if (entry.window.isDestroyed()) continue;
    entry.window.setBounds({x:display.x+display.width-width-18,y:display.y+display.height-height-offset,width,height});
    offset += height + 6;
  }
}
function openReminder(tag) { showMain(); main.webContents.send('alert:open', tag); }
function nativeAlert(payload) {
  if (!Notification.isSupported()) throw Error('Notificações indisponíveis neste sistema.');
  const n = new Notification({title:payload.title,body:payload.body,icon:icon(),silent:true});
  nativeNotifications.add(n);
  n.on('click', () => { openReminder(payload.tag); n.close(); });
  n.on('close', () => nativeNotifications.delete(n));
  n.show();
}
function closeToast(id) { const t = toasts.get(id); if (t && !t.window.isDestroyed()) t.window.close(); }
function notify(payload) {
  if (!payload || typeof payload.title !== 'string' || typeof payload.body !== 'string' || typeof payload.tag !== 'string' || payload.title.length > 2000 || payload.body.length > 4000 || payload.tag.length > 4000) throw Error('Alerta inválido.');
  // Native fallback is useful for Wayland environments that restrict overlay positioning.
  if (process.argv.includes('--native-notifications')) { nativeAlert(payload); return; }
  if (toasts.has(payload.tag)) { closeToast(payload.tag); }
  if (toasts.size >= 3) closeToast(toasts.keys().next().value);
  const win = new BrowserWindow({width:396,height:226,show:false,frame:false,transparent:true,resizable:false,skipTaskbar:true,alwaysOnTop:true,focusable:false,hasShadow:false,webPreferences:{preload:path.join(__dirname,'notification-preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
  const entry = {window:win,payload,timer:null};
  toasts.set(payload.tag, entry);
  lockNavigation(win);
  win.once('ready-to-show', () => { layoutToasts(); win.showInactive(); });
  win.webContents.once('did-finish-load', () => { win.webContents.send('toast:payload',payload); });
  win.on('closed', () => { clearTimeout(entry.timer); if (toasts.get(payload.tag) === entry) toasts.delete(payload.tag); layoutToasts(); });
  entry.timer = setTimeout(() => closeToast(payload.tag), 14000);
  win.loadFile(TOAST).catch(() => { closeToast(payload.tag); nativeAlert(payload); });
}
function bindIPC() {
  const handle = (channel, fn) => ipcMain.handle(channel, (event, ...args) => { guard(event); return fn(...args); });
  handle('file:open', () => pick(false));
  handle('file:create', () => pick(true));
  handle('file:read', token => files.read(token));
  handle('file:write', (token, text) => files.write(token,text));
  handle('app:info', () => ({version:app.getVersion(),platform:process.platform,tray:!!tray,notifications:process.argv.includes('--native-notifications')?'native':'cards'}));
  handle('window:action', action => {
    if (action === 'menu') Menu.getApplicationMenu()?.popup({window:main});
    else if (action === 'minimize') main.minimize();
    else if (action === 'maximize') main.isMaximized()?main.unmaximize():main.maximize();
    else if (action === 'close') main.close();
    else if (action === 'quit') app.quit();
    else throw Error('Ação de janela inválida.');
  });
  handle('alert:show', payload => notify(payload));
  ipcMain.on('document:dirty',(event,value) => { guard(event); dirty = value === true; });
  for (const [channel,open] of [['toast:open',true],['toast:dismiss',false]]) ipcMain.on(channel,event => {
    for (const [id,t] of toasts) if (trusted(event,t.window,TOAST)) { if (open) openReminder(id); closeToast(id); break; }
  });
}
function buildMenu() {
  const template = [
    ...(process.platform==='darwin'?[{role:'appMenu'}]:[]),
    {label:'Arquivo',submenu:[{label:'Abrir JSON…',accelerator:'CmdOrCtrl+O',click:()=>command('open')},{label:'Criar JSON…',accelerator:'CmdOrCtrl+N',click:()=>command('create')},{label:'Salvar agora',accelerator:'CmdOrCtrl+S',click:()=>command('save')},{type:'separator'},{label:'Sair do Techlead Desk',accelerator:'CmdOrCtrl+Q',click:()=>app.quit()}]},
    {label:'Editar',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'Visualizar',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{role:'togglefullscreen'},...(process.argv.includes('--dev')?[{role:'toggleDevTools'}]:[])]},
    {label:'Alertas',submenu:[{label:'Preferências de alertas',click:()=>command('reminders')},{label:'Testar cartão desktop',click:()=>notify({title:'Tudo pronto para o próximo passo.',body:'Seus alertas aparecem aqui, mesmo com o Desk minimizado.',tag:'desktop-demo'})}]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  if (process.argv.includes('--no-tray')) return;
  try {
    let trayIcon = icon().resize({width:22,height:22});
    if (process.platform==='darwin') trayIcon.setTemplateImage(true);
    tray = new Tray(trayIcon); tray.setToolTip('Techlead Desk · Clareza para liderar');
    tray.setContextMenu(Menu.buildFromTemplate([{label:'Abrir Techlead Desk',click:showMain},{label:'Preferências de alertas',click:()=>command('reminders')},{type:'separator'},{label:'Sair',click:()=>app.quit()}]));
    tray.on('click',showMain);tray.on('double-click',showMain);
  } catch { tray = null; }
}
async function createWindow() {
  try { const saved = JSON.parse(await fs.readFile(stateFile(),'utf8')); if (Number.isInteger(saved.width)&&Number.isInteger(saved.height)) windowState={width:Math.max(960,Math.min(2400,saved.width)),height:Math.max(680,Math.min(1600,saved.height)),maximized:saved.maximized===true}; } catch {}
  main = new BrowserWindow({width:windowState.width,height:windowState.height,minWidth:960,minHeight:680,title:'Techlead Desk',frame:false,autoHideMenuBar:true,show:false,backgroundColor:'#f5f7fb',icon:icon(),webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'}});
  lockNavigation(main);
  main.on('maximize',()=>main.webContents.send('window:state',{maximized:true}));
  main.on('unmaximize',()=>main.webContents.send('window:state',{maximized:false}));
  main.on('close', event => {
    if (!quitting && tray) { event.preventDefault(); main.hide(); return; }
    if (dirty) {
      const choice=dialog.showMessageBoxSync(main,{type:'warning',title:'Alterações não salvas',message:'Ainda há alterações não salvas no seu JSON.',detail:'Cancele para tentar salvar novamente, ou saia descartando apenas as alterações pendentes.',buttons:['Voltar e salvar','Sair sem salvar'],defaultId:0,cancelId:0});
      if(choice!==1){event.preventDefault();quitting=false;showMain();return;}
      dirty=false;
    }
    const bounds=main.getNormalBounds();
    try { require('node:fs').writeFileSync(stateFile(),JSON.stringify({width:bounds.width,height:bounds.height,maximized:main.isMaximized()})); } catch {}
  });
  main.webContents.on('will-prevent-unload',event => { if (!dirty) event.preventDefault(); });
  main.once('ready-to-show',()=>{if(windowState.maximized)main.maximize();main.show();});
  await main.loadFile(INDEX);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance',showMain);
  app.on('before-quit',()=>{quitting=true;});
  app.on('window-all-closed',()=>{if(!tray||quitting)app.quit();});
  app.on('activate',showMain);
  app.setAppUserModelId('com.slaureano.techleaddesk');
  app.whenReady().then(async()=>{
    const {validate}=await import('../core.js');files=new FileService(validate);
    session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
    session.defaultSession.setPermissionCheckHandler(()=>false);
    session.defaultSession.webRequest.onBeforeRequest((details,callback)=>{
      let allowed=false;
      try {const url=new URL(details.url);if(url.protocol==='file:'){const relative=path.relative(ROOT,fileURLToPath(url));allowed=relative!==''&&!relative.startsWith('..')&&!path.isAbsolute(relative);}else allowed=['data:','blob:','devtools:'].includes(url.protocol);}catch{}
      callback({cancel:!allowed});
    });
    bindIPC();await createWindow();buildMenu();
    powerMonitor.on('resume',()=>{if(!main.isDestroyed())main.webContents.send('app:resume');});
    screen.on('display-metrics-changed',layoutToasts);
  }).catch(error=>{console.error(error);dialog.showErrorBox('Não foi possível iniciar o Techlead Desk',error.message);app.exit(1);});
}
