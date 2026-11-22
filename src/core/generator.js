// FT61EC2x datasheet Rev 1.01: Tables 2-4, 2-5 and 6-2.
import {devices} from '../data/devices.js';
import {generateFT60Timer0} from './ft60-timer0.js';
import {generateFt61Adc} from './ft61-adc.js';
import {generateFt61Vreg} from './ft61-vreg.js';
import {ft60PwmRouting} from './ft60-pwm-routing.js';
import {generateFt61Gpio} from './ft61-gpio.js';
import {validateProject, frequency} from './project.js';
const hex=n=>'0x'+n.toString(16).toUpperCase().padStart(2,'0');
export function generateInit(project){
 validateProject(project);
 if(devices.find(d=>d.id===project.device).family==='FT60E21x') return generateFT60(project);
 const peripherals=project.peripherals;
 const ircf=project.clock.source===32000?0:7-Math.log2(project.clock.divider);
 const lines=['/* FMD Configurator - '+project.device+' */','#include "SYSCFG.h"','',`/* System clock: ${frequency(project)} Hz */`,'void FMD_Init(void)','{',`    OSCCON = (OSCCON & 0x8E) | ${hex((ircf<<4)|1)};`, '    CMCON0 = (CMCON0 & 0xF8u) | 0x07u; /* GPIO and ADC: comparators disabled */'];
 if(peripherals.irqTimer0||peripherals.irqTimer1||peripherals.irqTimer2||peripherals.irqADC||peripherals.ft61Ioc||peripherals.ft61Edge)lines.splice(6,0,'    GIE = 0; /* Global interrupts remain off until the application installs an ISR. */');
 for(const [pin,fn] of Object.entries(project.pins)){
  if(!['GPIO input','GPIO input + pull-up','GPIO input + pull-down','GPIO output'].includes(fn)) continue;
  const bit=Number(pin[2]),port=pin[1], analog=port==='A'&&bit<=3?bit:port==='C'&&bit<=2?bit+4:null;
  lines.push(`    /* ${pin}: ${fn}. */`);
  if(analog!==null) lines.push(`    ANSEL &= (unsigned char)~(1u << ${analog});`);
  if(fn==='GPIO output') lines.push(`    PORT${port} &= (unsigned char)~(1u << ${bit}); /* initial output level: low */`);
  lines.push(`    TRIS${port} ${fn==='GPIO output'?'&= (unsigned char)~':'|='}(1u << ${bit});`);
 }
 lines.push(...generateFt61Adc(project));
 lines.push(...generateFt61Gpio(project));
 if(peripherals.timer0>=0){lines.push('', '    /* Timer0: instruction clock and prescaler. */', `    OPTION = (OPTION & 0xC0u) | ${hex(peripherals.timer0)};`, '    TMR0 = 0;');}
 if(peripherals.timer1>=0){lines.push('', '    /* Timer1: instruction clock and prescaler. */', '    T1CON = 0;', '    TMR1H = 0;', '    TMR1L = 0;', `    T1CON = ${hex((peripherals.timer1<<4)|1)};`);}
 if(peripherals.timer2>=0){lines.push('', '    /* Timer2: instruction clock, period 255, postscaler 1. */', '    T2CON = 0;', '    MSCKCON &= (unsigned char)~(1u << 5);', '    TMR2 = 0;', '    PR2 = 0xFF;', `    T2CON = ${hex(peripherals.timer2|4)};`);}
 for(const n of [3,4,5]) if(peripherals['timer'+n]>=0){
  const duty=peripherals['pwm'+n]?Math.round(peripherals['pwm'+n+'Duty']*256/100):0;
  lines.push('', `    /* Timer${n}: 8-bit period, 2 x instruction clock, prescaler. */`, `    PWM${n}CR1 = 0;`, `    PWM${n}CR0 = 0x30;`, `    T${n}CKDIV = 0;`, `    TMR${n}L = 0;`, `    TMR${n}H = ${hex(duty>>8)};`, ...(peripherals['pwm'+n]?[`    PR${n}L = ${hex(duty & 255)}; /* ${peripherals['pwm'+n+'Duty']}% duty */`]:[]), `    PWM${n}CR1 = ${hex((peripherals['pwm'+n]?0x80:0)|(peripherals['timer'+n]<<3)|4)};`);
 }
 lines.push(...generateFt61Vreg(project,devices.find(d=>d.id===project.device)));
 if(peripherals.lvd>=0)lines.push('', '    /* Low-voltage detector threshold. */', `    PCON = (PCON & 0x87u) | ${hex((peripherals.lvd<<4)|8)};`);
 if(peripherals.watchdog>=0)lines.push('', '    /* Watchdog: bypass shared postscaler; select period and enable. */', '    OPTION &= (unsigned char)~(1u << 3);', `    WDTCON = ${hex((peripherals.watchdog<<1)|1)};`);
 const irq=peripherals;if(irq.irqTimer0||irq.irqTimer1||irq.irqTimer2||irq.irqADC||irq.ft61Ioc||irq.ft61Edge){lines.push('', '    /* Clear flags and enable selected interrupts. */');if(irq.irqTimer0)lines.push('    T0IF = 0;', '    T0IE = 1;');if(irq.irqTimer1)lines.push('    TMR1IF = 0;', '    TMR1IE = 1;');if(irq.irqTimer2)lines.push('    TMR2IF = 0;', '    TMR2IE = 1;');if(irq.irqADC)lines.push('    ADIF = 0;', '    ADIE = 1;');if(irq.irqTimer1||irq.irqTimer2||irq.irqADC)lines.push('    PEIE = 1;');lines.push('    GIE = 0; /* Install an ISR before enabling global interrupts. */');}
 lines.push('}', '', 'void main(void)', '{', '    FMD_Init();', '', '    /* USER CODE BEGIN: setup */', '    /* USER CODE END: setup */', '', '    while (1)', '    {', '        /* USER CODE BEGIN: loop */', '        /* USER CODE END: loop */', '    }', '}', '');return lines.join('\n');
}

// FT60E21x datasheet Rev 1.01, Tables 2-3, 6-2, 7-4, 7-5 and 7-7.
function generateFT60(project){
 const p=project.peripherals;
 const routing=ft60PwmRouting(project,devices.find(d=>d.id===project.device));
 const pwmEnabled=routing.activeChannels.some(Boolean);
 const ircf=project.clock.source===32000?0:7-Math.log2(project.clock.divider);
 const lines=['/* FMD Configurator - '+project.device+' */','#include "SYSCFG.h"','',`/* System clock: ${frequency(project)} Hz; internal oscillator boot mode required. */`,'void FMD_Init(void)','{',`    OSCCON = (OSCCON & 0x8F) | ${hex(ircf<<4)};`];
 if(p.irqTimer0||p.irqTimer2||p.ft60LvdIrq||p.ft60Ioc||p.ft60Edge)lines.splice(6,0,'    GIE = 0; /* Global interrupts remain off until the application installs an ISR. */');
 for(const [pin,fn] of Object.entries(project.pins)){const bit=Number(pin[2]);lines.push(`    /* ${pin}: ${fn}. */`);if(fn==='GPIO output')lines.push(`    PORTA &= (unsigned char)~(1u << ${bit});`);lines.push(`    TRISA ${fn==='GPIO output'?'&= (unsigned char)~':'|='}(1u << ${bit});`);}
 for(const n of [4,5]){const shift=(n-4)*2,source=p['ft60Source'+n],sink=p['ft60Sink'+n];if(source>=0)lines.push(`    PSRCA = (PSRCA & ${hex(0xFF^(3<<shift))}u) | ${hex(source<<shift)};`);if(sink>=0)lines.push(`    PSINKA = (PSINKA & ${hex(0xFF^(1<<(n-4)))}u) | ${hex(sink<<(n-4))};`);}
 lines.push(`    OSCCON = (OSCCON & 0x7Fu) | ${hex(p.ft60LircMode<<7)}; /* LIRC for Timer2 and watchdog */`);
 const pullups=Object.entries(project.pins).reduce((mask,[pin,fn])=>fn==='GPIO input + pull-up'?mask|(1<<Number(pin[2])):mask,0);
 lines.push('', '    /* PORTA weak pull-ups. */', `    WPUA = ${hex(pullups)};`, `    OPTION ${pullups?'&= (unsigned char)~':'|='}(1u << 7);`);
 lines.push(...generateFT60Timer0(project));
 if(p.timer2>=0)lines.push('', '    /* Timer2: instruction clock, 16-bit period, postscaler 1. */', '    T2CON0 = 0;', `    T2CON1 = ${hex(p.ft60T2Clock)};`, '    TMR2H = 0;', '    TMR2L = 0;', `    PR2H = ${hex((pwmEnabled?p.ft60Period:p.ft60T2Period)>>8)};`, `    PR2L = ${hex((pwmEnabled?p.ft60Period:p.ft60T2Period)&255)};`, `    MSCON = (MSCON & 0xFEu) | ${hex(p.ft60T2Sleep)};`, `    T2CON0 = ${hex((p.ft60T2Post<<3)|p.timer2)}; /* Keep Timer2 stopped until configuration is complete. */`);
 if(pwmEnabled){let mask=0,polarity=0;for(const [n,letter,bit] of [[1,'A',0],[2,'B',6],[3,'C',7],[4,'D',5]])if(routing.activeChannels[n-1]){const duty=Math.round(p['ft60Duty'+n]*(p.ft60Period+1)/100);mask|=1<<bit;polarity|=p['ft60Polarity'+n]<<bit;lines.push(`    P1${letter}DTH = ${hex(duty>>8)};`, `    P1${letter}DTL = ${hex(duty&255)};`);}lines.push(`    P1POL = ${hex(routing.pol)};`, `    P1CON = ${hex((p.ft60AutoResume<<7)|p.ft60Deadband)};`, `    T2CON1 = ${hex((p.ft60Mode===1?0x10:p.ft60Mode===2?0x08:0)|p.ft60T2Clock)};`, `    P1BR0 = ${hex((p.ft60Fault<<4)|(p.ft60FaultState2<<2)|p.ft60FaultState1)};`, `    P1BR1 = ${hex(routing.br1)};`, `    P1OE = ${hex(routing.oe)};`);}
 if(p.ft60Lvd>=0)lines.push('', '    /* LVD input, polarity and debounce. */', `    LVDCON = ${hex((p.ft60LvdDebounce<<2)|p.ft60LvdInput)};`, `    WDTCON = (WDTCON & 0x7Fu) | ${hex(p.ft60LvdPolarity<<7)};`, `    PCON = (PCON & 0x07u) | ${hex((p.ft60Lvd<<4)|8)};`);

 if(p.timer2>=0)lines.push('    T2CON0 |= (1u << 2); /* Start Timer2 after PWM and fault setup. */');
 if(p.ft60Ioc){lines.push('', `    IOCA = ${hex(p.ft60Ioc)};`, '    (void)PORTA; /* establish change-detection baseline */', '    PAIF = 0;', '    PAIE = 1;');}
 if(p.ft60Edge){lines.push('', `    OPTION ${p.ft60Edge===1?'|=':'&= (unsigned char)~'}(1u << 6);`, '    INTF = 0;', '    INTE = 1;');}
 if(p.irqTimer0||p.irqTimer2||p.ft60LvdIrq||p.ft60Ioc||p.ft60Edge){lines.push('', '    /* Clear flags and enable selected interrupts. */');if(p.irqTimer0)lines.push('    T0IF = 0;', '    T0IE = 1;');if(p.irqTimer2)lines.push('    TMR2IF = 0;', '    TMR2IE = 1;');if(p.ft60LvdIrq)lines.push('    LVDIF = 0;', '    LVDIE = 1;');if(p.irqTimer2||p.ft60LvdIrq)lines.push('    PEIE = 1;');lines.push('    GIE = 0; /* Install an ISR before enabling global interrupts. */');}
 lines.push('}', '', 'void main(void)', '{', '    FMD_Init();', '', '    /* USER CODE BEGIN: setup */', '    /* USER CODE END: setup */', '', '    while (1)', '    {', '        /* USER CODE BEGIN: loop */', '        /* USER CODE END: loop */', '    }', '}', '');return lines.join('\n');
}
