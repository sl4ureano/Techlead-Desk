'use strict';
const assert=require('node:assert/strict');
const {chromium,_electron}=require('playwright');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const root=path.resolve(__dirname,'..'),dir=await fs.mkdtemp(path.join(os.tmpdir(),'desk-web-'));
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
 const server=http.createServer(async(req,res)=>{
  try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error();const content=await fs.readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(content);}catch{res.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  if(process.env.TECHLEAD_WEB_ELECTRON){
   browser=await _electron.launch({executablePath:require('electron'),args:['--no-sandbox','--no-tray','--disable-gpu','--ozone-platform=headless',path.join(__dirname,'web-host.cjs')]});context=browser.context();
  }else{browser=await chromium.launch({headless:true,args:['--no-sandbox']});context=await browser.newContext();}
  // Only the browser's native picker is substituted. Application UI and FileStore run unmodified.
  await context.addInitScript(()=>{
   window.testFiles={};
   const handle=name=>({name,requestPermission:async()=> 'granted',getFile:async()=>({text:async()=>window.testFiles[name]}),createWritable:async()=>{let buffer;return{write:async text=>buffer=text,close:async()=>{window.testFiles[name]=buffer;},abort:async()=>{}};}});
   window.showSaveFilePicker=async()=>handle('browser.json');
   window.showOpenFilePicker=async()=>{if(window.cancelNextPicker){window.cancelNextPicker=false;throw new DOMException('Cancelado','AbortError');}return[handle('browser.json')];};
  });
  for(const [label,url] of [['modules',`http://127.0.0.1:${server.address().port}/`],['standalone',pathToFileURL(path.join(root,'dist/techlead-desk-unico.html')).href]]){
   let page;
   if(process.env.TECHLEAD_WEB_ELECTRON){const opened=browser.waitForEvent('window');await browser.evaluate(({BrowserWindow})=>{const win=new BrowserWindow({width:1100,height:780,minWidth:960,minHeight:680,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});win.loadURL('about:blank');});page=await opened;}else page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.locator('#startup-splash').waitFor();await page.screenshot({path:path.join(dir,label+'-splash.png')});await page.locator('#startup-splash').waitFor({state:'detached'});
   assert.equal(await page.evaluate(()=>typeof window.desktop),'undefined');assert.equal(await page.locator('.desktop-titlebar').count(),0);
   await page.getByRole('button',{name:'Criar arquivo novo',exact:true}).click();await page.locator('#app').waitFor({state:'visible'});
   await page.locator('nav [data-nav="tasks"]').click();await page.locator('[data-new="tasks"]').click();
   await page.locator('#fields [name="title"]').fill('Tarefa compartilhada web e desktop');await page.locator('#edit-form button[type="submit"]').click();await page.getByRole('heading',{name:'Tarefa compartilhada web e desktop'}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.parse(window.testFiles['browser.json']).tasks[0].title),'Tarefa compartilhada web e desktop');
   await page.locator('#reminders-button').click();await page.locator('#reminder-position').selectOption('top-left');await page.locator('#reminder-duration').fill('3');
   const head=page.locator('#reminders-dialog .dialog-head'),before=await head.boundingBox();
   await page.locator('#reminders-dialog .dialog-body').evaluate(el=>el.scrollTop=el.scrollHeight);assert.deepEqual(await head.boundingBox(),before);
   await page.locator('#test-desktop-notification').click();await page.locator('#web-alert-preview').waitFor({state:'visible'});
   assert.equal(await page.locator('#web-alert-preview').getAttribute('data-position'),'top-left');
   const box=await page.locator('#web-alert-preview').boundingBox();assert(Math.abs(box.x-18)<2);
   await page.locator('#web-alert-preview').waitFor({state:'detached',timeout:5000});
   await page.locator('#reminder-settings button').filter({hasText:'Salvar preferências'}).click();await page.locator('#close-reminders').click();
   assert.equal(await page.evaluate(()=>JSON.parse(window.testFiles['browser.json']).settings.reminders.desktopPosition),'top-left');
   await page.locator('.file-actions summary').click();await page.evaluate(()=>window.cancelNextPicker=true);await page.locator('#switch-file').click();await page.getByRole('heading',{name:'Tarefa compartilhada web e desktop'}).waitFor();
   await page.locator('.file-actions summary').click();await page.locator('#switch-file').click();await page.locator('#app').waitFor({state:'visible'});
   await page.locator('nav [data-nav="tasks"]').click();await page.getByRole('heading',{name:'Tarefa compartilhada web e desktop'}).waitFor();
   await page.evaluate(()=>scrollTo(0,500));await page.locator('nav [data-nav="overview"]').click();assert.equal(await page.evaluate(()=>scrollY),0);
   await require('./architecture-flow.cjs')(page,{taskTitle:'Tarefa compartilhada web e desktop',screenshotPath:path.join(dir,label+'-architecture.png')});
   assert.equal(await page.evaluate(()=>JSON.parse(window.testFiles['browser.json']).architectures[0].nodes.length),1);
   await page.screenshot({path:path.join(dir,label+'-workspace.png')});assert.deepEqual(errors,[]);await page.close();
  }
  console.log('PASS Web: módulos HTTP e HTML único file://, splash, criação, JSON, modais fixos, prévia com posição e duração, cancelar troca, reabrir e navegação. Capturas: '+dir);
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
