import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fresh,validate,FileStore} from '../core.js';
import {createArchitecture,addArchitectureNode,connectArchitectureNodes,removeArchitectureNode,validateArchitectures} from '../architecture-model.js';
import {architectureSVG} from '../architecture.js';
test('legacy JSON remains valid and architecture graphs validate independently',()=>{
 const old=fresh();delete old.architectures;assert.deepEqual(validate(old),[]);
 const p=createArchitecture('Pedidos','Fluxo principal','topic-1','task-1'),a=addArchitectureNode(p,'service'),b=addArchitectureNode(p,'database');
 connectArchitectureNodes(p,a.id,b.id,'SQL');p.comments.push({id:'c',text:'Separar a leitura?',at:new Date().toISOString(),nodeId:b.id});
 validateArchitectures([p]);assert.equal(p.edges[0].label,'SQL');
 assert.throws(()=>connectArchitectureNodes(p,a.id,a.id));assert.throws(()=>connectArchitectureNodes(p,a.id,b.id));
 const invalid=structuredClone(p);invalid.edges[0].to='missing';assert.throws(()=>validateArchitectures([invalid]),/Conexão/);
 const invalidComment=structuredClone(p);invalidComment.comments[0].nodeId='missing';assert.throws(()=>validateArchitectures([invalidComment]),/Comentário/);
});
test('removing a component removes its connections and preserves comment text',()=>{
 const p=createArchitecture('Teste'),a=addArchitectureNode(p,'service'),b=addArchitectureNode(p,'queue');connectArchitectureNodes(p,a.id,b.id);
 p.comments.push({id:'c',text:'Rever a fila.',at:new Date().toISOString(),nodeId:b.id});removeArchitectureNode(p,b.id);
 assert.equal(p.nodes.length,1);assert.equal(p.edges.length,0);assert.equal(p.comments[0].nodeId,'');assert.equal(p.comments[0].text,'Rever a fila.');validateArchitectures([p]);
});
test('SVG escapes labels and embeds styling for standalone export',()=>{
 const p=createArchitecture('<script>');const a=addArchitectureNode(p,'service');a.label='<script>alert(1)</script>';a.description='context';
 const svg=architectureSVG(p);assert(!svg.includes('<script>'));assert(svg.includes('&lt;script&gt;'));assert(svg.includes('<style>'));assert(svg.includes('viewBox="0 0 1200 700"'));
});
test('invalid coordinates, duplicate IDs and malformed projects fail atomically',()=>{
 const p=createArchitecture('Teste'),a=addArchitectureNode(p,'external');a.x=Infinity;assert.throws(()=>validateArchitectures([p]));a.x=10;p.nodes.push({...a});assert.throws(()=>validateArchitectures([p]));
 assert.throws(()=>validateArchitectures({}));assert.throws(()=>validateArchitectures([{title:'X'}]));
});
test('architecture CRUD, links and comments survive a real JSON save and reopen',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'desk-architecture-')),file=path.join(dir,'desk.json');
 const handle={name:'desk.json',getFile:async()=>({text:async()=>readFile(file,'utf8')}),createWritable:async()=>{let text;return{write:async value=>{text=value;},close:async()=>writeFile(file,text),abort:async()=>{}};}};
 try{const store=new FileStore();await store.create(handle);const p=createArchitecture('Projeto','Contexto','topic-1','task-1');const component=addArchitectureNode(p,'actor');p.comments.push({id:'comment-disk',text:'Contexto inicial',at:new Date().toISOString(),nodeId:component.id});store.data.architectures.push(p);await store.change();p.title='Projeto revisado';p.comments[0].text='Contexto revisado';p.nodes[0].x=250;await store.change();const reopened=new FileStore();await reopened.open(handle);assert.equal(reopened.data.architectures[0].title,'Projeto revisado');assert.equal(reopened.data.architectures[0].taskId,'task-1');assert.equal(reopened.data.architectures[0].topicId,'topic-1');assert.equal(reopened.data.architectures[0].comments[0].text,'Contexto revisado');assert.equal(reopened.data.architectures[0].nodes[0].x,250);reopened.data.architectures=[];await reopened.change();assert.equal(JSON.parse(await readFile(file,'utf8')).architectures.length,0);}finally{await rm(dir,{recursive:true,force:true});}
});

test('AWS catalog components retain their type and embedded icon after JSON roundtrip',async()=>{
 const {architectureComponents}=await import('../architecture-model.js');
 const aws=architectureComponents.filter(c=>c.id.startsWith('aws-'));
 assert.equal(aws.length,872);
 assert.equal(new Set(aws.map(c=>c.id)).size,aws.length);
 for(const component of architectureComponents){
  const p=createArchitecture('Catálogo');const n=addArchitectureNode(p,component.id);
  validateArchitectures(JSON.parse(JSON.stringify([p])));
  const svg=architectureSVG(p);assert(svg.includes('data:image/'));assert(!svg.includes('undefined'));
 }
});
