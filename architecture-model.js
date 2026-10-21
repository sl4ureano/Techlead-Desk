export const architectureTypes={service:'Aplicação / serviço',database:'Banco de dados',queue:'Fila / evento',actor:'Pessoa / cliente',external:'Sistema externo'};
export function createArchitecture(title,description='',topicId='',taskId=''){
 const at=new Date().toISOString();return{id:crypto.randomUUID(),title,description,topicId,taskId,nodes:[],edges:[],comments:[],createdAt:at,updatedAt:at};
}
export function addArchitectureNode(project,type){
 if(!Object.hasOwn(architectureTypes,type)||project.nodes.length>=200)throw Error('Escolha um tipo válido. Limite: 200 componentes por projeto.');
 const n=project.nodes.length,node={id:crypto.randomUUID(),type,label:architectureTypes[type],technology:'',description:'',x:40+(n%5)*220,y:40+(Math.floor(n/5)%6)*100};project.nodes.push(node);return node;
}
export function connectArchitectureNodes(project,from,to,label=''){
 if(from===to||![from,to].every(id=>project.nodes.some(n=>n.id===id)))throw Error('Selecione dois componentes diferentes.');
 if(project.edges.some(e=>e.from===from&&e.to===to))throw Error('Essa conexão já existe.');
 if(project.edges.length>=1000)throw Error('Limite de 1000 conexões por projeto.');
 const edge={id:crypto.randomUUID(),from,to,label};project.edges.push(edge);return edge;
}
export function removeArchitectureNode(project,id){
 project.nodes=project.nodes.filter(n=>n.id!==id);project.edges=project.edges.filter(e=>e.from!==id&&e.to!==id);
 for(const comment of project.comments)if(comment.nodeId===id)comment.nodeId='';
}
export function validateArchitectures(projects){
 if(projects===undefined)return;
 if(!Array.isArray(projects)||projects.length>100)throw Error('Arquiteturas: lista inválida ou acima de 100 projetos.');
 const ids=new Set(),string=(v,max=10000)=>typeof v==='string'&&v.length<=max,date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
 for(const p of projects){
  if(!p||!string(p.id,200)||!p.id||ids.has(p.id)||!string(p.title,300)||!p.title.trim()||!string(p.description)||!string(p.topicId,200)||!string(p.taskId,200)||!date(p.createdAt)||!date(p.updatedAt))throw Error('Projeto de arquitetura inválido.');ids.add(p.id);
  if(!Array.isArray(p.nodes)||p.nodes.length>200||!Array.isArray(p.edges)||p.edges.length>1000||!Array.isArray(p.comments)||p.comments.length>2000)throw Error('Conteúdo da arquitetura inválido ou acima dos limites.');
  const nodes=new Set(),edges=new Set(),comments=new Set();
  for(const n of p.nodes){if(!n||!string(n.id,200)||!n.id||nodes.has(n.id)||!Object.hasOwn(architectureTypes,n.type)||!string(n.label,100)||!n.label.trim()||!string(n.technology,100)||!string(n.description)||!Number.isFinite(n.x)||!Number.isFinite(n.y)||n.x<0||n.x>1030||n.y<0||n.y>624)throw Error('Componente de arquitetura inválido.');nodes.add(n.id);}
  for(const e of p.edges){if(!e||!string(e.id,200)||!e.id||edges.has(e.id)||!nodes.has(e.from)||!nodes.has(e.to)||e.from===e.to||!string(e.label,100))throw Error('Conexão de arquitetura inválida.');edges.add(e.id);}
  for(const c of p.comments){if(!c||!string(c.id,200)||!c.id||comments.has(c.id)||!string(c.text)||!c.text.trim()||!date(c.at)||!string(c.nodeId,200)||(c.nodeId&&!nodes.has(c.nodeId)))throw Error('Comentário de arquitetura inválido.');comments.add(c.id);}
 }
}
