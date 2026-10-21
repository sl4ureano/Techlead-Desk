'use strict';
const POSITIONS = ['center','top-right','bottom-right','top-left','bottom-left'];
const DEFAULTS = {position:'bottom-right',duration:14};
function appearance(options={}) {
  const result={position:options.position??DEFAULTS.position,duration:options.duration??DEFAULTS.duration};
  if(!POSITIONS.includes(result.position))throw Error('Posição de alerta inválida.');
  if(!Number.isInteger(result.duration)||result.duration<3||result.duration>120)throw Error('O tempo do alerta deve ser de 3 a 120 segundos.');
  return result;
}
function workArea(area) { return area.width>=400&&area.height>=240?area:{x:0,y:0,width:1280,height:800}; }
function capacity(area) { area=workArea(area);return Math.max(1,Math.min(3,Math.floor((area.height-36+6)/232))); }
function bounds(position,index,count,area) {
  if(!POSITIONS.includes(position))throw Error('Posição de alerta inválida.');
  area=workArea(area);
  const width=Math.min(396,area.width-36),height=226,margin=18,gap=6;
  let x=position.endsWith('left')?area.x+margin:area.x+area.width-width-margin;
  let y=position.startsWith('top')?area.y+margin+index*(height+gap):area.y+area.height-margin-height-index*(height+gap);
  if(position==='center'){
    x=area.x+Math.round((area.width-width)/2);
    y=area.y+Math.round((area.height-(count*height+(count-1)*gap))/2)+index*(height+gap);
  }
  return {x,y,width,height};
}
module.exports={POSITIONS,DEFAULTS,appearance,workArea,capacity,bounds};
