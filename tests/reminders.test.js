import {migrateLegacyDecisions} from '../legacy.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,validate} from '../core.js';
import {ReminderEngine,reminderDefaults,reminderCandidates} from '../reminders.js';
const base=()=>{const d=fresh();d.settings.reminders={...reminderDefaults,enabled:true};return d;};
const event=(id='e',extra={})=>({source:'Outlook',sourceEventId:id,title:'Reunião',start:new Date(2026,9,20,10).toISOString(),end:new Date(2026,9,20,11).toISOString(),...extra});
const stamp=(h,m=0)=>+new Date(2026,9,20,h,m);
test('before and start alerts fire once each across repeated polls',()=>{const d=base();d.calendarEvents=[event()];const engine=new ReminderEngine();assert.equal(engine.poll(d,stamp(9,49)).length,0);assert.equal(engine.poll(d,stamp(9,50))[0].minutes,10);assert.equal(engine.poll(d,stamp(9,51)).length,0);assert.equal(engine.poll(d,stamp(10))[0].stage,'started');assert.equal(engine.poll(d,stamp(10,1)).length,0);});
test('same-time meetings stay independent; canceled, unavailable, all-day and ended events do not alert',()=>{const d=base();d.calendarEvents=[event('a'),event('b'),event('cancel',{cancelled:true}),event('unavailable',{sourceStatus:'indisponível na origem'}),event('day',{allDay:true}),event('ended',{end:new Date(2026,9,20,9,40).toISOString()})];const alerts=new ReminderEngine().poll(d,stamp(9,50));assert.equal(alerts.length,2);assert.notEqual(alerts[0].id,alerts[1].id);});
test('routine tomorrow warns before midnight and once again at start',()=>{const d=base(),when=new Date(2026,9,21,0,5);d.routines=[{id:'r',title:'Rotina',day:when.getDay(),time:'00:05'}];const engine=new ReminderEngine();const first=engine.poll(d,+new Date(2026,9,20,23,55));assert.equal(first.length,1);assert.equal(first[0].kind,'routine');assert.equal(engine.poll(d,+when)[0].stage,'started');});
test('disabled alerts and source toggles are respected; preference validation keeps old files compatible',()=>{const d=base();d.calendarEvents=[event()];d.settings.reminders.enabled=false;assert.equal(new ReminderEngine().poll(d,stamp(9,50)).length,0);d.settings.reminders.enabled=true;d.settings.reminders.events=false;assert.equal(reminderCandidates(d,stamp(9,50)).length,0);validate(fresh());d.settings.reminders.minutesBefore=999;assert.throws(()=>validate(d));});
test('late timers within grace recover start, but never replay old events or missed pre-alert',()=>{const d=base();d.calendarEvents=[event()];const engine=new ReminderEngine();assert.equal(engine.poll(d,stamp(10,3))[0].lateMinutes,3);assert.equal(engine.poll(d,stamp(10,4)).length,0);assert.equal(new ReminderEngine().poll(d,stamp(10,11)).length,0);});
test('rescheduled and next-week occurrences have new identities; same import does not duplicate',()=>{const d=base();d.calendarEvents=[event()];const engine=new ReminderEngine();assert.equal(engine.poll(d,stamp(9,50)).length,1);d.calendarEvents=[event()];assert.equal(engine.poll(d,stamp(9,51)).length,0);d.calendarEvents[0].start=new Date(2026,9,20,10,5).toISOString();assert.equal(engine.poll(d,stamp(9,55)).length,1);});
test('tasks/topic/decision clocks trigger before and at scheduled time; old date-only records do not alert',()=>{const d=base();d.tasks=[{id:'t',title:'Prazo',status:'aberto',due:'2026-10-20',dueTime:'10:00'},{id:'legacy',title:'Sem hora',status:'aberto',due:'2026-10-20'}];d.topics=[{id:'p',title:'Acompanhar',status:'aguardando',review:'2026-10-20',reviewTime:'10:00'}];d.decisions=[{id:'d',title:'Revisar',review:'2026-10-20',reviewTime:'10:00'}];migrateLegacyDecisions(d);const engine=new ReminderEngine();const before=engine.poll(d,stamp(9,50));assert.deepEqual(before.map(x=>x.kind).sort(),['task','topic','topic']);assert.equal(engine.poll(d,stamp(10)).length,3);d.tasks[0].status='concluído';d.topics[0].status='resolvido';assert.equal(reminderCandidates(d,stamp(10)).length,1);d.settings.reminders.work=false;assert.equal(reminderCandidates(d,stamp(10)).length,0);});

test('sound selection accepts five presets and remains optional for old files',()=>{
 const d=base();
 delete d.settings.reminders.soundId;validate(d);
 for(const soundId of ['classic','bell','urgent','rising','digital']){d.settings.reminders.soundId=soundId;validate(d);}
 d.settings.reminders.soundId='invalid';assert.throws(()=>validate(d),/Som de alerta inválido/);
});

test('feedback follow-up fires once before and at time and stops when closed',()=>{
 const d=base();d.feedbacks=[{id:'f',title:'Retomar conversa',person:'Ana',status:'acompanhar',review:'2026-10-20',reviewTime:'10:00'}];
 const engine=new ReminderEngine();
 assert.equal(engine.poll(d,stamp(9,50))[0].kind,'feedback');
 assert.equal(engine.poll(d,stamp(9,51)).length,0);
 assert.equal(engine.poll(d,stamp(10))[0].stage,'started');
 d.feedbacks[0].status='encerrado';assert.equal(reminderCandidates(d,stamp(10)).length,0);
 d.feedbacks[0].status='acompanhar';d.settings.reminders.work=false;assert.equal(reminderCandidates(d,stamp(10)).length,0);
});
