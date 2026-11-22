import test from 'node:test';
import assert from 'node:assert/strict';
import {ft61VregDefaults,validateFt61Vreg} from '../src/core/ft61-vreg.js';
import {ft61VregAvailable,ft61VregReservedPins,setFt61VregEnabled,normalizeFt61VregDevice,createFt61VregUI} from '../src/ui/ft61-vreg.js';
const d14={id:'FT61EC22A',pins:['PA4','PA0']},d16={id:'FT61EC23',pins:['PA4','PC5','PA0']},small={id:'FT61EC21B',pins:['PA0','PA1']},ft60={id:'FT60E211',pins:['PA4','PA0']};
const makeProject=()=>({pins:{PA4:'GPIO input',PC5:'GPIO output'},peripherals:{...ft61VregDefaults,ft61Ioc:16}});
class Element { constructor(tag){this.tagName=tag;this.children=[];this.hidden=false;this.value='';this.disabled=false;this.textContent='';} append(...els){for(const e of els)e.parentElement=this;this.children.push(...els);} }
const doc={createElement:tag=>new Element(tag)};
function find(root,id){if(root.id===id)return root;for(const e of root.children){const r=find(e,id);if(r)return r;}return null;}
test('shared enable reserves both present pins and clears conflicting IOC',()=>{
 const p=makeProject();setFt61VregEnabled(p,d16,true);assert.deepEqual(ft61VregReservedPins(p,d16),['PA4','PC5']);assert.deepEqual(p.pins,{});assert.equal(p.peripherals.ft61Ioc,0);assert.doesNotThrow(()=>validateFt61Vreg(p,d16));
 setFt61VregEnabled(p,d16,false);assert.deepEqual(ft61VregReservedPins(p,d16),[]);
});
test('package changes disable unavailable regulator and preserve available state',()=>{
 const p=makeProject();assert.equal(ft61VregAvailable(ft60),false);assert.throws(()=>setFt61VregEnabled(p,ft60,true));
 setFt61VregEnabled(p,d16,true);normalizeFt61VregDevice(p,d14);assert.equal(p.peripherals.ft61Vreg,1);assert.deepEqual(ft61VregReservedPins(p,d14),['PA4']);
 normalizeFt61VregDevice(p,small);assert.equal(p.peripherals.ft61Vreg,0);
});
test('UI updates controls, nominal values and output visibility across packages',()=>{
 const p=makeProject();let d=d16,changes=0;const container=new Element('section');const ui=createFt61VregUI({container,getProject:()=>p,getDevice:()=>d,onChange:()=>changes++,document:doc});ui.render();
 assert.equal(ui.card.hidden,false);assert.equal(find(ui.card,'ft61VregRef').disabled,true);
 const toggle=find(ui.card,'ft61Vreg');toggle.value='1';toggle.onchange();assert.equal(changes,1);assert.equal(p.peripherals.ft61Vreg,1);ui.render();assert.equal(find(ui.card,'ft61VregRef').disabled,false);
 const ref=find(ui.card,'ft61VregRef');ref.value='2';ref.onchange();assert.equal(p.peripherals.ft61VregRef,2);ui.render();
 d=d14;normalizeFt61VregDevice(p,d);ui.render();assert.equal(find(ui.card,'ft61VregP').parentElement.hidden,false);assert.equal(find(ui.card,'ft61VregN').parentElement.hidden,true);assert.equal(p.peripherals.ft61Vreg,1);d=small;normalizeFt61VregDevice(p,d);ui.render();assert.equal(ui.card.hidden,true);assert.equal(p.peripherals.ft61Vreg,0);
});
