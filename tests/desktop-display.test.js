import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {configureDisplay}=createRequire(import.meta.url)('../desktop/display-backend.cjs');
function application(){const result={switches:new Map(),restarts:[],exits:[]};return {...result,commandLine:{appendSwitch:(key,value)=>result.switches.set(key,value)},relaunch:options=>result.restarts.push(options),exit:code=>result.exits.push(code)};}
test('Ubuntu Wayland selects x11 at process startup without a relaunch loop',()=>{
 const app=application(),env={DISPLAY:':0',WAYLAND_DISPLAY:'wayland-0',XDG_SESSION_TYPE:'wayland'};
 assert.equal(configureDisplay(app,'linux',env,['.','--dev']),true);
 assert.deepEqual(app.restarts,[{args:['.','--dev','--ozone-platform=x11']}]);assert.deepEqual(app.exits,[0]);
 assert.equal(configureDisplay(app,'linux',env,app.restarts[0].args),false);assert.equal(app.restarts.length,1);
});
test('explicit backends, native Wayland without DISPLAY and other systems are preserved',()=>{
 for(const backend of ['headless','wayland','x11']){const app=application();assert.equal(configureDisplay(app,'linux',{DISPLAY:':0'},['--ozone-platform='+backend]),false);assert.equal(app.restarts.length,0);assert.equal(app.switches.size,0);}
 for(const [platform,env] of [['linux',{WAYLAND_DISPLAY:'wayland-0'}],['win32',{DISPLAY:':0'}],['darwin',{DISPLAY:':0'}]]){const app=application();assert.equal(configureDisplay(app,platform,env,[]),false);assert.equal(app.restarts.length,0);assert.equal(app.switches.size,0);}
 const app=application();assert.equal(configureDisplay(app,'linux',{DISPLAY:':0',XDG_SESSION_TYPE:'x11'},[]),false);assert.equal(app.switches.get('ozone-platform'),'x11');assert.equal(app.restarts.length,0);
});
