import {awsComponents} from './architecture-catalog.js';
export const architectureTypes={service:'Aplicação / serviço',database:'Banco de dados',queue:'Fila / evento',actor:'Pessoa / cliente',external:'Sistema externo'};
const basics={rectangle:'Retângulo',rounded:'Retângulo arredondado',circle:'Círculo',diamond:'Decisão / losango',document:'Documento',note:'Nota',cloud:'Nuvem',server:'Servidor',browser:'Navegador',mobile:'Dispositivo móvel',cache:'Cache',storage:'Armazenamento',network:'Rede',loadbalancer:'Balanceador',container:'Contêiner',function:'Função',firewall:'Firewall',start:'Início / fim'};
Object.assign(architectureTypes,basics,Object.fromEntries(awsComponents.map(c=>[c.id,c.label])));
const basicPaths={rounded:'M12 5H36Q44 5 44 13V35Q44 43 36 43H12Q4 43 4 35V13Q4 5 12 5Z',browser:'M3 5H45V43H3ZM3 14H45M8 10H10M14 10H16',external:'M3 8H32V40H3ZM22 24H45M38 17L45 24L38 31',cache:'M8 6H40V42H8ZM28 10L17 26H27L20 39',storage:'M7 7H41V41H7ZM12 33H36M32 13H36',network:'M17 3H31V15H17ZM3 33H17V45H3ZM31 33H45V45H31ZM24 15V25M10 33V25H38V33',loadbalancer:'M3 18H15V30H3ZM33 3H45V15H33ZM33 33H45V45H33ZM15 24H24V9H33M24 24V39H33',container:'M3 10H45V38H3ZM11 14V34M20 14V34M29 14V34M38 14V34',function:'M8 42L23 6H29L42 42M18 25H33',firewall:'M4 5H44V43H4ZM4 17H44M4 30H44M17 5V17M30 17V30M17 30V43',service:'M5 7H43V41H5ZM20 16L12 24L20 32M28 16L36 24L28 32', database:'M8 6C8 1 40 1 40 6V38C40 44 8 44 8 38ZM8 6C8 12 40 12 40 6M8 18C8 24 40 24 40 18',circle:'M44 24A20 20 0 1 1 4 24A20 20 0 1 1 44 24',diamond:'M24 2L46 24L24 46L2 24Z',actor:'M30 10A6 6 0 1 1 18 10A6 6 0 1 1 30 10M24 16V32M10 23H38M24 32L12 46M24 32L36 46',queue:'M4 8H44V40H4ZM14 16V32M24 16V32M34 16V32',document:'M10 3H30L40 13V45H10ZM30 3V13H40M16 24H34M16 32H34',cloud:'M12 36C-3 36 1 16 13 18C11 0 38 0 37 18C51 17 51 36 37 36Z',server:'M7 4H41V44H7ZM7 17H41M7 30H41M12 10H16M12 23H16M12 37H16',mobile:'M14 2H34V46H14ZM14 37H34',note:'M5 4H43V32L30 45H5ZM30 45V32H43',start:'M14 8H34A16 16 0 0 1 34 40H14A16 16 0 0 1 14 8',rectangle:'M3 7H45V41H3Z'};
export const architectureComponents=[...Object.entries(architectureTypes).filter(([id])=>!id.startsWith('aws-')).map(([id,label])=>({id,label,category:'Básicos',image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="'+(basicPaths[id]||basicPaths.rectangle)+'" fill="none" stroke="#547bcb" stroke-width="2" stroke-linejoin="round"/></svg>')})),...awsComponents];
export function architectureComponent(type){return architectureComponents.find(c=>c.id===type);}

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
