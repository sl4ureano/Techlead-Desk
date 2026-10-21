import {nativeHandle} from './file-adapter.js';
const api = window.desktop;
if (!api) throw Error('Inicie esta versão com npm start.');
document.body.classList.add('desktop-app');
window.showOpenFilePicker = async () => [nativeHandle(api, await api.fileOpen())];
window.showSaveFilePicker = async () => nativeHandle(api, await api.fileCreate());
const svg = path => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
const titlebar = document.createElement('div');
titlebar.className = 'desktop-titlebar';
titlebar.innerHTML = `<div class="desktop-wordmark"><button class="desktop-mark" id="desktop-app-menu" title="Menu do aplicativo" aria-label="Menu do aplicativo">TD</button><strong>Techlead Desk</strong><span class="desktop-edition">DESKTOP</span></div><div class="desktop-titlebar-hint"><span></span> Seu espaço. Seu ritmo.</div><div class="desktop-window-controls"><button id="desktop-minimize" aria-label="Minimizar" title="Minimizar">${svg('M5 12h14')}</button><button id="desktop-maximize" aria-label="Maximizar ou restaurar" title="Maximizar ou restaurar">${svg('M6 6h12v12H6z')}</button><button id="desktop-close" aria-label="Fechar janela" title="Fechar janela">${svg('M6 6l12 12M18 6L6 18')}</button></div>`;
document.body.prepend(titlebar);
document.querySelector('#desktop-app-menu').onclick = () => api.windowAction('menu');
for (const action of ['minimize','maximize','close']) document.querySelector('#desktop-'+action).onclick = () => api.windowAction(action);
titlebar.ondblclick = event => { if (!event.target.closest('button')) api.windowAction('maximize'); };
api.onWindowState(({maximized}) => { document.querySelector('#desktop-maximize').title=maximized?'Restaurar janela':'Maximizar janela'; });
const info = await api.info();
document.querySelector('#desktop-close').title = info.tray?'Ocultar na bandeja — alertas continuam ativos':'Fechar aplicativo';
const privacy = document.querySelector('.welcome-card>small');
if (privacy) privacy.innerHTML = 'Seu JSON continua com você.<br>Sem conta. Sem nuvem. Sem distrações.';
const welcomeBrand = document.querySelector('.welcome-card .eyebrow');
if (welcomeBrand) welcomeBrand.textContent = 'SEU DESK, AGORA NO DESKTOP';
const asideFoot = document.querySelector('.aside-foot');
if (asideFoot) {
  const status=document.createElement('div');status.className='desktop-local-status';
  const dot=document.createElement('span');const text=document.createElement('span');text.textContent='Local e privado';status.append(dot,text);
  asideFoot.prepend(status);
}
const desktopFooter = document.createElement('div');desktopFooter.className='desktop-welcome-footer';
desktopFooter.innerHTML='<span>⌘ / Ctrl + O <small>Abrir arquivo</small></span><span>⌘ / Ctrl + N <small>Novo espaço</small></span>';
document.querySelector('.welcome-card').append(desktopFooter);
await import('../app.js');
api.onCommand(command => {
  if(command==='reminders') { if(!document.querySelector('#app').hidden) document.querySelector('#reminders-button').click(); }
  else document.querySelector('#'+({open:'open',create:'create',save:'save'}[command]||'open')).click();
});
api.onReminder(tag => {
  const button=[...document.querySelectorAll('[data-reminder-open]')].find(b=>b.dataset.reminderOpen===tag);
  if(button) button.click();
  else if(!document.querySelector('#app').hidden) document.querySelector('#reminders-button').click();
});
