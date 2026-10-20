// Compatibility only: fold old decision records into subject timelines once.
export function migrateLegacyDecisions(data){
 if(!data.decisions?.length)return false;
 for(const record of data.decisions){
  let topic=data.topics.find(t=>t.id===record.topicId);if(topic?.status==='resolvido'&&record.review)topic=null;
  if(!topic){topic={id:crypto.randomUUID(),title:record.title,context:record.context||'',owner:record.owner||'',status:'acompanhar',nextStep:'',review:record.review||'',reviewTime:record.reviewTime||'',history:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};data.topics.push(topic);}
  topic.history??=[];
  let originalTime=record.dateTime?new Date(record.date+'T'+record.dateTime):new Date(record.date+'T12:00:00');if(!Number.isFinite(+originalTime)){originalTime=new Date(record.createdAt||record.updatedAt||data.updatedAt);if(!Number.isFinite(+originalTime))originalTime=new Date();}
  const text=[record.title,record.decision,record.context?'Contexto: '+record.context:'',record.alternatives?'Alternativas consideradas: '+record.alternatives:'',record.owner?'Responsável: '+record.owner:''].filter(Boolean).join('\n\n');
  topic.history.push({id:crypto.randomUUID(),at:originalTime.toISOString(),dateOnly:!record.dateTime,text,legacyRecord:record});
  for(const old of record.history||[])topic.history.push({...old,id:crypto.randomUUID()});
  if(record.review&&(topic.review!==record.review||(topic.reviewTime||'')!==(record.reviewTime||''))){topic.followUps??=[];topic.followUps.push({id:crypto.randomUUID(),title:record.title,date:record.review,time:record.reviewTime||''});}
  topic.updatedAt=new Date().toISOString();
 }
 data.decisions=[];return true;
}
