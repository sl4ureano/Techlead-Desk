import {validateArchitectures} from './architecture-model.js';
export const today = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const fresh = () => ({schemaVersion:1,updatedAt:new Date().toISOString(),architectures:[],tasks:[],topics:[],decisions:[],routines:[],notes:'',ideas:[],feedbacks:[],calendarEvents:[],calendarImports:[],settings:{fileLimitMB:10,taskLimitMB:25}});
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
const dateOnly=x=>/^\d{4}-\d{2}-\d{2}$/.test(x)&&today(new Date(x+'T12:00:00'))===x;
export function attachmentError(a){
 if(!obj(a)||!['id','name','mimeType','addedAt','dataBase64'].every(k=>typeof a[k]==='string')||!a.id||!a.name)return 'metadados incompletos';
 if(!Number.isSafeInteger(a.size)||a.size<=0)return 'tamanho inválido';
 if(!/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/.test(a.mimeType))return 'MIME inválido';
 if(!Number.isFinite(Date.parse(a.addedAt)))return 'data inválida';
 if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a.dataBase64))return 'Base64 inválido';
 const size=a.dataBase64.length*3/4-(a.dataBase64.endsWith('==')?2:a.dataBase64.endsWith('=')?1:0);
 if(size!==a.size)return 'conteúdo e tamanho divergentes';return '';
}
export function validate(data){
 if(!obj(data)||data.schemaVersion!==1)throw Error('Formato ou versão incompatível. Esperado schemaVersion: 1.');
 if(typeof data.notes!=='string'||typeof data.updatedAt!=='string'||!Number.isFinite(Date.parse(data.updatedAt)))throw Error('Notas ou data de atualização inválidas.');
 const rules={tasks:{title:'string',description:'string',project:'string',owner:'string',due:'string',priority:['alta','média','baixa'],status:['aberto','em andamento','concluído']},topics:{title:'string',context:'string',owner:'string',status:['acompanhar','aguardando','em andamento','resolvido'],nextStep:'string',review:'string'},decisions:{title:'string',date:'string',context:'string',alternatives:'string',decision:'string',owner:'string',review:'string'},routines:{title:'string',day:'number',time:'string',note:'string'}};
 if(data.feedbacks!==undefined&&!Array.isArray(data.feedbacks))throw Error('Lista de feedbacks inválida.');
 if(data.feedbacks!==undefined)rules.feedbacks={title:'string',person:'string',relationship:'string',direction:['share','received'],status:['preparar','conversar','refletir','agir','acompanhar','encerrado'],context:'string',content:'string',nextStep:'string',date:'string',review:'string'};
 const warnings=[];
 for(const [key,fields] of Object.entries(rules)){
  if(!Array.isArray(data[key]))throw Error(`Campo ${key} precisa ser uma lista.`);
  const ids=new Set();for(const item of data[key]){
   if(!obj(item)||typeof item.id!=='string'||!item.id||ids.has(item.id))throw Error(`${key}: identificador ausente ou duplicado.`);ids.add(item.id);
   for(const [k,type] of Object.entries(fields)){if(Array.isArray(type)?!type.includes(item[k]):typeof item[k]!==type)throw Error(`${key}: campo ${k} inválido.`);}
   if(key==='feedbacks'&&!item.person.trim())throw Error('Pessoa do feedback obrigatória.');
   if(!item.title.trim())throw Error(`${key}: título vazio.`);
   for(const k of ['due','review','date'])if(item[k]&&!dateOnly(item[k]))throw Error(`${key}: ${k} inválido.`);
   if(key==='tasks'&&item.feedbackId!==undefined&&typeof item.feedbackId!=='string')throw Error('Vínculo de feedback inválido.');
   if(key==='tasks'&&item.topicId!==undefined&&typeof item.topicId!=='string')throw Error('Vínculo de assunto na tarefa inválido.');
   if(key==='decisions'&&item.topicId!==undefined&&typeof item.topicId!=='string')throw Error('Vínculo de decisão inválido.');
   if(key==='topics'&&item.decisionState!==undefined&&!['none','pending'].includes(item.decisionState))throw Error('Estado de decisão pendente inválido.');
   if(key==='topics'&&item.followUps!==undefined){if(!Array.isArray(item.followUps))throw Error('Lembretes do assunto inválidos.');for(const f of item.followUps)if(!obj(f)||typeof f.id!=='string'||typeof f.title!=='string'||typeof f.date!=='string'||!dateOnly(f.date)||typeof f.time!=='string'||(f.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(f.time)))throw Error('Lembrete de assunto inválido.');}
   for(const [clock,date] of [['dueTime','due'],['reviewTime','review'],['dateTime','date']])if(item[clock]!==undefined&&(typeof item[clock]!=='string'||(item[clock]&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(item[clock])||!item[date]))))throw Error(`${key}: horário ${clock} inválido ou sem data.`);
   if(key==='routines'&&(!Number.isInteger(item.day)||item.day<0||item.day>6||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)))throw Error('Rotina: dia ou horário inválido.');
   if(['tasks','feedbacks'].includes(key)&&(!['createdAt','updatedAt'].every(k=>typeof item[k]==='string'&&Number.isFinite(Date.parse(item[k])))))throw Error('Tarefa: datas de criação/atualização inválidas.');
   if(key==='tasks'&&item.attachments!==undefined&&!Array.isArray(item.attachments))throw Error('Lista de anexos inválida.');
   for(const a of item.attachments||[]){const err=attachmentError(a);if(err)warnings.push(`Tarefa “${item.title}”: anexo “${a?.name||'sem nome'}” indisponível (${err}). Mantido no arquivo.`);}
   if(['tasks','topics','decisions','feedbacks'].includes(key)&&(item.history!==undefined||key==='topics')){
    if(!Array.isArray(item.history))throw Error(`${key}: histórico inválido.`);
    const historyIds=new Set();for(const h of item.history){if(!obj(h)||typeof h.at!=='string'||!Number.isFinite(Date.parse(h.at))||typeof h.text!=='string'||(h.id!==undefined&&(typeof h.id!=='string'||!h.id||historyIds.has(h.id))))throw Error(`${key}: atualização de histórico inválida.`);if(h.id!==undefined)historyIds.add(h.id);}
   }
  }
 }
 if(data.ideas!==undefined){
  if(!Array.isArray(data.ideas))throw Error('A lista de ideias é inválida.');
  const ids=new Set();
  for(const idea of data.ideas){
   if(!obj(idea)||typeof idea.id!=='string'||!idea.id||ids.has(idea.id)||typeof idea.title!=='string'||!idea.title.trim()||typeof idea.content!=='string'||!['createdAt','updatedAt'].every(k=>typeof idea[k]==='string'&&Number.isFinite(Date.parse(idea[k]))))throw Error('Ideia com título, conteúdo, identificador ou datas inválidos.');
   if(idea.recordType!==undefined&&!['idea','history'].includes(idea.recordType))throw Error('Tipo de registro de nota inválido.');
   if(idea.history!==undefined){
    if(!Array.isArray(idea.history))throw Error('Histórico de nota inválido.');
    const historyIds=new Set();for(const h of idea.history){if(!obj(h)||typeof h.id!=='string'||!h.id||historyIds.has(h.id)||typeof h.at!=='string'||!Number.isFinite(Date.parse(h.at))||typeof h.text!=='string'||!h.text.trim())throw Error('Atualização de nota inválida.');historyIds.add(h.id);}
   }
   ids.add(idea.id);
  }
 }
 if(data.calendarEvents!==undefined&&!Array.isArray(data.calendarEvents))throw Error('Lista de eventos inválida.');
 const eventIds=new Set();for(const e of data.calendarEvents||[]){if(!obj(e)||!['source','sourceEventId','title','start','end','timeZone','syncedAt'].every(k=>typeof e[k]==='string')||!e.source||!e.sourceEventId||!Number.isFinite(Date.parse(e.start))||!Number.isFinite(Date.parse(e.end))||Date.parse(e.end)<=Date.parse(e.start))throw Error('Evento de calendário inválido.');const key=JSON.stringify([e.source,e.sourceEventId]);if(eventIds.has(key))throw Error('Eventos duplicados no arquivo.');eventIds.add(key);}
 if(data.calendarImports!==undefined&&(!Array.isArray(data.calendarImports)||data.calendarImports.some(x=>!obj(x)||typeof x.source!=='string'||typeof x.syncedAt!=='string')))throw Error('Metadados de importação inválidos.');
 if(data.settings!==undefined&&(!obj(data.settings)||!['fileLimitMB','taskLimitMB'].every(k=>Number.isFinite(data.settings[k])&&data.settings[k]>0&&data.settings[k]<=100)))throw Error('Limites de anexos inválidos (0 a 100 MB).');
 if(data.settings?.reminders!==undefined){const r=data.settings.reminders;if(r&&r.soundId!==undefined&&!['classic','bell','urgent','rising','digital'].includes(r.soundId))throw Error('Som de alerta inválido.');if(r&&r.volume!==undefined&&(!Number.isFinite(r.volume)||r.volume<0||r.volume>100))throw Error('Volume de alerta inválido (0 a 100).');if(r&&r.desktopPosition!==undefined&&!['center','top-right','bottom-right','top-left','bottom-left'].includes(r.desktopPosition))throw Error('Posição de alerta inválida.');if(r&&r.desktopDuration!==undefined&&(!Number.isInteger(r.desktopDuration)||r.desktopDuration<3||r.desktopDuration>120))throw Error('Tempo de alerta inválido (3 a 120 segundos).');if(r&&r.work!==undefined&&typeof r.work!=='boolean')throw Error('Preferência de alertas de tarefas inválida.');if(!obj(r)||!['enabled','sound','desktop','routines','events'].every(k=>typeof r[k]==='boolean')||![5,10,15,30,60].includes(r.minutesBefore))throw Error('Preferências de alertas inválidas.');}
 validateArchitectures(data.architectures);
 return warnings;
}
export class FileStore{
 constructor(onStatus=()=>{}){this.handle=null;this.data=null;this.revision=0;this.savedRevision=0;this.running=null;this.failed=false;this.onStatus=onStatus;}
 async open(handle){const parsed=JSON.parse(await (await handle.getFile()).text());const warnings=validate(parsed);this.handle=handle;this.data=parsed;this.revision=this.savedRevision=0;this.failed=false;return warnings;}
 async create(handle){const data=fresh();const stream=await handle.createWritable();try{await stream.write(JSON.stringify(data,null,2));await stream.close();}catch(e){try{await stream.abort();}catch{}throw e;}this.handle=handle;this.data=data;this.revision=this.savedRevision=0;this.failed=false;}
 change(){if(!this.data)throw Error('Nenhum arquivo aberto.');this.data.updatedAt=new Date().toISOString();this.revision++;return this.flush();}
 get dirty(){return this.revision!==this.savedRevision;}
 async flush(){
  if(this.running){await this.running;if(this.dirty)return this.flush();return;}
  if(!this.dirty)return;
  this.running=(async()=>{try{while(this.dirty){const rev=this.revision;const json=JSON.stringify(this.data,null,2);this.onStatus('saving');const writable=await this.handle.createWritable();try{await writable.write(json);await writable.close();}catch(e){try{await writable.abort();}catch{}throw e;}this.savedRevision=rev;}this.failed=false;this.onStatus('saved');}catch(e){this.failed=true;this.onStatus('error',e);throw e;}})();
  try{await this.running;}finally{this.running=null;}
 }
}
export function mergeEvents(data,events,source,from,to){
 data.calendarEvents??=[];data.calendarImports??=[];const seen=new Set(events.map(e=>e.sourceEventId));
 for(const old of data.calendarEvents){if(old.source===source&&old.start<to&&old.end>from&&!seen.has(old.sourceEventId))old.sourceStatus='indisponível na origem';}
 for(const e of events){const old=data.calendarEvents.find(x=>x.source===source&&x.sourceEventId===e.sourceEventId);if(old)Object.assign(old,e);else data.calendarEvents.push(e);}
 const meta={source,from,to,syncedAt:new Date().toISOString()};const old=data.calendarImports.find(x=>x.source===source);if(old)Object.assign(old,meta);else data.calendarImports.push(meta);
}
export const overlaps=(a,b)=>!a.cancelled&&!b.cancelled&&a.start<b.end&&b.start<a.end;

