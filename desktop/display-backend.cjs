'use strict';
// Wayland owns window placement. XWayland must be selected at process startup,
// before Chromium chooses its display backend. Never restart an explicit backend.
function configureDisplay(app,platform=process.platform,env=process.env,args=process.argv.slice(1)){
  if(platform!=='linux'||!env.DISPLAY||args.some(arg=>/^--ozone-platform(?:=|$)/.test(arg)))return false;
  if(env.WAYLAND_DISPLAY||env.XDG_SESSION_TYPE==='wayland'){
    app.relaunch({args:[...args,'--ozone-platform=x11']});
    app.exit(0);
    return true;
  }
  app.commandLine.appendSwitch('ozone-platform','x11');
  return false;
}
module.exports={configureDisplay};
