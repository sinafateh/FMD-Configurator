import {devices, functions} from '../data/devices.js';
export const SCHEMA_VERSION=1;
export function createProject(){return {schemaVersion:SCHEMA_VERSION,name:'My FMD project',device:'FT61EC21B',clock:{source:16000000,divider:1},pins:{},peripherals:{adcRef:0,timer0:-1,timer1:-1,timer2:-1,watchdog:-1,timer3:-1,timer4:-1,timer5:-1,lvd:-1,irqTimer0:0,irqTimer1:0,irqTimer2:0,irqADC:0,pwm3:0,pwm4:0,pwm5:0,pwm3Duty:50,pwm4Duty:50,pwm5Duty:50}};}
export function validateProject(p){
 if(!p || typeof p!=='object' || p.schemaVersion!==SCHEMA_VERSION) throw new Error('Unsupported or invalid project format.');
 const d=devices.find(x=>x.id===p.device); if(!d) throw new Error('Unknown device.');
 if(typeof p.name!=='string'||p.name.length>80||!p.clock||![16000000,32000].includes(p.clock.source)||![1,2,4,8,16,32,64].includes(p.clock.divider)||!p.pins||typeof p.pins!=='object'||Array.isArray(p.pins)) throw new Error('Invalid project settings.');
 const defaults={adcRef:0,timer0:-1,timer1:-1,timer2:-1,watchdog:-1,timer3:-1,timer4:-1,timer5:-1,lvd:-1,irqTimer0:0,irqTimer1:0,irqTimer2:0,irqADC:0,pwm3:0,pwm4:0,pwm5:0,pwm3Duty:50,pwm4Duty:50,pwm5Duty:50};
 if(p.peripherals===undefined)p.peripherals={...defaults};
 if(!p.peripherals || typeof p.peripherals!=='object' || Array.isArray(p.peripherals))throw new Error('Invalid peripheral settings.');
 for(const [key,value] of Object.entries(defaults))if(p.peripherals[key]===undefined)p.peripherals[key]=value;
 for(const [key,max] of Object.entries({adcRef:2,timer0:7,timer1:3,timer2:2,watchdog:11,timer3:7,timer4:7,timer5:7,lvd:7,irqTimer0:1,irqTimer1:1,irqTimer2:1,irqADC:1,pwm3:1,pwm4:1,pwm5:1,pwm3Duty:100,pwm4Duty:100,pwm5Duty:100})){ let v=p.peripherals[key];if(!Number.isInteger(v)||v<(['adcRef','irqTimer0','irqTimer1','irqTimer2','irqADC','pwm3','pwm4','pwm5','pwm3Duty','pwm4Duty','pwm5Duty'].includes(key)?0:(key==='lvd'&&v!==-1?2:-1))||v>max)throw new Error('Invalid peripheral setting: '+key);}
 for(const [n,pin] of [[3,'PC4'],[4,'PC3'],[5,'PC2']])if(p.peripherals['pwm'+n]&&(!d.pins.includes(pin)||p.pins[pin]!=='GPIO output'||p.peripherals['timer'+n]<0))throw new Error('Invalid PWM'+n+' pin or timer configuration.');
 for(const [pin,fn] of Object.entries(p.pins)) if(!d.pins.includes(pin)||(!functions[pin]?.includes(fn)||!isConfigurable(fn))) throw new Error('Invalid assignment: '+pin);
 return p;
}
export function frequency(p){return p.clock.source===16000000?p.clock.source/p.clock.divider:p.clock.source;}

export function isConfigurable(fn){return ['GPIO input','GPIO output'].includes(fn)||/^AN[0-6]$/.test(fn);}
