import {initializeDesktop} from './desktop/renderer.js';
import {splashMarkup} from './splash.js';

export function initializeShell(){
  document.body.classList.add('desk-app');
  if(window.desktop){
    initializeDesktop();
    document.querySelector('#quit-app').hidden=false;
  }else{
    const splash=document.createElement('div');splash.id='startup-splash';splash.className='startup-splash';splash.innerHTML=splashMarkup;
    const welcome=document.querySelector('#welcome');welcome.inert=true;
    document.body.append(splash);
    setTimeout(()=>{splash.remove();welcome.inert=false;},1600);
  }
  const privacy=document.querySelector('.welcome-card>small');
  privacy.innerHTML='Seu JSON continua com você.<br>Sem conta. Sem nuvem. Sem distrações.';
  const status=document.createElement('div');status.className='desktop-local-status';
  status.innerHTML='<span></span><span>Local e privado</span>';
  document.querySelector('.aside-foot').prepend(status);
  const footer=document.createElement('div');footer.className='desktop-welcome-footer';
  footer.innerHTML='<span>⌘ / Ctrl + O <small>Abrir arquivo</small></span><span>⌘ / Ctrl + N <small>Novo espaço</small></span>';
  document.querySelector('.welcome-card').append(footer);
  const menu=document.querySelector('.file-actions');
  menu.addEventListener('click',event=>{if(event.target.closest('button'))menu.open=false;});
  document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')menu.open=false;});
}

let previewTimer=null;
export function previewWebAlert({position,duration}){
  document.querySelector('#web-alert-preview')?.remove();
  if(previewTimer!==null)clearTimeout(previewTimer);
  const preview=document.createElement('div');preview.id='web-alert-preview';preview.className='reminder-toasts web-alert-preview';preview.dataset.position=position;
  preview.setAttribute('popover','manual');preview.setAttribute('role','status');
  preview.innerHTML='<article class="reminder-toast"><span class="reminder-kicker">PRÉVIA DO ALERTA</span><strong>Techlead Desk</strong><p>Seus avisos aparecerão nesta posição, pelo tempo escolhido.</p><div><button type="button" class="secondary">Dispensar</button></div></article>';
  document.body.append(preview);preview.showPopover();
  preview.querySelector('button').onclick=()=>preview.remove();
  previewTimer=setTimeout(()=>{preview.remove();previewTimer=null;},duration*1000);
}
