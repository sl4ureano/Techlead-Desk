'use strict';
const path=require('node:path');
// Chromium needs its display backend before the Electron process starts.
function launchArgs(args=process.argv.slice(2),platform=process.platform,env=process.env){
 const flags=[...args];
 if(platform==='linux'&&env.DISPLAY&&!flags.some(arg=>/^--ozone-platform(?:=|$)/.test(arg)))flags.push('--ozone-platform=x11');
 return [path.join(__dirname,'main.cjs'),...flags];
}
module.exports={launchArgs};
if(require.main===module){
 const {spawn}=require('node:child_process');
 const child=spawn(require('electron'),launchArgs(),{stdio:'inherit'});
 child.on('error',error=>{console.error('Não foi possível iniciar o Electron:',error.message);process.exitCode=1;});
 child.on('exit',(code,signal)=>{if(signal){console.error('Electron encerrado por '+signal);process.exitCode=1;}else process.exitCode=code??1;});
}
