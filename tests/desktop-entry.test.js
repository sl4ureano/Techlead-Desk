import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
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
   assert.equal(require.resolve(path.resolve(root,entry)),path.join(root,'desktop/main.cjs'));
  }
  assert.equal(await readFile(data,'utf8'),'{"tasks":[]}');
 }finally{await rm(dir,{recursive:true,force:true});}
});
