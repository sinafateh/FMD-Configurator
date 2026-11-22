// FT60E21x datasheet Rev 1.01, PDF pp. 9-10 and 43-48, Tables 1-1, 10-2 and 10-7.
// PWM3/4 alternate pins are enabled separately from their primary pins.
// P1C1 and P1D1 do not support one-pulse mode (datasheet p.48).
export const FT60_PWM_ROUTING_DEFAULTS = Object.freeze({
  ft60Pwm1N: 0, ft60Pwm1NPolarity: 0,
  ft60Pwm3Alt: 0, ft60Pwm4Alt: 0,
  ft60FaultAlt3: 0, ft60FaultAlt4: 0,
});
const primary = [[1,'PA3'],[2,'PA4'],[3,'PA2'],[4,'PA1']];
const requireInteger=(key,v,max)=>{
  if(!Number.isInteger(v)||v<0||v>max)throw new Error(`Invalid FT60 PWM routing setting: ${key}`);
};
export function ft60PwmRouting(project,device){
  if(!project || !project.peripherals || !project.pins || !device || device.family!=='FT60E21x') throw new Error('FT60 PWM routing requires an FT60E21x device.');
  const p={...FT60_PWM_ROUTING_DEFAULTS,...project.peripherals};
  for(const key of ['ft60Pwm1N','ft60Pwm1NPolarity','ft60Pwm3Alt','ft60Pwm4Alt'])requireInteger(key,p[key],1);
  for(const key of ['ft60FaultAlt3','ft60FaultAlt4'])requireInteger(key,p[key],2);
  const assigned=[];
  for(const [n,pin] of primary)if(p['ft60Pwm'+n])assigned.push({pin,role:'PWM'+n});
  if(p.ft60Pwm1N)assigned.push({pin:'PA4',role:'PWM1N'});
  if(p.ft60Pwm3Alt)assigned.push({pin:'PA0',role:'PWM3 alternate'});
  if(p.ft60Pwm4Alt)assigned.push({pin:'PA5',role:'PWM4 alternate'});
  if(assigned.length && (!Number.isInteger(p.timer2)||p.timer2<0||p.timer2>2))throw new Error('PWM outputs require Timer2.');
  if(p.ft60Mode===1&&(p.ft60Pwm3Alt||p.ft60Pwm4Alt))throw new Error('PWM alternate outputs do not support one-pulse mode.');
  const used=new Set();
  for(const {pin,role} of assigned){
    if(!device.pins.includes(pin))throw new Error(`${role} output is unavailable in this package: ${pin}`);
    if(used.has(pin))throw new Error(`Multiple PWM outputs require ${pin}.`);
    used.add(pin);
    if(project.pins[pin]!=='GPIO output')throw new Error(`${role} requires ${pin} configured as output.`);
    if(p.ft60Ioc&(1<<Number(pin[2])))throw new Error(`${role} conflicts with interrupt-on-change on ${pin}.`);
    if(pin==='PA2' && (p.ft60Edge||[1,2,4,5].includes(p.ft60Fault)))throw new Error('PWM3 conflicts with PA2 interrupt or PWM fault input.');
    if(p.ft60Lvd>=0 && ((p.ft60LvdInput===1&&pin==='PA5')||(p.ft60LvdInput===2&&pin==='PA4')))throw new Error(`${role} conflicts with the LVD input on ${pin}.`);
  }
  // Program all bits together, preserving distinct primary/alternate fault states.
  let oe=(p.ft60Pwm1?0x01:0)|(p.ft60Pwm1N?0x02:0)|(p.ft60FaultAlt3<<2)|(p.ft60Pwm4?0x20:0)|(p.ft60Pwm2?0x40:0)|(p.ft60Pwm3?0x80:0);
  let br1=(p.ft60FaultState4<<6)|(p.ft60FaultAlt4<<4)|(p.ft60Pwm3Alt?0x08:0)|(p.ft60Pwm4Alt?0x04:0)|p.ft60FaultState3;
  let pol=(p.ft60Polarity1?0x01:0)|(p.ft60Pwm1NPolarity?0x02:0)|(p.ft60Polarity4?0x20:0)|(p.ft60Polarity2?0x40:0)|(p.ft60Polarity3?0x80:0);
  return { outputs:assigned, oe, br1, pol, activeChannels:[!!(p.ft60Pwm1||p.ft60Pwm1N),!!p.ft60Pwm2,!!(p.ft60Pwm3||p.ft60Pwm3Alt),!!(p.ft60Pwm4||p.ft60Pwm4Alt)] };
}
