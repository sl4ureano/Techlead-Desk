import {nativeHandle} from './file-adapter.js';
export function initializeDesktop(){
const api = window.desktop;
document.body.classList.add('desktop-app');
window.showOpenFilePicker = async () => [nativeHandle(api, await api.fileOpen())];
window.showSaveFilePicker = async () => nativeHandle(api, await api.fileCreate());
const svg = path => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
const titlebar = document.createElement('div');
titlebar.className = 'desktop-titlebar';
titlebar.innerHTML = `<div aria-hidden="true"></div><div class="desktop-titlebar-hint"><span></span> Seu espaço. Seu ritmo.</div><div class="desktop-window-controls"><button id="desktop-minimize" aria-label="Minimizar" title="Minimizar">${svg('M5 12h14')}</button><button id="desktop-maximize" aria-label="Maximizar ou restaurar" title="Maximizar ou restaurar">${svg('M6 6h12v12H6z')}</button><button id="desktop-close" aria-label="Fechar janela" title="Fechar janela">${svg('M6 6l12 12M18 6L6 18')}</button></div>`;
document.body.prepend(titlebar);
for (const action of ['minimize','maximize','close']) document.querySelector('#desktop-'+action).onclick = () => api.windowAction(action);
titlebar.ondblclick = event => { if (!event.target.closest('button')) api.windowAction('maximize'); };
api.onWindowState(({maximized}) => { document.querySelector('#desktop-maximize').title=maximized?'Restaurar janela':'Maximizar janela'; });
api.info().then(info=>{document.querySelector('#desktop-close').title=info.tray?'Ocultar na bandeja — alertas continuam ativos':'Fechar aplicativo';}).catch(()=>{});
api.onCommand(command => {
  if(command==='reminders') { if(!document.querySelector('#app').hidden) document.querySelector('#reminders-button').click(); }
  else document.querySelector('#'+({open:'open',create:'create',save:'save'}[command]||'open')).click();
});
api.onReminder(tag => {
  const button=[...document.querySelectorAll('[data-reminder-open]')].find(b=>b.dataset.reminderOpen===tag);
  if(button) button.click();
  else if(!document.querySelector('#app').hidden) document.querySelector('#reminders-button').click();
});

}
