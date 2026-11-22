// FT60E21x Rev 1.01, Tables 1-1, 10-2 and 10-7: complementary and alternate PWM outputs.
const ROUTES = Object.freeze({
  ft60Pwm1N: {pin:'PA4', channel:1, title:'PWM1 complementary - PA4'},
  ft60Pwm3Alt: {pin:'PA0', channel:3, title:'PWM3 alternate - PA0'},
  ft60Pwm4Alt: {pin:'PA5', channel:4, title:'PWM4 alternate - PA5'},
});
const VALUES = Object.freeze({
  ft60Pwm1N:1, ft60Pwm3Alt:1, ft60Pwm4Alt:1, ft60Pwm1NPolarity:1,
  ft60FaultAlt3:2, ft60FaultAlt4:2,
  ft60Duty1:100, ft60Duty3:100, ft60Duty4:100,
});

/** Release an alternate or complementary PWM route before another feature claims its pin. */
export function releaseFt60PwmRoutingPin(project,pin){
  for(const [key,route] of Object.entries(ROUTES))if(route.pin===pin)project.peripherals[key]=0;
}

/** Update a routing control; assigning a route also configures its pin and Timer2. */
export function setFt60PwmRoutingControl(project,device,key,value){
  if(!project?.peripherals || !project.pins || device?.family!=='FT60E21x')throw new Error('FT60 routing requires an FT60E21x device.');
  if(!Object.hasOwn(VALUES,key) || !Number.isInteger(value) || value<0 || value>VALUES[key])throw new Error('Invalid PWM routing control value.');
  const p=project.peripherals, route=ROUTES[key];
  if(route && value){
    if(!device.pins.includes(route.pin))throw new Error(`Pin ${route.pin} is unavailable in the selected package.`);
    // One-pulse mode does not drive the P1C1/P1D1 outputs; select continuous mode.
    if((key==='ft60Pwm3Alt'||key==='ft60Pwm4Alt') && p.ft60Mode===1)p.ft60Mode=0;
    p.ft60Ioc &= ~(1<<Number(route.pin[2]));
    if(route.pin==='PA4'){
      p.ft60Pwm2=0;
      if(p.ft60Lvd>=0 && p.ft60LvdInput===2)p.ft60LvdInput=0;
    }
    if(route.pin==='PA5' && p.ft60Lvd>=0 && p.ft60LvdInput===1)p.ft60LvdInput=0;
    if(p.timer2<0)p.timer2=0;
    project.pins[route.pin]='GPIO output';
  }
  p[key]=value;
}

/** Create an optional card inside the PWM panel; sync after the main UI renders. */
export function createFt60PwmRoutingUi({panel,getProject,getDevice,render,document:doc=globalThis.document}){
  if(!panel || !doc || typeof getProject!=='function' || typeof getDevice!=='function' || typeof render!=='function')throw new Error('Missing PWM routing UI dependency.');
  const card=doc.createElement('article');card.className='config-card';
  const heading=doc.createElement('h2');heading.textContent='Complementary and alternate PWM outputs';card.append(heading);
  const groups=[];
  function control(container,key,labelText,options){
    const wrap=doc.createElement('div');const label=doc.createElement('label');const select=doc.createElement('select');
    label.textContent=labelText;label.htmlFor=key;select.id=key;
    for(const [value,text] of options){const opt=doc.createElement('option');opt.value=String(value);opt.textContent=text;select.append(opt);}
    select.addEventListener('change',()=>{setFt60PwmRoutingControl(getProject(),getDevice(),key,Number(select.value));render();});
    wrap.append(label,select);container.append(wrap);return select;
  }
  for(const [key,route] of Object.entries(ROUTES)){
    const group=doc.createElement('div');group.className='peripheral-grid';
    const enabled=control(group,key,route.title,[[0,'Disabled'],[1,'Enabled']]);
    // Alternate-only output must remain configurable even when its primary pin is absent or unused.
    const duty=control(group,'ft60Duty'+route.channel,'Shared duty cycle',Array.from({length:101},(_,i)=>[i,i+'%']));
    const extra=key==='ft60Pwm1N'
      ?control(group,'ft60Pwm1NPolarity','Complementary polarity',[[0,'Normal'],[1,'Inverted']])
      :control(group,'ft60FaultAlt'+route.channel,'Alternate output during fault',[[0,'High impedance'],[1,'Logic 0'],[2,'Logic 1']]);
    card.append(group);groups.push({key,route,group,enabled,duty,extra});
  }
  panel.append(card);
  return {card,sync(){
    const d=getDevice(),p=getProject().peripherals,available=d?.family==='FT60E21x';card.hidden=!available;
    for(const {key,route,group,enabled,duty,extra} of groups){
      group.hidden=!available||!d.pins.includes(route.pin);
      enabled.value=String(p[key]??0);duty.value=String(p['ft60Duty'+route.channel]??50);
      extra.value=String((key==='ft60Pwm1N'?p.ft60Pwm1NPolarity:p['ft60FaultAlt'+route.channel])??0);
      duty.disabled=!p[key];extra.disabled=!p[key];
    }
  }};
}
