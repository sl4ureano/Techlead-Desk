import {today} from './core.js?v=20261020-feedbacks-1';

export const reminderDefaults = {enabled:false, minutesBefore:10, sound:true, soundId:'classic', volume:100, desktopPosition:'bottom-right', desktopDuration:14, desktop:true, routines:true, events:true, work:true};
export function reminderSettings(data){return {...reminderDefaults,...data.settings?.reminders};}

// One logical occurrence per routine/date or imported event. No copies are persisted.
export function reminderCandidates(data, timestamp=Date.now()) {
  const settings=reminderSettings(data), result=[];
  if(settings.events)for(const event of data.calendarEvents||[]){
    if(event.cancelled||event.allDay||event.sourceStatus==='indisponível na origem'||event.sourceStatus==='cancelado')continue;
    const start=Date.parse(event.start),end=Date.parse(event.end);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=timestamp)continue;
    result.push({key:JSON.stringify(['event',event.source,event.sourceEventId,start]),title:event.title,start,end,source:event.source,kind:'event',date:today(new Date(start)),url:event.meetingUrl||''});
  }
  if(settings.routines)for(let offset=-1;offset<=1;offset++){
    const date=new Date(timestamp);date.setHours(0,0,0,0);date.setDate(date.getDate()+offset);
    for(const routine of data.routines){if(routine.day!==date.getDay())continue;
      const day=today(date),start=+new Date(day+'T'+routine.time);
      result.push({key:JSON.stringify(['routine',routine.id,day,routine.time]),title:routine.title,start,source:'Bloco recorrente',kind:'routine',date:day,url:''});
    }
  }
  if(settings.work)for(const [collection,dateField,timeField,kind,source] of [['tasks','due','dueTime','task','Prazo de tarefa'],['topics','review','reviewTime','topic','Acompanhar assunto']]){
    for(const item of data[collection]||[]){if(item.status==='concluído'||item.status==='resolvido'||!item[dateField]||!item[timeField])continue;const start=+new Date(item[dateField]+'T'+item[timeField]);if(!Number.isFinite(start))continue;result.push({key:JSON.stringify([kind,item.id,start]),title:item.title,start,kind,source,date:item[dateField],url:''});}
  }
  if(settings.work)for(const topic of data.topics||[]){if(topic.status==='resolvido')continue;for(const f of topic.followUps||[]){if(!f.date||!f.time)continue;const start=+new Date(f.date+'T'+f.time);result.push({key:JSON.stringify(['topic-followup',topic.id,f.id,start]),title:topic.title+' · '+f.title,start,kind:'topic',source:'Acompanhar assunto',date:f.date,url:''});}}
  if(settings.work)for(const f of data.feedbacks||[]){if(f.status==='encerrado'||!f.review||!f.reviewTime)continue;const start=+new Date(f.review+'T'+f.reviewTime);if(Number.isFinite(start))result.push({key:JSON.stringify(['feedback',f.id,start]),title:f.title,start,kind:'feedback',source:'Feedback · '+f.person,date:f.review,url:''});}
  return result;
}

export class ReminderEngine {
  constructor(){this.delivered=new Map();}
  poll(data,timestamp=Date.now()){
    const settings=reminderSettings(data);if(!settings.enabled)return [];
    // Session-only deduplication. Prune old keys to bound memory over long sessions.
    for(const [key,at] of this.delivered)if(timestamp-at>3*86400000)this.delivered.delete(key);
    const alerts=[];
    for(const item of reminderCandidates(data,timestamp)){
      const delta=item.start-timestamp;
      // A 10 minute grace period covers late timers; do not replay old meetings.
      if(delta>settings.minutesBefore*60000||delta < -10*60000)continue;
      const stage=delta>0?'before':'started',key=item.key+'|'+stage;
      if(this.delivered.has(key))continue;
      if(stage==='before'&&this.delivered.has(item.key+'|started'))continue;
      this.delivered.set(key,timestamp);
      alerts.push({...item,id:key,stage,minutes:Math.max(0,Math.ceil(delta/60000)),lateMinutes:Math.max(0,Math.floor(-delta/60000)),firedAt:timestamp});
    }
    return alerts.sort((a,b)=>a.start-b.start);
  }
}

