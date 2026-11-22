// FT61EC2x datasheet Rev 1.01: Tables 2-4, 2-5 and 6-2.
import {validateProject, frequency} from './project.js';
const hex=n=>'0x'+n.toString(16).toUpperCase().padStart(2,'0');
export function generateInit(project){
 validateProject(project);
 const peripherals=project.peripherals;
 const ircf=project.clock.source===32000?0:7-Math.log2(project.clock.divider);
 const adcPins=Object.entries(project.pins).filter(([pin,fn])=>/^AN[0-6]$/.test(fn) && Number(fn.slice(2)) === ({PA0:0,PA1:1,PA2:2,PA3:3,PC0:4,PC1:5,PC2:6})[pin]);
 const lines=['/* FMD Configurator - '+project.device+' */','#include "SYSCFG.h"','',`/* System clock: ${frequency(project)} Hz */`,'void FMD_Init(void)','{',`    OSCCON = (OSCCON & 0x8E) | ${hex((ircf<<4)|1)};`];
 for(const [pin,fn] of Object.entries(project.pins)){
  if(!['GPIO input','GPIO output'].includes(fn)) continue;
  const bit=Number(pin[2]),port=pin[1], analog=port==='A'&&bit<=3?bit:port==='C'&&bit<=2?bit+4:null;
  lines.push(`    /* ${pin}: ${fn}. */`);
  if(analog!==null) lines.push(`    ANSEL &= (unsigned char)~(1u << ${analog});`);
  if(fn==='GPIO output') lines.push(`    PORT${port} &= (unsigned char)~(1u << ${bit}); /* initial output level: low */`);
  lines.push(`    TRIS${port} ${fn==='GPIO output'?'&= (unsigned char)~':'|='}(1u << ${bit});`);
 }
 if(adcPins.length){
  lines.push('', '    /* ADC input pins: disable digital input and output drivers. */');
  for(const [pin,fn] of adcPins){const bit=Number(pin[2]),channel=Number(fn.slice(2));lines.push(`    TRIS${pin[1]} |= (1u << ${bit});`, `    ANSEL |= (1u << ${channel});`);}
  const first=Number(adcPins[0][1].slice(2));
  lines.push('', '    /* ADC: selected reference, right justified, software trigger.', '     * SysClk/64 (2T) or SysClk/128 (4T); see datasheet Table 12-2. */', '    ADCON1 = 0x60;', `    ADCON0 = ${hex(0x81|(peripherals.adcRef<<5)|(first<<2))}; /* AN${first}, ADC enabled */`);
 }
 if(peripherals.timer0>=0){lines.push('', '    /* Timer0: instruction clock and prescaler. */', `    OPTION = (OPTION & 0xC0u) | ${hex(peripherals.timer0)};`, '    TMR0 = 0;');}
 if(peripherals.timer1>=0){lines.push('', '    /* Timer1: instruction clock and prescaler. */', '    T1CON = 0;', '    TMR1H = 0;', '    TMR1L = 0;', `    T1CON = ${hex((peripherals.timer1<<4)|1)};`);}
 if(peripherals.timer2>=0){lines.push('', '    /* Timer2: instruction clock, period 255, postscaler 1. */', '    T2CON = 0;', '    MSCKCON &= (unsigned char)~(1u << 5);', '    TMR2 = 0;', '    PR2 = 0xFF;', `    T2CON = ${hex(peripherals.timer2|4)};`);}
 for(const n of [3,4,5]) if(peripherals['timer'+n]>=0){
  const duty=peripherals['pwm'+n]?Math.round(peripherals['pwm'+n+'Duty']*256/100):0;
  lines.push('', `    /* Timer${n}: 8-bit period, instruction clock, prescaler. */`, `    PWM${n}CR1 = 0;`, `    PWM${n}CR0 = 0x30;`, `    T${n}CKDIV = 0;`, `    TMR${n}L = 0;`, `    TMR${n}H = ${hex(duty>>8)};`, ...(peripherals['pwm'+n]?[`    PR${n}L = ${hex(duty & 255)}; /* ${peripherals['pwm'+n+'Duty']}% duty */`]:[]), `    PWM${n}CR1 = ${hex((peripherals['pwm'+n]?0x80:0)|(peripherals['timer'+n]<<3)|4)};`);
 }
 if(peripherals.lvd>=0)lines.push('', '    /* Low-voltage detector threshold. */', `    PCON = (PCON & 0x87u) | ${hex((peripherals.lvd<<4)|8)};`);
 if(peripherals.watchdog>=0)lines.push('', '    /* Watchdog: bypass shared postscaler; select period and enable. */', '    OPTION &= (unsigned char)~(1u << 3);', `    WDTCON = ${hex((peripherals.watchdog<<1)|1)};`);
 const irq=peripherals;if(irq.irqTimer0||irq.irqTimer1||irq.irqTimer2||irq.irqADC){lines.push('', '    /* Clear flags and enable selected interrupts. */');if(irq.irqTimer0)lines.push('    T0IF = 0;', '    T0IE = 1;');if(irq.irqTimer1)lines.push('    TMR1IF = 0;', '    TMR1IE = 1;');if(irq.irqTimer2)lines.push('    TMR2IF = 0;', '    TMR2IE = 1;');if(irq.irqADC)lines.push('    ADIF = 0;', '    ADIE = 1;');if(irq.irqTimer1||irq.irqTimer2||irq.irqADC)lines.push('    PEIE = 1;');lines.push('    GIE = 1;');}
 lines.push('}', '', 'void main(void)', '{', '    FMD_Init();', '', '    /* USER CODE BEGIN: setup */', '    /* USER CODE END: setup */', '', '    while (1)', '    {', '        /* USER CODE BEGIN: loop */', '        /* USER CODE END: loop */', '    }', '}', '');return lines.join('\n');
}
