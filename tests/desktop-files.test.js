import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {validate,fresh} from '../core.js';
import {nativeHandle} from '../desktop/file-adapter.js';
const {FileService}=createRequire(import.meta.url)('../desktop/file-service.cjs');
async function fixture(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'techlead-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return {dir,filename:path.join(dir,'desk.json'),service:new FileService(validate)};}
test('native files: new JSON round-trips through adapter and preserves a backup on subsequent save',async t=>{
 const {filename,service}=await fixture(t);const descriptor=await service.select(filename,{create:true});
 assert.equal(Object.hasOwn(descriptor,'filename'),false);
 const handle=nativeHandle({fileRead:token=>service.read(token),fileWrite:(token,text)=>service.write(token,text)},descriptor);
 let stream=await handle.createWritable();const first=JSON.stringify(fresh());await stream.write(first);await stream.close();assert.equal(await(await handle.getFile()).text(),first);
 stream=await handle.createWritable();const data=JSON.parse(first);data.notes='Persistência nativa';const second=JSON.stringify(data);await stream.write(second);await stream.close();assert.equal(await fs.readFile(filename,'utf8'),second);assert.equal(await fs.readFile(filename+'.bak','utf8'),first);
});
test('native files: external changes reject save and keep disk intact',async t=>{
 const {filename,service}=await fixture(t);const initial=JSON.stringify(fresh());await fs.writeFile(filename,initial);const {token}=await service.select(filename);await fs.writeFile(filename,'external edit');await assert.rejects(service.write(token,initial),/alterado fora/);assert.equal(await fs.readFile(filename,'utf8'),'external edit');
});
test('native files: unknown tokens, malformed JSON, invalid schema and symlink are rejected',async t=>{
 const {filename,dir,service}=await fixture(t);assert.throws(()=>service.write('fake','{}'),/não autorizado/);await fs.writeFile(filename,'{}');await assert.rejects(service.select(filename),/versão/);
 const {token}=await service.select(filename,{create:true});assert.throws(()=>service.write(token,'{bad'));assert.throws(()=>service.write(token,'{}'),/versão/);assert.equal(await fs.readFile(filename,'utf8'),'{}');
 if(process.platform!=='win32'){const link=path.join(dir,'link.json');await fs.symlink(filename,link);await assert.rejects(service.select(link),/simbólicos/);}
});
test('native files: queued saves serialize and backups follow the previous revision',async t=>{
 const {filename,service}=await fixture(t);const {token}=await service.select(filename,{create:true});const a=fresh(),b=fresh();a.notes='primeira';b.notes='segunda';await Promise.all([service.write(token,JSON.stringify(a)),service.write(token,JSON.stringify(b))]);assert.equal(JSON.parse(await fs.readFile(filename,'utf8')).notes,'segunda');assert.equal(JSON.parse(await fs.readFile(filename+'.bak','utf8')).notes,'primeira');
});
test('native adapter: cancelling or aborting never writes',async()=>{
 assert.throws(()=>nativeHandle({},null),{name:'AbortError'});let writes=0;const handle=nativeHandle({fileWrite:async()=>writes++},{token:'token',name:'desk.json'});const stream=await handle.createWritable();await stream.write('test');await stream.abort();await assert.rejects(stream.close(),/encerrada/);assert.equal(writes,0);
});
