(function(global){
  'use strict';

  const C=global.DuelPuzzleCore;
  const DEFAULT_DRAW_PROMPTS=[
    'LIGHTHOUSE','ROCKET','TREE HOUSE','BICYCLE','CASTLE','SAILBOAT',
    'ELEPHANT','ROBOT','HOT-AIR BALLOON','SNOWMAN','CAMERA','DINOSAUR'
  ];

  function openActivitySolution(kind,details={}){
    return {answerKey:false,kind,...details};
  }

  function dotsBoxesGenerate(){
    const rows=5,cols=5;
    return {
      puzzle:{rows,cols},
      solution:openActivitySolution('competitive-game',{maximumBoxes:(rows-1)*(cols-1)})
    };
  }

  function dotsBoxesValidate(record){
    const {rows,cols}=record.puzzle||{};
    const maximumBoxes=(rows-1)*(cols-1);
    const valid=Number.isInteger(rows)&&Number.isInteger(cols)&&rows===5&&cols===5&&
      record.solution?.answerKey===false&&record.solution.maximumBoxes===maximumBoxes;
    return {valid,solutionChecked:true,competitive:true,dots:rows*cols,maximumBoxes};
  }

  function drawScorePanel(ctx,x,y,w,h,label,ink,accent,turn=false){
    ctx.save();
    if(turn){ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);x=-w/2;y=-h/2;}
    C.drawPanel(ctx,x,y,w,h,{fill:'rgba(255,255,255,.94)',stroke:ink,lineWidth:4,radius:26});
    const pad=w*.055,labelW=w*.30,lineX=x+labelW;
    ctx.fillStyle=accent;ctx.font=`900 ${Math.max(28,h*.14)}px Arial, sans-serif`;
    ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,x+pad,y+h*.28);
    ctx.fillStyle=ink;ctx.font=`800 ${Math.max(23,h*.105)}px Arial, sans-serif`;
    ctx.fillText('NAME',x+pad,y+h*.57);ctx.fillText('SCORE',x+pad,y+h*.82);
    ctx.strokeStyle=ink;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(lineX,y+h*.60);ctx.lineTo(x+w-pad,y+h*.60);
    ctx.moveTo(lineX,y+h*.85);ctx.lineTo(x+w-pad,y+h*.85);ctx.stroke();
    ctx.restore();
  }

  function dotsBoxesDraw(ctx,rect,record,opts={}){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'DOTS & BOXES',subtitle:'Join adjacent dots. Complete a box to score - then play again.',footer:'MOST COMPLETED BOXES WINS'});
    const body=C.premiumLayout(ctx,rect,{
      ...copy,solution:false,ink,accent
    });
    const panelW=Math.min(body.w*.58,1220),panelH=Math.min(body.h*.15,330);
    const panelX=body.x+(body.w-panelW)/2;
    drawScorePanel(ctx,panelX,body.y+8,panelW,panelH,'PLAYER 2',ink,accent,true);
    drawScorePanel(ctx,panelX,body.y+body.h-panelH-8,panelW,panelH,'PLAYER 1',ink,accent,false);

    const rows=record.puzzle.rows,cols=record.puzzle.cols;
    const availableH=body.h-panelH*2-body.h*.12;
    const gridSize=Math.min(body.w*.58,availableH*.94);
    const gridX=body.x+(body.w-gridSize)/2,gridY=body.y+(body.h-gridSize)/2;
    const dx=gridSize/(cols-1),dy=gridSize/(rows-1),radius=Math.max(15,gridSize*.021);
    ctx.save();ctx.fillStyle=ink;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      ctx.beginPath();ctx.arc(gridX+c*dx,gridY+r*dy,radius,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  function normalizePrompt(value){
    return String(value||'').toUpperCase().replace(/[^A-Z0-9 '&-]/g,'').replace(/\s+/g,' ').trim().slice(0,40);
  }

  function drawObjectGenerate({rng,drawPrompts}={}){
    const supplied=(Array.isArray(drawPrompts)?drawPrompts:[]).map(normalizePrompt).filter(Boolean);
    const prompt=C.choice(supplied.length?supplied:DEFAULT_DRAW_PROMPTS,rng);
    return {
      puzzle:{prompt},
      solution:openActivitySolution('judged-drawing',{rule:'Closest recognizable drawing to the named object wins.'})
    };
  }

  function drawObjectValidate(record){
    const prompt=record.puzzle?.prompt||'';
    const valid=prompt.length>=2&&prompt.length<=40&&record.solution?.answerKey===false;
    return {valid,solutionChecked:true,competitive:true,promptLength:prompt.length};
  }

  function drawObjectDraw(ctx,rect,record,opts={}){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'DRAW THE OBJECT',subtitle:'Draw the named object. The closest recognizable drawing wins.',footer:'IMAGINE IT  |  DRAW IT  |  WIN IT'});
    const body=C.premiumLayout(ctx,rect,{
      ...copy,solution:false,ink,accent
    });
    const promptH=Math.min(body.h*.22,500),gap=Math.max(42,body.h*.025);
    C.drawPanel(ctx,body.x,body.y+10,body.w,promptH,{fill:'rgba(255,255,255,.95)',stroke:accent,lineWidth:5,radius:34});
    ctx.save();ctx.fillStyle=accent;ctx.font=`800 ${Math.max(28,promptH*.105)}px Arial, sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('YOUR OBJECT',body.x+body.w/2,body.y+promptH*.17);
    const size=C.fitFont(ctx,record.puzzle.prompt,body.w*.84,Math.min(108,promptH*.29),54);
    ctx.fillStyle=ink;ctx.font=`900 ${size}px Arial, sans-serif`;ctx.textBaseline='middle';
    ctx.fillText(record.puzzle.prompt,body.x+body.w/2,body.y+promptH*.64);ctx.restore();

    const drawY=body.y+promptH+gap,drawH=body.y+body.h-drawY-20;
    C.drawPanel(ctx,body.x,drawY,body.w,drawH,{fill:'#FFFFFF',stroke:ink,lineWidth:5,radius:30});
    ctx.save();ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.setLineDash([22,18]);ctx.globalAlpha=.52;
    C.roundedPath(ctx,body.x+28,drawY+28,body.w-56,drawH-56,20);ctx.stroke();ctx.restore();
    ctx.save();ctx.fillStyle=ink;ctx.globalAlpha=.55;ctx.font=`700 ${Math.max(24,drawH*.025)}px Arial, sans-serif`;
    ctx.textAlign='left';ctx.textBaseline='bottom';ctx.fillText('NAME  ____________________',body.x+55,drawY+drawH-54);
    ctx.textAlign='right';ctx.fillText('POINTS  ______',body.x+body.w-55,drawY+drawH-54);ctx.restore();
  }

  C.register({
    id:'dotsboxes',name:'Dots & Boxes',icon:'•─•',
    description:'Classic two-player box-claiming game with a 5 x 5 dot grid.',
    source:'custom activity',qualityLabel:'Competitive rules checked',hasAnswerKey:false,
    generate:dotsBoxesGenerate,validate:dotsBoxesValidate,draw:dotsBoxesDraw
  });

  C.register({
    id:'drawobject',name:'Draw the Object',icon:'✎',
    description:'AI-ready object prompt above a large blank drawing canvas.',
    source:'custom activity',qualityLabel:'AI-ready prompt activity',hasAnswerKey:false,needsDrawPrompts:true,
    generate:drawObjectGenerate,validate:drawObjectValidate,draw:drawObjectDraw
  });
})(window);
