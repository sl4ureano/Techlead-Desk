import {today} from './core.js?v=20261020-feedbacks-1';
export function taskBucket(t, date=today(), clock=new Date().toTimeString().slice(0,5)) {
  if(t.status==='concluído')return 'done';
  if(t.due && (t.due<date||(t.due===date&&t.dueTime&&t.dueTime<clock)))return 'late';
  if(t.due===date)return 'today';
  if(t.priority==='alta')return 'high';
  return t.due?'next':'undated';
}
export function topicBucket(t,date=today()) {
  if(t.status==='resolvido')return 'resolved';
  if(t.review && t.review<=date)return 'review';
  return t.status==='aguardando'?'waiting':t.status==='em andamento'?'progress':'follow';
}
export function decisionBucket(d,date=today()) {
  return !d.review?'unscheduled':d.review<date?'late':d.review===date?'today':'scheduled';
}
export function rankTasks(tasks,date=today()) {
  const rank={late:0,today:1,high:2,next:3,undated:4,done:5},priority={alta:0,'média':1,baixa:2};
  return [...tasks].sort((a,b)=>rank[taskBucket(a,date)]-rank[taskBucket(b,date)]||(a.due||'9999').localeCompare(b.due||'9999')||(a.dueTime||'99:99').localeCompare(b.dueTime||'99:99')||priority[a.priority]-priority[b.priority]);
}
export const taskGroups=[['late','Atrasadas','O prazo passou. Revise o próximo passo e o prazo.','red'],['today','Para hoje','Tarefas que vencem hoje.','amber'],['high','Alta prioridade','Prioridade alta, sem prazo vencido ou para hoje.','violet'],['next','Próximos prazos','Prepare o que vem pela frente.','blue'],['undated','Sem prazo','Defina quando pretende agir.','slate'],['done','Concluídas','Trabalho finalizado.','green']];
export const topicGroups=[['review','Revisar agora','A data de acompanhamento chegou ou já passou.','red'],['waiting','Aguardando retorno','Confira de quem depende o próximo passo.','amber'],['progress','Em andamento','Assuntos que estão avançando.','blue'],['follow','A acompanhar','Mantenha o próximo passo e a revisão definidos.','violet'],['resolved','Resolvidos','Assuntos encerrados, com histórico preservado.','green']];
