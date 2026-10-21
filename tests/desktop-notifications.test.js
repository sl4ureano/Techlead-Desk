import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fresh,validate} from '../core.js';
import {reminderSettings} from '../reminders.js';
const {POSITIONS,appearance,bounds,capacity}=createRequire(import.meta.url)('../desktop/notification-settings.cjs');
test('desktop alert defaults preserve older JSON and reject invalid settings',()=>{
 const data=fresh();assert.equal(reminderSettings(data).desktopPosition,'bottom-right');assert.equal(reminderSettings(data).desktopDuration,14);
 data.settings.reminders=reminderSettings(data);validate(data);
 for(const position of POSITIONS){data.settings.reminders.desktopPosition=position;validate(data);assert.equal(appearance({position}).position,position);}
 for(const duration of [3,14,120]){data.settings.reminders.desktopDuration=duration;validate(data);}
 for(const duration of [0,2,121,3.5,'14',NaN]){data.settings.reminders.desktopDuration=duration;assert.throws(()=>validate(data),/Tempo de alerta/);assert.throws(()=>appearance({duration}),/tempo do alerta/);}
 assert.throws(()=>appearance({position:'elsewhere'}),/Posição/);
});
test('all five placements respect monitor origin, margins and non-overlapping stacks',()=>{
 const area={x:-1920,y:100,width:1920,height:1080};
 for(const position of POSITIONS){
  const boxes=Array.from({length:3},(_,i)=>bounds(position,i,3,area));
  for(const box of boxes){assert(box.x>=area.x&&box.x+box.width<=area.x+area.width);assert(box.y>=area.y&&box.y+box.height<=area.y+area.height);}
  const ordered=boxes.toSorted((a,b)=>a.y-b.y);for(let i=1;i<3;i++)assert(ordered[i].y>=ordered[i-1].y+ordered[i-1].height);
  if(position.endsWith('left'))assert.equal(boxes[0].x,area.x+18);
  if(position.endsWith('right'))assert.equal(boxes[0].x+boxes[0].width,area.x+area.width-18);
  if(position.startsWith('top'))assert.equal(boxes[0].y,area.y+18);
  if(position.startsWith('bottom'))assert.equal(boxes[0].y+boxes[0].height,area.y+area.height-18);
  if(position==='center'){assert.equal(boxes[0].x+boxes[0].width/2,area.x+area.width/2);assert.equal((ordered[0].y+ordered.at(-1).y+ordered.at(-1).height)/2,area.y+area.height/2);}
 }
});
test('short monitors limit cards and headless work areas use safe bounds',()=>{
 assert.equal(capacity({x:0,y:0,width:960,height:680}),2);
 assert.equal(capacity({x:0,y:0,width:1920,height:1080}),3);
 const box=bounds('center',0,1,{x:0,y:0,width:0,height:0});assert(box.width>0&&box.height>0&&box.x>=0&&box.y>=0);
});
