(function(global){
  'use strict';

  const definitions=new Map();

  function makeRng(seed){
    let a=(seed>>>0)||0x9E3779B9;
    return function(){
      a|=0;a=(a+0x6D2B79F5)|0;
      let t=Math.imul(a^(a>>>15),1|a);
      t=(t+Math.imul(t^(t>>>7),61|t))^t;
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }

  function randomInt(rng,min,max){return Math.floor(rng()*(max-min+1))+min;}

  function shuffle(values,rng){
    const result=[...values];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(rng()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }

  function choice(values,rng){return values[Math.floor(rng()*values.length)];}
  function cloneGrid(grid){return grid.map(row=>row.slice());}

  function fitFont(ctx,text,maxWidth,targetPx,minPx){
    let size=targetPx;
    while(size>minPx){
      ctx.font=`700 ${size}px Arial, sans-serif`;
      if(ctx.measureText(String(text)).width<=maxWidth) break;
      size-=1;
    }
    return size;
  }

  function drawHeading(ctx,x,y,w,text,opts={}){
    const ink=opts.ink||'#111111';
    const size=Math.max(54,Math.min(118,w*.055));
    ctx.save();ctx.fillStyle=ink;ctx.font=`800 ${size}px Arial, sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(text,x+w/2,y);
    ctx.restore();
    return size*1.35;
  }

  function roundedPath(ctx,x,y,w,h,r=24){
    const radius=Math.max(0,Math.min(r,w/2,h/2));
    ctx.beginPath();ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+radius);ctx.lineTo(x+w,y+h-radius);
    ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);ctx.lineTo(x+radius,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-radius);ctx.lineTo(x,y+radius);
    ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
  }

  function drawPanel(ctx,x,y,w,h,opts={}){
    ctx.save();roundedPath(ctx,x,y,w,h,opts.radius||24);
    if(opts.fill!==false){ctx.fillStyle=opts.fill||'#FFFFFF';ctx.fill();}
    if(opts.stroke!==false){ctx.strokeStyle=opts.stroke||'#111111';ctx.lineWidth=opts.lineWidth||3;ctx.stroke();}
    ctx.restore();
  }

  function drawPill(ctx,x,y,w,h,text,opts={}){
    const fill=opts.fill||opts.accent||'#111111',color=opts.color||'#FFFFFF';
    drawPanel(ctx,x,y,w,h,{fill,stroke:fill,lineWidth:2,radius:h/2});
    ctx.save();ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font=`800 ${opts.fontSize||Math.round(h*.36)}px Arial, sans-serif`;
    ctx.fillText(text,x+w/2,y+h*.52);ctx.restore();
  }

  function drawOrnament(ctx,x,y,w,opts={}){
    const ink=opts.ink||'#111111',accent=opts.accent||ink,mid=x+w/2,gap=Math.min(130,w*.07);
    ctx.save();ctx.strokeStyle=ink;ctx.lineWidth=Math.max(2,w*.0015);
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(mid-gap,y);ctx.moveTo(mid+gap,y);ctx.lineTo(x+w,y);ctx.stroke();
    ctx.fillStyle=accent;ctx.translate(mid,y);ctx.rotate(Math.PI/4);ctx.fillRect(-14,-14,28,28);ctx.restore();
  }

  function premiumLayout(ctx,rect,opts={}){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const outerPad=Math.max(24,rect.w*.018),x=rect.x+outerPad,w=rect.w-outerPad*2;
    const top=rect.y+Math.max(10,rect.h*.006),pillH=Math.max(54,rect.h*.019),pillW=Math.min(430,w*.30);
    const label=opts.solution?'ANSWER KEY':(opts.eyebrow||'DUEL PUZZLE');
    drawPill(ctx,x+(w-pillW)/2,top,pillW,pillH,label,{fill:accent,fontSize:pillH*.36});
    const requestedTitle=String(opts.title||'PUZZLE'),titleTarget=Math.max(84,Math.min(132,w*.062));
    const titleSize=fitFont(ctx,requestedTitle,w*.94,titleTarget,58),titleY=top+pillH+28;
    ctx.save();ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='top';ctx.font=`900 ${titleSize}px Arial, sans-serif`;
    ctx.fillText(requestedTitle,x+w/2,titleY);ctx.restore();
    const subtitle=opts.subtitle||'';
    const subtitleTarget=Math.max(30,Math.min(42,w*.019));
    const subtitleSize=subtitle?fitFont(ctx,subtitle,w*.94,subtitleTarget,22):subtitleTarget,subtitleY=titleY+titleSize+14;
    if(subtitle){ctx.save();ctx.fillStyle=ink;ctx.globalAlpha=.76;ctx.textAlign='center';ctx.textBaseline='top';ctx.font=`600 ${subtitleSize}px Arial, sans-serif`;ctx.fillText(subtitle,x+w/2,subtitleY);ctx.restore();}
    const ornamentY=subtitleY+(subtitle?subtitleSize+32:22);drawOrnament(ctx,x+w*.06,ornamentY,w*.88,{ink,accent});
    const footerH=Math.max(66,rect.h*.025),footerY=rect.y+rect.h-footerH;
    ctx.save();ctx.strokeStyle=ink;ctx.globalAlpha=.45;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.12,footerY);ctx.lineTo(x+w*.88,footerY);ctx.stroke();
    ctx.globalAlpha=.68;ctx.fillStyle=ink;ctx.font=`700 ${Math.max(22,w*.012)}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(opts.footer||'THINK CLEARLY  |  PLAY BOLDLY',x+w/2,footerY+footerH*.52);ctx.restore();
    const bodyY=ornamentY+42;
    return {x,y:bodyY,w,h:footerY-bodyY-22,ink,accent,footerY};
  }

  function pageCopy(record,defaults={}){
    const generated=record&&record.copy&&typeof record.copy==='object'?record.copy:{};
    const pick=(key,fallback,max)=>{
      const value=String(generated[key]||'').replace(/\s+/g,' ').trim();
      return (value||fallback||'').slice(0,max);
    };
    return {
      title:pick('title',defaults.title,48),
      subtitle:pick('instruction',defaults.subtitle,120),
      footer:pick('footer',defaults.footer,64),
      eyebrow:pick('eyebrow',defaults.eyebrow,28)
    };
  }

  function drawQualityMark(ctx,x,y,text,opts={}){
    ctx.save();ctx.fillStyle=opts.accent||'#C81E3C';
    ctx.font='700 22px Arial, sans-serif';ctx.textAlign='right';ctx.textBaseline='top';
    ctx.fillText(text,x,y);ctx.restore();
  }

  function register(definition){
    if(!definition||!definition.id||typeof definition.generate!=='function'||typeof definition.draw!=='function'){
      throw new Error('Invalid puzzle definition.');
    }
    if(definitions.has(definition.id)) throw new Error(`Duplicate puzzle id: ${definition.id}`);
    definitions.set(definition.id,Object.freeze({...definition,available:true}));
  }

  function generate(id,options={}){
    const definition=definitions.get(id);
    if(!definition) throw new Error(`Puzzle type not registered: ${id}`);
    const seed=(options.seed>>>0)||Date.now();
    const rng=makeRng(seed);
    const record=definition.generate({...options,seed,rng,utils:api});
    if(!record||record.solution===undefined||record.solution===null){
      throw new Error(`${definition.name} did not return a solution.`);
    }
    const quality=definition.validate?definition.validate(record,{...options,seed,rng,utils:api}):{valid:true};
    if(quality===false||(quality&&quality.valid===false)){
      throw new Error(`${definition.name} failed quality validation${quality?.reason?`: ${quality.reason}`:''}.`);
    }
    return {...record,type:id,seed,quality:quality===true?{valid:true}:quality};
  }

  function draw(ctx,rect,record,options={}){
    const definition=definitions.get(record.type);
    if(!definition) throw new Error(`Renderer not registered: ${record.type}`);
    ctx.save();
    definition.draw(ctx,rect,record,options);
    ctx.restore();
  }

  function list(){
    return [...definitions.values()].map(def=>({
      id:def.id,name:def.name,icon:def.icon||'◆',description:def.description||'',
      needsWords:!!def.needsWords,needsDrawPrompts:!!def.needsDrawPrompts,
      hasAnswerKey:def.hasAnswerKey!==false,source:def.source||'',
      qualityLabel:def.qualityLabel||'Validated solution'
    }));
  }

  const api={register,generate,draw,list,makeRng,randomInt,shuffle,choice,cloneGrid,fitFont,drawHeading,drawQualityMark,roundedPath,drawPanel,drawPill,drawOrnament,premiumLayout,pageCopy};
  global.DuelPuzzleCore=api;
})(window);
