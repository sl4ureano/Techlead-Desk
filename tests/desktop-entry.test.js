import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {launchArgs}=require('../desktop/launch.cjs');
test('start and dev resolve the application entry when a sibling JSON shares the folder name',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'desk-entry-'));
 try{
  const root=path.join(dir,'techlead-desk');await mkdir(path.join(root,'desktop'),{recursive:true});
  const metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  await writeFile(path.join(root,'package.json'),JSON.stringify(metadata));
  await writeFile(path.join(root,'desktop/main.cjs'),'module.exports=true;');
  const data=path.join(dir,'techlead-desk.json');await writeFile(data,'{"tasks":[]}');
  for(const script of ['start','dev']){
   const entry=metadata.scripts[script].split(/\s+/)[1];
   assert.equal(entry,'desktop/launch.cjs');
   const application=path.join(root,'desktop',path.basename(launchArgs([],'linux',{DISPLAY:':0'})[0]));
   assert.equal(require.resolve(application),path.join(root,'desktop/main.cjs'));
  }
  assert.equal(await readFile(data,'utf8'),'{"tasks":[]}');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('launcher selects X11 before Electron starts and preserves explicit backends',()=>{
 assert.deepEqual(launchArgs(['--dev'],'linux',{DISPLAY:':0',WAYLAND_DISPLAY:'wayland-0'}).slice(1),['--dev','--ozone-platform=x11']);
 for(const backend of ['wayland','headless','x11'])assert.deepEqual(launchArgs(['--ozone-platform='+backend],'linux',{DISPLAY:':0'}).slice(1),['--ozone-platform='+backend]);
 for(const platform of ['darwin','win32'])assert.deepEqual(launchArgs([],platform,{DISPLAY:':0'}).slice(1),[]);
 assert.deepEqual(launchArgs([],'linux',{}).slice(1),[]);
});
