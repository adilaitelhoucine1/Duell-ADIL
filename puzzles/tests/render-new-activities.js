'use strict';

const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');

const workspace=path.resolve(__dirname,'..','..');
const outputDir=path.join(workspace,'tmp','pdfs','new-activities');
fs.mkdirSync(outputDir,{recursive:true});

const document={
  createElement(tag){
    if(tag!=='canvas')throw new Error(`Unsupported test element: ${tag}`);
    return createCanvas(1,1);
  }
};
const context={window:{},document,console};
vm.createContext(context);
for(const filename of ['core.js','logic.js','activities.js','solution-pages.js']){
  vm.runInContext(fs.readFileSync(path.join(workspace,'puzzles',filename),'utf8'),context,{filename});
}

const core=context.window.DuelPuzzleCore;
const palette={ink:'#18202A',accent:'#C81E3C'};

function renderActivity(type,options={}){
  const canvas=createCanvas(2550,3300),ctx=canvas.getContext('2d');
  ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);
  const record=core.generate(type,{seed:81473,...options});
  core.draw(ctx,{x:153,y:153,w:2244,h:2994},record,palette);
  return canvas;
}

function save(name,canvas){
  fs.writeFileSync(path.join(outputDir,name),canvas.toBuffer('image/png'));
}

function drawContained(ctx,img,x,y,w,h){
  const scale=Math.min(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;
  ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}

(async()=>{
  const dots=renderActivity('dotsboxes');
  const draw=renderActivity('drawobject',{drawPrompts:['LIGHTHOUSE']});
  save('01-dots-and-boxes.png',dots);save('02-draw-the-object.png',draw);

  const existing=['01-wordsearch-solution.png','02-sudoku-solution.png','03-maze-solution.png','04-numbersearch-solution.png'];
  const sourceDir=path.join(workspace,'tmp','pdfs','premium-final');
  const solutionImages=await Promise.all(existing.map(name=>loadImage(path.join(sourceDir,name))));
  const items=solutionImages.map((image,index)=>({
    solutionNumber:index+1,
    kindLabel:['Word Search','Sudoku','Maze','Number Search'][index],
    makeSolutionTile:()=>image,
    makeSolutionComposite:()=>image
  }));
  const solutionSheet=context.window.DuelSolutionPages.drawSheet({items,pageNumber:1,totalPages:1,pageInches:[8.25,6],dpi:360,...palette});
  const solutionPreview=context.window.DuelSolutionPages.drawSheet({items,pageNumber:1,totalPages:1,pageInches:[8.25,6],dpi:110,...palette});
  save('03-four-up-solutions.png',solutionSheet);save('04-ui-solution-preview.png',solutionPreview);

  const contact=createCanvas(1800,1250),ctx=contact.getContext('2d');
  ctx.fillStyle='#EDEFF3';ctx.fillRect(0,0,contact.width,contact.height);
  ctx.fillStyle='#14161B';ctx.font='800 40px Arial';ctx.textAlign='center';ctx.fillText('NEW ACTIVITY & SOLUTION QA',contact.width/2,58);
  const cards=[
    {img:dots,label:'DOTS & BOXES',x:40,y:100,w:520,h:1080},
    {img:draw,label:'DRAW THE OBJECT',x:640,y:100,w:520,h:1080},
    {img:solutionSheet,label:'4-UP SOLUTIONS',x:1200,y:100,w:560,h:1080}
  ];
  for(const card of cards){
    ctx.fillStyle='#FFFFFF';ctx.fillRect(card.x,card.y,card.w,card.h);
    ctx.strokeStyle='#C9CDD6';ctx.lineWidth=3;ctx.strokeRect(card.x,card.y,card.w,card.h);
    drawContained(ctx,card.img,card.x+18,card.y+70,card.w-36,card.h-92);
    ctx.fillStyle='#14161B';ctx.font='800 25px Arial';ctx.textAlign='center';ctx.fillText(card.label,card.x+card.w/2,card.y+40);
  }
  save('contact-new-activities.png',contact);
  console.log(`Rendered activity QA to ${outputDir}`);
})().catch(error=>{console.error(error);process.exitCode=1;});
