import {today, overlaps} from './core.js?v=20261020-feedbacks-1';

export function periodFor(date, mode) {
  const from = new Date(date + 'T00:00:00');
  if (mode === 'month') from.setDate(1);
  if (mode === 'week') from.setDate(from.getDate() - (from.getDay() + 6) % 7);
  const to = new Date(from);
  if (mode === 'month') to.setMonth(to.getMonth() + 1);
  else to.setDate(to.getDate() + (mode === 'week' ? 7 : 1));
  return {from, to};
}

export function movePeriod(date, mode, direction) {
  const d = new Date(date + 'T12:00:00');
  if (mode === 'month') {
    const wantedDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + direction);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(wantedDay, last));
  } else d.setDate(d.getDate() + direction * (mode === 'week' ? 7 : 1));
  return today(d);
}

export function visibleDays(date, mode) {
  const {from, to} = periodFor(date, mode);
  const start = new Date(from), end = new Date(to);
  if (mode === 'month') {
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    const trailing = (7 - (end.getDay() + 6) % 7) % 7;
    end.setDate(end.getDate() + trailing);
  }
  const result = [];
  for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) result.push(today(d));
  return result;
}

export function itemsForDay(data, date, routinesOnly = false, source = '') {
  const day = new Date(date + 'T00:00:00'), end = new Date(day);
  end.setDate(end.getDate() + 1);
  const routines = data.routines.filter(r => r.day === day.getDay()).map(r => ({...r, kind:'routine', key:'routine:' + r.id}));
  if (routinesOnly) return routines.sort((a,b) => a.time.localeCompare(b.time));
  const events = (data.calendarEvents || []).filter(e => (!source || e.source === source) && Date.parse(e.start) < +end && Date.parse(e.end) > +day);
  const timed = events.map(e => ({...e, kind:'event', key:JSON.stringify([e.source,e.sourceEventId]), conflict:!e.cancelled && events.some(x => x !== e && overlaps(x,e))}));
  // Routines have a start time but no duration in the file. Do not invent an end time or a conflict.
  const work=[];
  for(const [collection,dateField,timeField,kind] of [['tasks','due','dueTime','task'],['topics','review','reviewTime','topic']])for(const record of data[collection]||[]){if(record.status==='concluído'||record.status==='resolvido'||record[dateField]!==date)continue;work.push({...record,kind,time:record[timeField]||'',start:record[timeField]?new Date(date+'T'+record[timeField]).toISOString():undefined,key:kind+':'+record.id});}
  for(const topic of data.topics||[])if(topic.status!=='resolvido')for(const f of topic.followUps||[])if(f.date===date)work.push({...topic,id:topic.id,title:topic.title+' · '+f.title,kind:'topic',time:f.time||'',start:f.time?new Date(date+'T'+f.time).toISOString():undefined,key:'followup:'+topic.id+':'+f.id});
  const all=[...timed,...routines,...work];
  const clock=x=>x.allDay?'00:00':x.time||(['task','topic','decision'].includes(x.kind)?'99:99':new Date(x.start).toTimeString().slice(0,5));
  return all.sort((a,b)=>clock(a).localeCompare(clock(b))||({alta:0,'média':1,baixa:2}[a.priority]??3)-({alta:0,'média':1,baixa:2}[b.priority]??3));
}
