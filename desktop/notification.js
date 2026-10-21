'use strict';
window.desktopToast.onPayload(payload => {
  const progress=document.querySelector('.progress');
  progress.style.setProperty('--toast-duration',payload.duration+'s');
  progress.style.animation='none';void progress.offsetWidth;progress.style.animation='';
  document.querySelector('#title').textContent = payload.title;
  document.querySelector('#body').textContent = payload.body;
  document.querySelector('#time').textContent = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
});
document.querySelector('#open').onclick = () => window.desktopToast.open();
document.querySelector('#dismiss').onclick = () => window.desktopToast.dismiss();
document.addEventListener('keydown', event => { if (event.key === 'Escape') window.desktopToast.dismiss(); });
