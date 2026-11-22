// FT61EC2x Data Sheet Rev 1.01, PDF pages 10?12, figures 1-2?1-7 and table 1-1.
export const functions = {
 PA0:['GPIO input','GPIO output','AN0','C1IN+','ISPCLK'], PA1:['GPIO input','GPIO output','AN1','C1IN-','ISPDAT'],
 PA2:['GPIO input','GPIO output','AN2','C1OUT','T0CKI'], PA3:['GPIO input','GPIO output','AN3'],
 PA4:['GPIO input','GPIO output','VREGP','ATEST0'], PA5:['GPIO input','GPIO output','MCLRB'],
 PA6:['GPIO input','GPIO output','OSC2','T1G','CLKO'], PA7:['GPIO input','GPIO output','OSC1','T1CKI','CLKI'],
 PC0:['GPIO input','GPIO output','AN4','C2IN+','P1F','VREF'], PC1:['GPIO input','GPIO output','AN5','C2IN-','P1E','INT'],
 PC2:['GPIO input','GPIO output','AN6','PWM5','P1D'], PC3:['GPIO input','GPIO output','PWM4','P1C'],
 PC4:['GPIO input','GPIO output','PWM3','P1B','C2OUT'], PC5:['GPIO input','GPIO output','CCP1','VREGN','P1A']
};
export const devices = [
 {id:'FT61EC20', package:'SOT23-6',pins:['PA1','GND','PC1','PA6','VDD','PA0']},
 {id:'FT61EC21A',package:'SOP8 / DIP8',pins:['VDD','PA6','PC3','PC2','PC4','PA1','PA0','GND']},
 {id:'FT61EC21B',package:'SOP8 / DIP8',pins:['VDD','PA6','PC3','PC2','PC1','PA1','PA0','GND']},
 {id:'FT61EC2F',package:'MSOP10',pins:['VDD','PA7','PA6','PC3','PC2','PC4','PA2','PA1','PA0','GND']},
 {id:'FT61EC22A',package:'SOP14 / DIP14',pins:['VDD','PA7','PA6','PA4','PC3','PC2','PC4','PC1','PC0','PA3','PA2','PA1','PA0','GND']},
 {id:'FT61EC23',package:'SOP16 / DIP16',pins:['VDD','PA7','PA6','PA5','PC3','PC2','PA4','PC5','PC4','PC1','PC0','PA3','PA2','PA1','PA0','GND']}
];
