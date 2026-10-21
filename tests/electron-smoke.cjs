'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {_electron} = require('playwright');
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(),'techlead-electron-'));
  const filename=path.join(dir,'smoke.json');
  const electronPath=require('electron');
  let desktop;
  const errors=[];
  try {
    desktop=await _electron.launch({executablePath:electronPath,args:['--no-sandbox','--disable-dev-shm-usage',...(process.env.TECHLEAD_HEADLESS?['--no-tray','--disable-gpu','--ozone-platform=headless']:[]),path.join(__dirname,'electron-smoke-entry.cjs')],env:{...process.env,TECHLEAD_SMOKE_DIR:dir},timeout:30000});
    const page=await desktop.firstWindow();
    page.on('pageerror',error=>errors.push(error.message));
    await page.locator('.desktop-titlebar').waitFor();
    assert.equal(await page.evaluate(()=>typeof window.require),'undefined');
    await desktop.evaluate(({dialog},filename)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:filename});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[filename]});},filename);
    await page.getByRole('button',{name:'Criar arquivo novo',exact:true}).click();
    await page.locator('#app').waitFor({state:'visible'});
    await page.locator('nav [data-nav="tasks"]').click();
    await page.locator('[data-new="tasks"]').click();
    await page.locator('#edit-form [name="title"]').fill('Revisar entrega desktop');
    await page.locator('#edit-form button[type="submit"]').click();
    await page.getByRole('heading',{name:'Revisar entrega desktop'}).waitFor();
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.querySelector('#save-status').textContent.toLowerCase().includes('salv'));
    let data;
    for(let i=0;i<40;i++){data=JSON.parse(await fs.readFile(filename,'utf8'));if(data.tasks.length)break;await new Promise(resolve=>setTimeout(resolve,50));}
    assert.equal(data.tasks[0].title,'Revisar entrega desktop');
    await fs.access(filename+'.bak');
    await page.locator('.task-action-menu>summary').click();
    await page.locator('[data-complete-task]').click();
    await page.locator('nav [data-nav="overview"]').click();
    assert.equal(await page.evaluate(()=>window.scrollY),0);
    await page.screenshot({path:path.join(dir,'workspace.png'),timeout:5000});
    const toastPromise=desktop.waitForEvent('window');
    await page.evaluate(()=>window.desktop.notify({title:'Revisão de entrega',body:'Cartão desktop real · IPC isolado',tag:'smoke-alert'}));
    const toast=await toastPromise;
    await toast.locator('#title').waitFor({state:'attached'});
    assert((await toast.locator('#title').boundingBox()).width>0);
    await toast.waitForFunction(()=>document.querySelector('#title').textContent==='Revisão de entrega');
    assert.equal(await toast.locator('#body').textContent(),'Cartão desktop real · IPC isolado');
    await toast.screenshot({path:path.join(dir,'notification.png'),timeout:5000});
    await toast.locator('#dismiss').click();
    // A closed event can arrive just after click; no renderer error is acceptable.
    assert.deepEqual(errors,[]);
    console.log('PASS Electron: renderer isolado, criar JSON, tarefa, backup, concluir, navegação e cartão desktop.');
    console.log('Capturas do teste: '+dir);
  } finally {
    if(desktop) await desktop.close();
    // Screenshots are temporary QA output, retained only for the current run.
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
