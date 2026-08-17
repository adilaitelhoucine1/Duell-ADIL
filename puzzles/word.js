(function(global){
  'use strict';
  const C=global.DuelPuzzleCore;

  const WORD_BANKS=[
    ['PLANET','COMET','ORBIT','ROCKET','GALAXY','METEOR','SATURN','COSMOS','LUNAR','STAR'],
    ['FOREST','RIVER','MEADOW','FLOWER','GARDEN','NATURE','LEAVES','MOUNTAIN','OCEAN','DESERT'],
    ['PUZZLE','LOGIC','ANSWER','SEARCH','NUMBER','PATTERN','BRAIN','FOCUS','SOLVE','THINK'],
    ['TIGER','PANDA','DOLPHIN','RABBIT','FALCON','TURTLE','MONKEY','ZEBRA','WHALE','HORSE']
  ];
  const DIRECTIONS=[[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  function cleanWords(values,size){
    const seen=new Set();
    return (values||[]).map(value=>String(value).toUpperCase().replace(/[^A-Z]/g,''))
      .filter(word=>word.length>=3&&word.length<=size&&!seen.has(word)&&seen.add(word));
  }

  function occurrenceKeys(grid,target){
    const size=grid.length,keys=new Set();
    for(const [dr,dc] of DIRECTIONS)for(let r=0;r<size;r++)for(let c=0;c<size;c++){
      const er=r+dr*(target.length-1),ec=c+dc*(target.length-1);if(er<0||er>=size||ec<0||ec>=size)continue;
      let found=true,cells=[];for(let i=0;i<target.length;i++){const rr=r+dr*i,cc=c+dc*i;if(grid[rr][cc]!==target[i]){found=false;break;}cells.push(`${rr},${cc}`);}
      if(found)keys.add(cells.sort().join('|'));
    }
    return keys;
  }

  function placeTargets(targets,size,rng,alphabet){
    for(let restart=0;restart<24;restart++){
      const grid=Array.from({length:size},()=>Array(size).fill(''));
      const placements=[];
      let failed=false;
      for(const target of [...targets].sort((a,b)=>b.length-a.length)){
        const candidates=[];
        for(const [dr,dc] of C.shuffle(DIRECTIONS,rng)){
          for(let r=0;r<size;r++) for(let c=0;c<size;c++){
            const er=r+dr*(target.length-1),ec=c+dc*(target.length-1);
            if(er<0||er>=size||ec<0||ec>=size)continue;
            let overlap=0,valid=true;
            for(let i=0;i<target.length;i++){
              const value=grid[r+dr*i][c+dc*i];
              if(value&&value!==target[i]){valid=false;break;}
              if(value===target[i])overlap++;
            }
            if(valid)candidates.push({r,c,dr,dc,overlap,tie:rng()});
          }
        }
        candidates.sort((a,b)=>b.overlap-a.overlap||a.tie-b.tie);
        const selected=candidates[0];
        if(!selected){failed=true;break;}
        for(let i=0;i<target.length;i++)grid[selected.r+selected.dr*i][selected.c+selected.dc*i]=target[i];
        placements.push({...selected,target});
      }
      if(failed)continue;
      for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(!grid[r][c])grid[r][c]=C.choice(alphabet,rng);
      if(targets.some(target=>occurrenceKeys(grid,target).size!==1))continue;
      return {grid,placements};
    }
    throw new Error('Could not place every search target. Try shorter entries.');
  }

  function validatePlacements(record){
    const {grid,targets,placements}=record.puzzle;
    if(placements.length!==targets.length)return {valid:false,reason:'not every target was placed'};
    const valid=placements.every(p=>{
      const found=Array.from({length:p.target.length},(_,i)=>grid[p.r+p.dr*i][p.c+p.dc*i]).join('');
      return found===p.target&&occurrenceKeys(grid,p.target).size===1;
    });
    return {valid,unique:valid,solutionChecked:valid,allTargetsPlaced:valid,placements:placements.length};
  }

  function drawSearch(ctx,rect,record,opts,title){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const {grid,targets,placements}=record.puzzle,size=grid.length;
    const label=title==='WORD SEARCH'?'Find and circle all six hidden words.':'Find and circle all six hidden numbers.';
    const copy=C.pageCopy(record,{title,subtitle:label});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const listH=Math.max(500,body.h*.25),gridAreaH=body.h-listH-35;
    const side=Math.min(body.w*.95,gridAreaH*.98),x=body.x+(body.w-side)/2,y=body.y+(gridAreaH-side)/2,cell=side/size;
    C.drawPanel(ctx,x-22,y-22,side+44,side+44,{fill:'#FFFFFF',stroke:accent,lineWidth:5,radius:28});
    if(opts.solution){
      ctx.save();ctx.strokeStyle=accent;ctx.globalAlpha=.34;ctx.lineWidth=Math.max(14,cell*.68);ctx.lineCap='round';
      placements.forEach(p=>{ctx.beginPath();ctx.moveTo(x+(p.c+.5)*cell,y+(p.r+.5)*cell);ctx.lineTo(x+(p.c+p.dc*(p.target.length-1)+.5)*cell,y+(p.r+p.dr*(p.target.length-1)+.5)*cell);ctx.stroke();});
      ctx.restore();
    }
    ctx.strokeStyle=ink;ctx.lineWidth=Math.max(3,side*.0025);ctx.strokeRect(x,y,side,side);
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`800 ${cell*.52}px ui-monospace, monospace`;
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)ctx.fillText(grid[r][c],x+(c+.5)*cell,y+(r+.52)*cell);
    const listY=body.y+gridAreaH+35,listX=body.x+body.w*.075,listW=body.w*.85,colGap=34,rowGap=24,cols=2,rows=3;
    const pillW=(listW-colGap)/cols,pillH=(listH-rowGap*(rows-1))/rows;
    targets.slice(0,6).forEach((target,i)=>{
      const col=i%cols,row=Math.floor(i/cols),px=listX+col*(pillW+colGap),py=listY+row*(pillH+rowGap);
      C.drawPanel(ctx,px,py,pillW,pillH,{fill:'#FFFFFF',stroke:ink,lineWidth:3,radius:pillH/2});
      ctx.save();ctx.fillStyle=accent;ctx.translate(px+pillH*.36,py+pillH/2);ctx.rotate(Math.PI/4);ctx.fillRect(-10,-10,20,20);ctx.restore();
      const fontSize=C.fitFont(ctx,target,pillW-pillH*.9,Math.min(60,pillH*.38),30);
      ctx.fillStyle=ink;ctx.font=`900 ${fontSize}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(target,px+pillW*.54,py+pillH*.52);
    });
  }

  function wordSearchGenerate({difficulty,words,rng}){
    const requested=cleanWords(words,18),bank=C.choice(WORD_BANKS,rng);
    const count=6;
    const targets=(requested.length?requested:bank).slice(0,count);
    if(targets.length<6)throw new Error('Word Search needs six valid words for the premium 2-column list.');
    const longest=Math.max(...targets.map(w=>w.length)),size=Math.max({easy:12,medium:14,hard:16}[difficulty]||14,longest);
    const placed=placeTargets(targets,size,rng,'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
    return {puzzle:{...placed,targets},solution:placed.placements};
  }

  C.register({id:'wordsearch',name:'Word Search',icon:'WS',description:'Every listed word is placed and answer coordinates are stored.',needsWords:true,source:'wordsearch/',qualityLabel:'All placements verified',generate:wordSearchGenerate,validate:validatePlacements,draw:(ctx,rect,record,opts)=>drawSearch(ctx,rect,record,opts,'WORD SEARCH')});

  function numberSearchGenerate({difficulty,rng}){
    const count=6,size={easy:12,medium:14,hard:16}[difficulty]||14;
    const targets=[];
    while(targets.length<count){
      const length=C.randomInt(rng,difficulty==='easy'?4:5,difficulty==='hard'?8:7);
      let value=String(C.randomInt(rng,1,9));
      while(value.length<length)value+=String(C.randomInt(rng,0,9));
      if(!targets.includes(value))targets.push(value);
    }
    const placed=placeTargets(targets,size,rng,'0123456789'.split(''));
    return {puzzle:{...placed,targets},solution:placed.placements};
  }

  C.register({id:'numbersearch',name:'Number Search',icon:'#',description:'Every listed number is present and answer coordinates are stored.',source:'number-search/',qualityLabel:'All placements verified',generate:numberSearchGenerate,validate:validatePlacements,draw:(ctx,rect,record,opts)=>drawSearch(ctx,rect,record,opts,'NUMBER SEARCH')});

  const ANAGRAM_BANK=['PLANET','GARDEN','PUZZLE','WINTER','MARKET','CASTLE','BRIDGE','ORANGE','POCKET','STREAM','CAMERA','SILVER','ROCKET','JUNGLE','BASKET','ISLAND','BUTTON','DRAGON','FOREST','PENCIL'];
  function scramble(word,rng){
    for(let i=0;i<30;i++){const value=C.shuffle(word.split(''),rng).join('');if(value!==word)return value;}
    return word.slice(1)+word[0];
  }
  function anagramGenerate({difficulty,rng,words}){
    const count={easy:8,medium:10,hard:12}[difficulty]||10;
    const requested=cleanWords(words,12),source=requested.length>=count?requested:ANAGRAM_BANK;
    const answers=C.shuffle(source,rng).slice(0,count),puzzle=answers.map(answer=>({scrambled:scramble(answer,rng),answer}));
    return {puzzle,solution:answers};
  }
  function anagramValidate(record){
    const valid=record.puzzle.length===record.solution.length&&record.puzzle.every((item,i)=>item.scrambled!==item.answer&&item.answer===record.solution[i]&&[...item.scrambled].sort().join('')===[...item.answer].sort().join(''));
    return {valid,solutionChecked:valid,items:record.solution.length};
  }
  function anagramDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'ANAGRAM',subtitle:'Rearrange every letter to reveal the hidden word.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const cols=2,rows=Math.ceil(record.puzzle.length/cols),gapX=34,gapY=26,x=body.x+body.w*.05,w=body.w*.90;
    const cardW=(w-gapX)/cols,cardH=(body.h-gapY*(rows-1))/rows;
    record.puzzle.forEach((item,i)=>{
      const col=i%cols,row=Math.floor(i/cols),cx=x+col*(cardW+gapX),cy=body.y+row*(cardH+gapY);
      C.drawPanel(ctx,cx,cy,cardW,cardH,{fill:'#FFFFFF',stroke:ink,lineWidth:3,radius:26});
      C.drawPill(ctx,cx+18,cy+18,Math.min(86,cardH*.26),Math.min(58,cardH*.18),String(i+1).padStart(2,'0'),{fill:accent,fontSize:Math.min(26,cardH*.08)});
      const spaced=item.scrambled.split('').join('  '),fontSize=C.fitFont(ctx,spaced,cardW-60,Math.min(68,cardH*.24),34);
      ctx.fillStyle=ink;ctx.font=`900 ${fontSize}px ui-monospace, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(spaced,cx+cardW/2,cy+cardH*.46);
      ctx.strokeStyle=accent;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx+cardW*.16,cy+cardH*.76);ctx.lineTo(cx+cardW*.84,cy+cardH*.76);ctx.stroke();
      if(opts.solution){ctx.fillStyle=accent;ctx.font=`900 ${Math.min(54,cardH*.17)}px Arial, sans-serif`;ctx.fillText(item.answer,cx+cardW/2,cy+cardH*.70);}
    });
  }
  C.register({id:'anagram',name:'Anagram',icon:'AZ',description:'Letter-perfect scrambles with an explicit answer list.',source:'anagram/',qualityLabel:'Letter sets verified',generate:anagramGenerate,validate:anagramValidate,draw:anagramDraw});

})(window);
