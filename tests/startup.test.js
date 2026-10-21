// Lightweight DOM harness: verifies startup gates/cancellation, not browser layout or native permission UI.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {FileStore,fresh,today,attachmentError,mergeEvents,overlaps} from '../core.js';
import {ReminderEngine,reminderSettings,reminderCandidates} from '../reminders.js';
import {migrateLegacyDecisions} from '../legacy.js';
import {parseICS} from '../calendar.js';
import {periodFor,movePeriod,visibleDays,itemsForDay} from '../planner.js';
import {taskBucket,topicBucket,decisionBucket,rankTasks,taskGroups,topicGroups} from '../triage.js';
const source=(await readFile(new URL('../app.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
function setup({support=true,openError=null,content=null,writeFail=false}={}){
 const selectors=['#reminder-toasts','#reminders-button','#reminders-dialog','#fields','#fields input','#dialog-title','#form-error','#welcome','#app','#main','#save-status','#error','#filename','#welcome-error','#switch-file','#new-file','#quit-app','#open','#create','#save','#menu','#yes','#no','#confirm','#confirm-text','#close-confirm','#edit-form','#editor','#preview','#preview-image','#close-preview','nav'];const elements=Object.fromEntries(selectors.map(s=>[s,{hidden:s==='#app'||s==='#error',inert:s==='#app',disabled:false,dataset:{},textContent:'',innerHTML:'',focus(){},setAttribute(){},classList:{remove(){},add(){}},showModal(){},close(){},removeAttribute(){}}]));
 let disk=content;const listeners={},reads=[];const handle={name:'desk.json',requestPermission:async()=> 'granted',getFile:async()=>({text:async()=>disk}),createWritable:async()=>{if(writeFail)throw Error('Permission denied');let buffer;return {write:async s=>buffer=s,close:async()=>disk=buffer,abort:async()=>{}};}};
 const window={scrollTo(){},setInterval:()=>1,isSecureContext:support,addEventListener:(name,fn)=>listeners[name]=fn,showOpenFilePicker:support?async()=>{if(openError)throw openError;return [handle];}:undefined,showSaveFilePicker:support?async()=>handle:undefined};
 const document={querySelector:s=>elements[s]||null,querySelectorAll:()=>[],addEventListener(){},body:{classList:{remove(){},toggle(){},contains(){return false;}}}};
 class Reader{readAsDataURL(f){reads.push(f.name);queueMicrotask(()=>{if(f.fail){this.onerror();return;}this.result='data:'+f.type+';base64,'+f.base64;this.onload();});}}
 const context=vm.createContext({initializeShell(){},previewWebAlert(){},window,document,FileStore,today,attachmentError,mergeEvents,overlaps,parseICS,migrateLegacyDecisions,ReminderEngine,reminderSettings,reminderCandidates,periodFor,movePeriod,visibleDays,itemsForDay,taskBucket,topicBucket,decisionBucket,rankTasks,taskGroups,topicGroups,Intl,Date,crypto:globalThis.crypto,URL,Blob,clearTimeout,setTimeout:(...args)=>setTimeout(...args).unref(),FormData,FileReader:Reader});vm.runInContext(source,context);return {elements,listeners,reads,context,run:s=>vm.runInContext(s,context),disk:()=>disk};
}
test('startup: app hidden/inert until open/create succeeds',()=>{const x=setup();assert.equal(x.elements['#app'].hidden,true);assert.equal(x.elements['#app'].inert,true);assert.equal(x.elements['#welcome'].hidden,false);});
test('cancelled picker retains startup gate',async()=>{const x=setup({openError:Object.assign(Error('cancel'),{name:'AbortError'})});await x.elements['#open'].onclick();assert.equal(x.elements['#app'].hidden,true);assert.equal(x.elements['#welcome-error'].textContent,'');});
test('invalid selected JSON retains startup gate',async()=>{const x=setup({content:'{bad'});await x.elements['#open'].onclick();assert.equal(x.elements['#app'].hidden,true);assert.match(x.elements['#welcome-error'].textContent,/Não foi possível/);assert.equal(x.disk(),'{bad');});
test('create gate unlocks only after initial JSON write/close',async()=>{const x=setup();await x.elements['#create'].onclick();assert.equal(x.elements['#app'].hidden,false);assert.equal(x.elements['#app'].inert,false);assert.equal(x.elements['#welcome'].hidden,true);assert.equal(JSON.parse(x.disk()).schemaVersion,1);assert.match(x.elements['#main'].innerHTML,/Um dia de cada vez/);});
test('failed initial write never unlocks app',async()=>{const x=setup({writeFail:true});await x.elements['#create'].onclick();assert.equal(x.elements['#app'].hidden,true);assert.match(x.elements['#welcome-error'].textContent,/Permission denied/);});
test('unsupported/insecure environment blocks both actions with instructions',()=>{const x=setup({support:false});assert.equal(x.elements['#open'].disabled,true);assert.equal(x.elements['#create'].disabled,true);assert.equal(x.elements['#app'].hidden,true);assert.match(x.elements['#welcome-error'].textContent,/Chrome ou Edge.*localhost ou HTTPS/);});

test('attachments: image Base64 persists and thumbnail/preview controls are generated',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().tasks.push({id:'t',title:'Print',description:'',project:'',owner:'',due:'',priority:'média',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]})");const b=Buffer.from('png fixture');x.context.files=[{name:'print.png',type:'image/png',size:b.length,base64:b.toString('base64')}];await x.run("addAttachments('t',files)");const d=JSON.parse(x.disk());assert.equal(d.tasks[0].attachments[0].dataBase64,b.toString('base64'));assert.match(x.elements['#main'].innerHTML,/data-preview/);assert.match(x.elements['#main'].innerHTML,/<img loading="lazy"/);});
test('attachments: empty, oversized, invalid MIME and read failure preserve existing data',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().tasks.push({id:'t',title:'Print',description:'',project:'',owner:'',due:'',priority:'média',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]})");x.context.files=[{name:'keep.bin',type:'application/octet-stream',size:1,base64:'AQ=='}];await x.run("addAttachments('t',files)");x.context.files=[{name:'empty',type:'',size:0},{name:'large',type:'image/png',size:11*1048576},{name:'mime',type:'bad/type;script',size:1},{name:'unreadable',type:'image/png',size:1,fail:true}];await x.run("addAttachments('t',files)");assert.deepEqual(x.reads,['keep.bin','unreadable']);assert.equal(JSON.parse(x.disk()).tasks[0].attachments.length,1);for(const message of ['arquivo vazio','limite excedido','MIME inválido','falha de leitura'])assert(x.elements['#error'].textContent.includes(message));});

test('single agenda exposes day/week/month with recurring blocks and no duplicate navigation',async()=>{const x=setup();await x.elements['#create'].onclick();const before=x.disk();x.run("page='calendar';render()");assert(!x.elements['nav'].innerHTML.includes('data-nav="routines"'));assert.match(x.elements['nav'].innerHTML,/data-nav="calendar"/);for(const mode of ['day','week','month']){x.run(`agendaMode='${mode}';render()`);assert.match(x.elements['#main'].innerHTML,new RegExp('calendar-board '+mode));assert.match(x.elements['#main'].innerHTML,/Criar bloco recorrente/);assert.match(x.elements['#main'].innerHTML,/id="agenda-type"/);}assert.equal(x.disk(),before);});

test('work views show real counts, escaped content and actionable groups without modifying file data',async()=>{const x=setup();await x.elements['#create'].onclick();x.run(`data().tasks.push({id:'late',title:'<script>injetar</script>',description:'Rever logs',project:'API',owner:'Pessoa de teste',due:'2000-01-01',priority:'alta',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]});data().topics.push({id:'waiting',title:'Retorno pendente',context:'',owner:'Time de teste',status:'aguardando',nextStep:'Confirmar dependência',review:'2000-01-01',history:[]});data().decisions.push({id:'decision',title:'Escolha técnica',date:today(),context:'Contexto',alternatives:'Alternativas',decision:'Escolha de teste',owner:'',review:'2000-01-01'})`);const before=x.run('JSON.stringify(data())');for(const target of ['overview','tasks','topics']){x.run(`page='${target}';render()`);const html=x.elements['#main'].innerHTML;assert(!html.includes('<script>injetar</script>'));if(target==='overview'){assert.match(html,/Comece por aqui/);assert.match(html,/Depende de outra pessoa/);assert.match(html,/Seu dia em horários/);}if(target==='tasks'){assert.match(html,/Atrasada/);assert.match(html,/&lt;script&gt;/);assert.match(html,/Próximo passo/);}if(target==='topics'){assert.match(html,/Atualizar assunto/);assert.match(html,/Time de teste/);assert.match(html,/Confirmar dependência/);}if(target==='decisions'){assert.match(html,/Decisão tomada/);assert.match(html,/Escolha de teste/);assert.match(html,/Revisar registro/);}}assert.equal(x.run('JSON.stringify(data())'),before);});
test('high priority and waiting quick views include records already requiring review',async()=>{const x=setup();await x.elements['#create'].onclick();assert.equal(x.run("focusMatches('tasks',{status:'aberto',priority:'alta',due:'2000-01-01'},'high')"),true);assert.equal(x.run("focusMatches('topics',{status:'aguardando',review:'2000-01-01'},'waiting')"),true);assert.equal(x.run("focusMatches('tasks',{status:'concluído',priority:'alta'},'high')"),false);});

test('notes list keeps ideas separate and conversion creates a linked task only after form submission',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().notes='Rascunho preservado';data().ideas.push({id:'idea-1',title:'Explorar solução',content:'Pesquisar alternativas',createdAt:now(),updatedAt:now()});page='notes';render()");assert.match(x.elements['#main'].innerHTML,/Minhas ideias/);assert.match(x.elements['#main'].innerHTML,/Transformar em tarefa/);assert.equal(x.run('data().tasks.length'),0);x.run("openEditor('tasks',null,{title:data().ideas[0].title,description:data().ideas[0].content,sourceIdeaId:'idea-1'})");assert.equal(x.run('data().tasks.length'),0);x.context.testValues={title:'Explorar solução',description:'Pesquisar alternativas',project:'',owner:'',due:'',priority:'média',status:'aberto'};x.run('FormData=class { constructor(){return Object.entries(testValues);} }');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");const disk=JSON.parse(x.disk());assert.equal(disk.tasks.length,1);assert.equal(disk.tasks[0].sourceIdeaId,'idea-1');assert.equal(disk.ideas.length,1);assert.equal(disk.notes,'Rascunho preservado');assert.match(x.elements['#main'].innerHTML,/Ver tarefa/);assert(!x.elements['#main'].innerHTML.includes('data-idea-task='));});
test('context updates append with timestamps and are searchable without creating tasks',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().ideas.push({id:'context',title:'Integração',content:'Contexto inicial',recordType:'history',createdAt:now(),updatedAt:now(),history:[{id:'old',at:now(),text:'Primeira conversa'}]});page='notes';openRecordUpdate(data().ideas[0])");x.context.testValues={content:'Retorno sobre dependência Zeta'};x.run('FormData=class{constructor(){return Object.entries(testValues)}}');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");const disk=JSON.parse(x.disk());assert.equal(disk.ideas[0].history.length,2);assert.equal(disk.ideas[0].history[0].text,'Primeira conversa');assert(Number.isFinite(Date.parse(disk.ideas[0].history[1].at)));assert.equal(disk.tasks.length,0);x.run("query='zeta';render()");assert.match(x.elements['#main'].innerHTML,/Integração/);assert.match(x.elements['#main'].innerHTML,/Retorno sobre dependência Zeta/);assert.match(x.elements['#main'].innerHTML,/context-history\" open/);x.run("query='inexistente-xyz';render()");assert.match(x.elements['#main'].innerHTML,/Nenhum registro encontrado/);});

test('reminders produce visual and permitted browser notifications once, without requesting permission automatically',async()=>{const x=setup();await x.elements['#create'].onclick();const notifications=[];x.context.Notification=class{static permission='granted';constructor(title,options){notifications.push({title,options})}};x.run("data().settings.reminders={enabled:true,minutesBefore:10,sound:false,desktop:true,routines:true,events:true};data().calendarEvents.push({source:'Outlook',sourceEventId:'notify',title:'Compromisso de teste',start:new Date(Date.now()+5*60000).toISOString(),end:new Date(Date.now()+60*60000).toISOString()});checkReminders()");assert.equal(notifications.length,1);assert.match(x.elements['#reminder-toasts'].innerHTML,/Compromisso de teste/);assert.match(x.elements['#reminder-toasts'].innerHTML,/Começa em/);x.run('checkReminders()');assert.equal(notifications.length,1);x.context.Notification.permission='denied';x.run("data().calendarEvents.push({source:'Outlook',sourceEventId:'second',title:'Outro compromisso',start:new Date(Date.now()+5*60000).toISOString(),end:new Date(Date.now()+60*60000).toISOString()});checkReminders()");assert.equal(notifications.length,1);assert.match(x.elements['#reminder-toasts'].innerHTML,/Outro compromisso/);});
test('manual timelines append in tasks, topics and decisions while preserving legacy topic entries',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().tasks.push({id:'t',title:'Tarefa',description:'',project:'',owner:'',due:'',priority:'média',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]});data().topics.push({id:'p',title:'Assunto',context:'',owner:'',status:'acompanhar',nextStep:'',review:'',history:[{at:now(),text:'Histórico antigo'}]});data().decisions.push({id:'d',title:'Decisão',date:today(),context:'',alternatives:'',decision:'Escolha',owner:'',review:''})");for(const kind of ['tasks','topics','decisions']){x.run(`page='${kind==='decisions'?'topics':kind}';openRecordUpdate(data()['${kind}'][0],'${kind}')`);x.context.testValues={content:'Contexto pesquisável da atualização'};x.run('FormData=class{constructor(){return Object.entries(testValues)}}');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");const html=x.elements['#main'].innerHTML;assert.match(html,/Histórico de atualizações|O que aconteceu|Ver contexto e histórico/);assert.match(html,/context-timeline/);assert.match(html,/Contexto pesquisável/);x.run("query='pesquisável';render()");assert(!x.elements['#main'].innerHTML.includes('Nenhuma tarefa nesta visão'));x.run("query=''");}const disk=JSON.parse(x.disk());assert.equal(disk.tasks[0].history.length,1);assert.equal(disk.topics[0].history.length,2);assert.equal(disk.topics[0].history[0].text,'Histórico antigo');assert.equal(disk.decisions[0].history.length,1);});
test('editing a task records actual old/new fields but an unchanged submit creates no extra timeline entry',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().tasks.push({id:'t',title:'Título antigo',description:'',project:'',owner:'',due:'',priority:'média',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]});openEditor('tasks',data().tasks[0])");x.context.testValues={title:'Título novo',description:'',project:'',owner:'',due:'',priority:'alta',status:'aberto'};x.run('FormData=class{constructor(){return Object.entries(testValues)}}');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");let disk=JSON.parse(x.disk());assert.match(disk.tasks[0].history[0].text,/Título antigo → Título novo/);assert.match(disk.tasks[0].history[0].text,/Prioridade: média → alta/);x.run("openEditor('tasks',data().tasks[0])");await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");assert.equal(JSON.parse(x.disk()).tasks[0].history.length,1);});
test('task and subject forms contain explicit time controls and save entered hours',async()=>{const x=setup();await x.elements['#create'].onclick();const fixtures={tasks:{title:'Prazo',description:'',project:'',owner:'',due:'2026-11-01',dueTime:'14:30',priority:'média',status:'aberto'},topics:{title:'Assunto',context:'',owner:'',status:'acompanhar',nextStep:'',review:'2026-11-02',reviewTime:'15:45'},decisions:{title:'Decisão',date:'2026-10-20',dateTime:'09:00',context:'',alternatives:'',decision:'Escolha',owner:'',review:'2026-11-03',reviewTime:'16:15'}};for(const [kind,values] of Object.entries(fixtures).filter(([kind])=>kind!=='decisions')){x.run(`openEditor('${kind}')`);assert.match(x.elements['#fields'].innerHTML,/data e hora/);assert.match(x.elements['#fields'].innerHTML,new RegExp('name="'+(kind==='tasks'?'dueTime':'reviewTime')+'" type="time"'));x.context.testValues=values;x.run('FormData=class{constructor(){return Object.entries(testValues)}}');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");const saved=JSON.parse(x.disk())[kind][0];assert.equal(saved[kind==='tasks'?'dueTime':'reviewTime'],values[kind==='tasks'?'dueTime':'reviewTime']);}});

test('agenda type filter includes existing recurring blocks without modifying schedules or alert candidates',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().routines.push({id:'r',title:'Foco recorrente',day:new Date().getDay(),time:'14:00',note:''});data().tasks.push({id:'t',title:'Prazo',status:'aberto',due:today(),dueTime:'15:00',priority:'alta'});agendaType='routine'");assert.equal(x.run('agendaItems(today()).length'),1);assert.equal(x.run('agendaItems(today())[0].title'),'Foco recorrente');x.run("agendaType='task'");assert.equal(x.run('agendaItems(today())[0].kind'),'task');x.run("agendaType=''");assert.equal(x.run('agendaItems(today()).length'),2);assert.equal(x.run('data().routines.length'),1);});

test('simple subjects use one list, no metric dashboard, and only a timeline inside the subject',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().topics.push({id:'simple',title:'Assunto simples',context:'Contexto',nextStep:'Falar com o time',owner:'Responsável',status:'acompanhar',review:'',history:[]});page='topics';render()");const html=x.elements['#main'].innerHTML;assert.match(html,/simple-subject-list/);assert.match(html,/Assunto simples/);assert.match(html,/Falar com o time/);assert.match(html,/Atualizar assunto/);assert(!html.includes('O que foi decidido'));assert(!html.includes('metrics-grid'));assert(!html.includes('data-new="decisions"'));assert(!html.includes('Decisões a organizar'));assert(!html.includes('data-topic-decision='));});
test('opening an old file migrates records into timeline and writes to the same JSON without decision controls',async()=>{const original=fresh();original.decisions=[{id:'old',title:'Assunto antigo',date:'2026-10-20',context:'Contexto',alternatives:'Alternativas',decision:'Texto preservado',owner:'',review:'',history:[]}];const x=setup({content:JSON.stringify(original)});await x.elements['#open'].onclick();x.run("page='topics';render()");const saved=JSON.parse(x.disk());assert.equal(saved.decisions.length,0);assert.equal(saved.topics.length,1);assert(saved.topics[0].history.some(h=>h.text.includes('Texto preservado')));const html=x.elements['#main'].innerHTML;assert.match(html,/Texto preservado/);assert(!html.includes('Registrar decisão'));assert(!html.includes('data-new="decisions"'));assert(!html.includes('data-edit="decisions"'));});

test('simple tasks use one expandable list and preserve content across open/completed/all views',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().tasks.push({id:'open',title:'Tarefa aberta',description:'Detalhes preservados',project:'Projeto',owner:'Pessoa',due:today(),dueTime:'14:30',priority:'alta',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[],history:[{at:now(),text:'Conversa preservada'}]},{id:'done',title:'Tarefa finalizada',description:'',project:'',owner:'',due:'',priority:'baixa',status:'concluído',createdAt:now(),updatedAt:now(),attachments:[]});page='tasks';taskView='open';render()");let html=x.elements['#main'].innerHTML;assert.match(html,/simple-task-list/);assert.match(html,/14:30/);assert.match(html,/Detalhes preservados/);assert.match(html,/Conversa preservada/);assert.match(html,/Anexos/);assert(!html.includes('Tarefa finalizada'));assert(!html.includes('metrics-grid'));assert(!html.includes('work-group'));const before=x.run('JSON.stringify(data())');x.run("taskView='done';render()");assert.match(x.elements['#main'].innerHTML,/Tarefa finalizada/);assert(!x.elements['#main'].innerHTML.includes('Tarefa aberta'));x.run("taskView='all';render()");assert.match(x.elements['#main'].innerHTML,/Tarefa aberta/);assert.match(x.elements['#main'].innerHTML,/Tarefa finalizada/);assert.equal(x.run('JSON.stringify(data())'),before);});
test('task cards show explicit state buttons without checkbox and transitions preserve subject status',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().topics.push({id:'p',title:'Assunto',context:'',owner:'',status:'aguardando',nextStep:'',review:'',history:[]});data().tasks.push({id:'t',title:'Ação',description:'',project:'',owner:'',due:today(),priority:'alta',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[],topicId:'p'});page='tasks';render()");let html=x.elements['#main'].innerHTML;assert.match(html,/data-complete-task="t"/);assert.match(html,/data-start-task="t"/);assert(!html.includes('type="checkbox"'));await x.run("setTaskStatus('t','em andamento')");assert.equal(JSON.parse(x.disk()).tasks[0].status,'em andamento');assert.match(x.elements['#main'].innerHTML,/Em andamento/);assert(!x.elements['#main'].innerHTML.includes('data-start-task="t"'));await x.run("setTaskStatus('t',true)");assert.equal(JSON.parse(x.disk()).tasks[0].status,'concluído');x.run("taskView='done';render()");assert.match(x.elements['#main'].innerHTML,/Reabrir/);await x.run("setTaskStatus('t',false)");const d=JSON.parse(x.disk());assert.equal(d.tasks[0].status,'aberto');assert.equal(d.tasks[0].history.length,3);assert.equal(d.topics[0].status,'aguardando');});
test('task association is visible in both directions and moving/unlinking never deletes records',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("for(const id of ['one','two'])data().topics.push({id,title:'Assunto '+id,context:'',owner:'',status:'acompanhar',nextStep:'',review:'',history:[]});data().tasks.push({id:'t',title:'Ação vinculada',description:'',project:'',owner:'',due:'',priority:'média',status:'aberto',createdAt:now(),updatedAt:now(),attachments:[]});linkTaskToTopic(data().tasks[0],'one');page='tasks';render()");assert.match(x.elements['#main'].innerHTML,/data-open-subject="one"/);x.run("page='topics';render()");assert.match(x.elements['#main'].innerHTML,/data-open-task="t"/);x.run("linkTaskToTopic(data().tasks[0],'two');linkTaskToTopic(data().tasks[0],'')");assert.equal(x.run('data().tasks.length'),1);assert.equal(x.run('data().topics.length'),2);assert.equal(x.run('data().tasks[0].topicId'),'');assert.equal(x.run('data().tasks[0].history.length'),3);});
test('creating a task from a subject and associating an existing one save a valid shared link',async()=>{const x=setup();await x.elements['#create'].onclick();x.run("data().topics.push({id:'p',title:'Assunto',context:'',owner:'Pessoa',status:'acompanhar',nextStep:'Próximo passo',review:'',history:[]});openEditor('tasks',null,{topicId:'p',owner:'Pessoa',description:'Próximo passo'})");assert.match(x.elements['#fields'].innerHTML,/value="p" selected/);x.context.testValues={title:'Nova ação',description:'Próximo passo',topicId:'p',project:'',owner:'Pessoa',due:'',dueTime:'',priority:'média',status:'em andamento'};x.run('FormData=class{constructor(){return Object.entries(testValues)}}');await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");let d=JSON.parse(x.disk());assert.equal(d.tasks[0].topicId,'p');assert.equal(d.tasks[0].status,'em andamento');x.run("linkTaskToTopic(data().tasks[0],'');openTaskLinkDialog(data().topics[0])");x.context.testValues={taskId:d.tasks[0].id};await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");d=JSON.parse(x.disk());assert.equal(d.tasks.length,1);assert.equal(d.tasks[0].topicId,'p');});

test('notes create only ideas and retain editing of legacy histories',async()=>{
 const x=setup();await x.elements['#create'].onclick();
 x.run("page='notes';render()");
 const html=x.elements['#main'].innerHTML;
 assert(!html.includes('save-context'));assert(!html.includes('Guardar como histórico'));assert(!html.includes('Históricos de assuntos'));assert(!html.includes('<option value="history"'));
 assert(html.includes('save-idea'));assert(html.includes('note-task'));
 x.run("openEditor('ideas',null,{recordType:'history',title:'Ideia',content:'Detalhes'})");
 assert(!x.elements['#fields'].innerHTML.includes('name="recordType"'));
 x.context.testValues={title:'Ideia',content:'Detalhes'};
 x.run('FormData=class{constructor(){return Object.entries(testValues)}}');
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 assert.equal(JSON.parse(x.disk()).ideas[0].recordType,'idea');
 x.run("data().ideas.push({id:'legacy-history',title:'Antigo',content:'Contexto',recordType:'history',createdAt:now(),updatedAt:now(),history:[{id:'entry',at:now(),text:'Conversa preservada'}]});openEditor('ideas',data().ideas[1])");
 assert(!x.elements['#fields'].innerHTML.includes('name="recordType"'));
 x.context.testValues={title:'Antigo editado',content:'Contexto editado'};
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 const legacy=JSON.parse(x.disk()).ideas[1];
 assert.equal(legacy.recordType,'history');assert.equal(legacy.history[0].text,'Conversa preservada');
 assert.equal(legacy.content,'Contexto editado');assert.equal(x.run('data().tasks.length'),0);
});

test('reminder sound resumes audio, plays an audible repeated pattern and releases nodes',async()=>{
 const x=setup(),tones=[],gains=[];let resumes=0;await x.elements['#create'].onclick();
 x.context.window.AudioContext=class{
  state='suspended';currentTime=10;destination={};
  async resume(){resumes++;this.state='running';}
  createOscillator(){const tone={frequency:{},connect(){},start(at){this.started=at;},stop(at){this.stopped=at;},disconnect(){this.released=true;}};tones.push(tone);return tone;}
  createGain(){const gain={events:[],connect(){},disconnect(){this.released=true;}};
   gain.gain=Object.fromEntries(['setValueAtTime','linearRampToValueAtTime','exponentialRampToValueAtTime'].map(method=>[method,(value,at)=>gain.events.push({method,value,at})]));gains.push(gain);return gain;}
 };
 await x.run('playReminderSound()');
 assert.equal(resumes,1);assert.equal(tones.length,6);
 assert(tones.at(-1).stopped-tones[0].started>2);
 assert.deepEqual(tones.slice(0,3).map(t=>t.frequency.value),tones.slice(3).map(t=>t.frequency.value));
 for(const [i,tone] of tones.entries()){
  assert.equal(tone.type,'triangle');
  assert(gains[i].events.some(e=>e.method==='linearRampToValueAtTime'&&e.value>=.6));
  assert(gains[i].events.every(e=>e.value>=0&&e.value<=1));
  tone.onended();assert(tone.released);assert(gains[i].released);
 }
 const patterns=[];
 for(const key of ['classic','bell','urgent','rising','digital']){const before=tones.length;await x.run(`playReminderSound('${key}')`);patterns.push(JSON.stringify(tones.slice(before).map(t=>[t.type,t.frequency.value,t.started])));}
 assert.equal(new Set(patterns).size,5);
});

test('sound selector previews unsaved choice and persists selection in JSON',async()=>{
 const x=setup();await x.elements['#create'].onclick();
 const html=x.run('reminderPanel()');
 for(const title of ['Alerta clássico','Campainha','Alerta insistente','Chamada crescente','Toque digital'])assert(html.includes(title));
 for(const selector of ['#close-reminders','#permit-notifications','#test-reminder-sound','#test-desktop-notification','#reminder-volume','#reminder-volume-value','#reminder-settings','#reminder-sound'])x.elements[selector]={value:'digital'};
 x.run("bindReminderPanel();playReminderSound=async key=>{globalThis.previewKey=key}");
 await x.elements['#test-reminder-sound'].onclick();
 assert.equal(x.context.previewKey,'digital');
 assert.equal(x.run('reminderSettings(data()).soundId'),'classic');
 x.run("FormData=class{has(key){return key==='sound'}get(key){return key==='soundId'?'digital':key==='minutesBefore'?'10':null}}");
 await x.elements['#reminder-settings'].onsubmit({preventDefault(){},target:{}});
 assert.equal(JSON.parse(x.disk()).settings.reminders.soundId,'digital');
 assert.match(x.run('reminderPanel()'),/value="digital" selected/);
});

test('agenda omits redundant alert settings banner',async()=>{
 const x=setup();await x.elements['#create'].onclick();
 x.run("page='calendar';render()");
 const html=x.elements['#main'].innerHTML;
 assert(html.includes('planner-controls'));
 assert(!html.includes('planner-alert-bar'));
 assert(!html.includes('planner-reminder-status'));
 assert(!html.includes('Configurar alertas'));
 assert.equal(typeof x.elements['#reminders-button'].onclick,'function');
});

test('feedback create, direction tabs, search, editing and updates persist in the same JSON',async()=>{
 const x=setup();await x.elements['#create'].onclick();
 x.run("page='feedbacks';render();openEditor('feedbacks')");
 assert.match(x.elements['#main'].innerHTML,/A compartilhar/);
 assert.match(x.elements['#main'].innerHTML,/Recebidos/);
 assert.match(x.elements['#fields'].innerHTML,/name="person"/);
 x.context.testValues={title:'Alinhamento',person:'Ana',relationship:'PM',direction:'received',status:'refletir',date:'2026-10-20',context:'Planejamento',content:'Explicar prioridades',nextStep:'Preparar exemplos',review:'2026-11-01',reviewTime:'14:00'};
 x.run('FormData=class{constructor(){return Object.entries(testValues)}}');
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 let f=JSON.parse(x.disk()).feedbacks[0];
 assert.equal(f.person,'Ana');assert.equal(f.direction,'received');assert.equal(f.history.length,1);
 assert.match(x.elements['#main'].innerHTML,/Alinhamento/);
 x.run("feedbackView='share';render()");assert(!x.elements['#main'].innerHTML.includes('Alinhamento'));
 x.run("feedbackView='all';query='ana';render()");assert.match(x.elements['#main'].innerHTML,/Alinhamento/);
 x.run("openRecordUpdate(data().feedbacks[0],'feedbacks')");
 x.context.testValues={content:'Combinado revisar na próxima conversa'};
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 assert.equal(JSON.parse(x.disk()).feedbacks[0].history.length,2);
 x.run("query='próxima conversa';render()");assert.match(x.elements['#main'].innerHTML,/Alinhamento/);
 const reopened=setup({content:x.disk()});await reopened.elements['#open'].onclick();
 assert.equal(reopened.run('data().feedbacks[0].history.length'),2);
 assert.equal(reopened.run('data().tasks.length'),0);
 x.run("openEditor('feedbacks',data().feedbacks[0])");
 x.context.testValues={...f,title:'Alinhamento revisado'};delete x.context.testValues.history;delete x.context.testValues.createdAt;delete x.context.testValues.updatedAt;
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 assert.equal(JSON.parse(x.disk()).feedbacks[0].title,'Alinhamento revisado');
});

test('task can link to feedback and reopen without copying or changing it',async()=>{
 const x=setup();await x.elements['#create'].onclick();
 x.run("data().feedbacks.push({id:'f',title:'Conversa',person:'Ana',relationship:'Time',direction:'share',status:'preparar',date:'',context:'',content:'',nextStep:'',review:'',reviewTime:'',createdAt:now(),updatedAt:now(),history:[]});openEditor('tasks',null,{feedbackId:'f'})");
 assert.match(x.elements['#fields'].innerHTML,/value="f" selected/);
 x.context.testValues={title:'Ação',description:'Exemplos',feedbackId:'f',topicId:'',project:'',owner:'',due:'',dueTime:'',priority:'média',status:'aberto'};
 x.run('FormData=class{constructor(){return Object.entries(testValues)}}');
 await x.run("document.querySelector('#edit-form').onsubmit({preventDefault(){},target:{}})");
 assert.equal(JSON.parse(x.disk()).tasks[0].feedbackId,'f');
 x.run("page='feedbacks';render()");assert.match(x.elements['#main'].innerHTML,/Ação/);
 const reopened=setup({content:x.disk()});await reopened.elements['#open'].onclick();
 assert.equal(reopened.run('data().tasks[0].feedbackId'),'f');
});

