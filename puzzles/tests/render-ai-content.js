'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');

const workspace=path.resolve(__dirname,'..','..');
const outputDir=path.join(workspace,'tmp','pdfs','ai-content');
fs.mkdirSync(outputDir,{recursive:true});

const document={createElement(tag){if(tag!=='canvas')throw new Error(`Unsupported test element: ${tag}`);return createCanvas(1,1);}};
const context={window:{},document,console};
vm.createContext(context);
for(const filename of ['core.js','logic.js','word.js','activities.js']){
  vm.runInContext(fs.readFileSync(path.join(workspace,'puzzles',filename),'utf8'),context,{filename});
}

const core=context.window.DuelPuzzleCore;
const palette={ink:'#18202A',accent:'#C81E3C'};

function render(type,options,copy){
  const canvas=createCanvas(2550,3300),ctx=canvas.getContext('2d');
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);
  const record=core.generate(type,{difficulty:'medium',seed:88413,...options});
  record.copy={...copy,eyebrow:'OCEAN EXPLORER DUEL'};
  core.draw(ctx,{x:153,y:153,w:2244,h:2994},record,palette);
  return canvas;
}

function save(name,canvas){fs.writeFileSync(path.join(outputDir,name),canvas.toBuffer('image/png'));}

function contained(ctx,image,x,y,w,h){
  const scale=Math.min(w/image.width,h/image.height),dw=image.width*scale,dh=image.height*scale;
  ctx.drawImage(image,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}

const copy={
  title:'MYSTERIOUS DEEP-SEA DISCOVERY DUEL',
  instruction:'Explore carefully and complete the challenge using the exact puzzle rules shown on this page.',
  footer:'DIVE DEEP | THINK SHARP | PLAY FAIR'
};
const wordsearch=render('wordsearch',{words:['CORAL','WHALE','SHARK','OCEAN','SHELL','REEFS']},copy);
const sudoku=render('sudoku',{},copy);
const drawing=render('drawobject',{drawPrompts:['DEEP SEA SUBMARINE']},copy);
save('01-ai-wordsearch.png',wordsearch);
save('02-ai-sudoku.png',sudoku);
save('03-ai-draw-object.png',drawing);

const contact=createCanvas(2100,1180),ctx=contact.getContext('2d');
ctx.fillStyle='#ECEFF4';ctx.fillRect(0,0,contact.width,contact.height);
ctx.fillStyle='#151922';ctx.textAlign='center';ctx.font='800 42px Arial';ctx.fillText('AI CONTENT · PRINT LAYOUT QA',contact.width/2,62);
[
  {image:wordsearch,label:'AI WORD SEARCH'},
  {image:sudoku,label:'AI SUDOKU'},
  {image:drawing,label:'AI DRAW PROMPT'}
].forEach((item,index)=>{
  const x=45+index*695,y=100,w=620,h=1030;
  ctx.fillStyle='#FFFFFF';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#C9CFD9';ctx.lineWidth=3;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='#151922';ctx.font='800 25px Arial';ctx.fillText(item.label,x+w/2,y+42);
  contained(ctx,item.image,x+24,y+70,w-48,h-94);
});
save('contact-ai-content.png',contact);
console.log(`Rendered AI content QA to ${outputDir}`);
