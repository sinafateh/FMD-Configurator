import {ft61VregNominal, FT61_VREG_REFERENCES} from '../core/ft61-vreg.js';

/** VREG is controlled by a common enable for both bonded output pins. */
export function ft61VregAvailable(device) {
  return !!device && /^FT61EC2/.test(device.id || '') && ['PA4','PC5'].some(pin=>device.pins.includes(pin));
}
export function ft61VregReservedPins(project, device) {
  if (!ft61VregAvailable(device) || !project.peripherals.ft61Vreg) return [];
  return ['PA4','PC5'].filter(pin=>device.pins.includes(pin));
}
/** Called only on explicit enable: clears conflicting GPIO and IOC assignments. */
export function setFt61VregEnabled(project, device, enabled) {
  if(enabled && !ft61VregAvailable(device))throw new Error('VREG output unavailable on selected device.');
  project.peripherals.ft61Vreg=enabled?1:0;
  if(enabled){
    for(const pin of ft61VregReservedPins(project,device))delete project.pins[pin];
    project.peripherals.ft61Ioc=(project.peripherals.ft61Ioc||0)&~(1<<4);
  }
}
/** Call on explicit device switch, after the active device has been updated. */
export function normalizeFt61VregDevice(project, device) {
  if(!ft61VregAvailable(device))project.peripherals.ft61Vreg=0;
  else if(project.peripherals.ft61Vreg)setFt61VregEnabled(project,device,true);
}

/** Build an isolated card; caller owns app state, render scheduling and pinout.
 * createFt61VregUI({container, getProject:()=>project, getDevice:()=>device(),
 *                   onChange:()=>render()}); then call returned render() each app render.
 */
export function createFt61VregUI({container,getProject,getDevice,onChange,document:doc=globalThis.document}) {
  const card=doc.createElement('article');card.className='config-card';
  const heading=doc.createElement('div');heading.className='section-title';
  const title=doc.createElement('h2');title.textContent='Voltage regulator';heading.append(title);card.append(heading);
  const grid=doc.createElement('div');grid.className='peripheral-grid';card.append(grid);
  function select(id,label,choices){
    const wrap=doc.createElement('div'),caption=doc.createElement('label'),el=doc.createElement('select');
    caption.htmlFor=id;caption.textContent=label;el.id=id;
    for(const [value,text] of choices){const o=doc.createElement('option');o.value=String(value);o.textContent=text;el.append(o);}
    wrap.append(caption,el);grid.append(wrap);return {wrap,el};
  }
  const enable=select('ft61Vreg','Regulator outputs',[[0,'Disabled'],[1,'Enabled']]);
  const reference=select('ft61VregRef','Reference',FT61_VREG_REFERENCES.map((v,i)=>[i,`${v.toFixed(1)} V nominal`]));
  const steps=Array.from({length:32},(_,i)=>[i,String(i)]);
  const high=select('ft61VregP','PA4 / VREGP step',steps), low=select('ft61VregN','PC5 / VREGN step',steps);
  const highHint=doc.createElement('p'),lowHint=doc.createElement('p');highHint.className=lowHint.className='hint';high.wrap.append(highHint);low.wrap.append(lowHint);
  const note=doc.createElement('p');note.className='hint';note.textContent='The regulator uses one shared enable for all output pins present on this package.';card.append(note);
  container.append(card);
  enable.el.onchange=()=>{setFt61VregEnabled(getProject(),getDevice(),Number(enable.el.value)===1);onChange();};
  for(const [field,el] of [['ft61VregRef',reference.el],['ft61VregP',high.el],['ft61VregN',low.el]])el.onchange=()=>{getProject().peripherals[field]=Number(el.value);onChange();};
  function render(){
    const device=getDevice(),p=getProject().peripherals,available=ft61VregAvailable(device);
    card.hidden=!available;enable.el.value=String(p.ft61Vreg);reference.el.value=String(p.ft61VregRef);
    high.el.value=String(p.ft61VregP);low.el.value=String(p.ft61VregN);
    high.wrap.hidden=!available||!device.pins.includes('PA4');low.wrap.hidden=!available||!device.pins.includes('PC5');
    reference.el.disabled=high.el.disabled=low.el.disabled=!p.ft61Vreg;
    highHint.textContent='Nominal output: '+ft61VregNominal(p.ft61VregRef,p.ft61VregP).toFixed(3)+' V';
    lowHint.textContent='Nominal output: '+ft61VregNominal(p.ft61VregRef,p.ft61VregN).toFixed(3)+' V';
  }
  return {card,render};
}
