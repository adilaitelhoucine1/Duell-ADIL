(function(global){
  'use strict';
  const C=global.DuelPuzzleCore;

  function pyramidGenerate({difficulty,rng}){
    const width={easy:4,medium:5,hard:6}[difficulty]||5;
    const levels=[Array.from({length:width},()=>C.randomInt(rng,1,difficulty==='hard'?8:6))];
    while(levels[levels.length-1].length>1){const previous=levels[levels.length-1],next=[];for(let i=0;i<previous.length-1;i++)next.push(previous[i]+previous[i+1]);levels.push(next);}
    const puzzle=levels.map((level,index)=>index===0?level.slice():Array(level.length).fill(null));
    return {puzzle,solution:levels,width};
  }
  function pyramidValidate(record){
    let valid=record.puzzle[0].every((value,i)=>value===record.solution[0][i]);
    for(let level=1;level<record.solution.length;level++)for(let i=0;i<record.solution[level].length;i++)valid=valid&&record.solution[level][i]===record.solution[level-1][i]+record.solution[level-1][i+1];
    return {valid,unique:valid,solutionChecked:valid,rule:'Each box is the sum of the two boxes below it.'};
  }
  function pyramidDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'NUMBER PYRAMID',subtitle:'Each box is the sum of the two boxes directly below it.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const levels=opts.solution?record.solution:record.puzzle,box=Math.min(body.w/(record.width+.35),body.h/(record.width+.45)),gap=box*.09,totalH=record.width*(box+gap)-gap,bottom=body.y+(body.h+totalH)/2;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${box*.36}px Arial, sans-serif`;
    for(let level=0;level<record.width;level++){
      const row=levels[level],rowW=row.length*box+(row.length-1)*gap,x0=body.x+(body.w-rowW)/2,y=bottom-(level+1)*box-level*gap;
      row.forEach((value,i)=>{const x=x0+i*(box+gap);C.drawPanel(ctx,x,y,box,box,{fill:'#FFFFFF',stroke:level===0?accent:ink,lineWidth:Math.max(4,box*.035),radius:box*.12});if(value!==null){ctx.fillStyle=opts.solution&&level>0?accent:ink;ctx.fillText(String(value),x+box/2,y+box*.52);}});
    }
  }
  C.register({id:'pyramid',name:'Number Pyramid',icon:'PYR',description:'Addition pyramid with one deterministic answer.',source:'pyramide/',qualityLabel:'Deterministic solution',generate:pyramidGenerate,validate:pyramidValidate,draw:pyramidDraw});

  function matrixCandidateValues(grid,rowSums,colSums,r,c){
    const n=grid.length,rowUsed=grid[r].reduce((sum,value)=>sum+(value||0),0),colUsed=grid.reduce((sum,row)=>sum+(row[c]||0),0);
    const rowEmpty=grid[r].filter(value=>value===0).length,colEmpty=grid.filter(row=>row[c]===0).length,values=[];
    for(let value=1;value<=9;value++){
      const rowRemaining=rowSums[r]-rowUsed-value,colRemaining=colSums[c]-colUsed-value;
      if(rowRemaining<rowEmpty-1||rowRemaining>9*(rowEmpty-1)||colRemaining<colEmpty-1||colRemaining>9*(colEmpty-1))continue;
      values.push(value);
    }
    return values;
  }
  function matrixCount(grid,rowSums,colSums,limit=2,solutions=[]){
    const n=grid.length;let best=null,bestValues=null;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(grid[r][c]===0){const values=matrixCandidateValues(grid,rowSums,colSums,r,c);if(!values.length)return solutions;if(!bestValues||values.length<bestValues.length){best=[r,c];bestValues=values;}}
    if(!best){solutions.push(C.cloneGrid(grid));return solutions;}
    const [r,c]=best;
    for(const value of bestValues){grid[r][c]=value;matrixCount(grid,rowSums,colSums,limit,solutions);grid[r][c]=0;if(solutions.length>=limit)break;}
    return solutions;
  }
  function matrixGenerate({difficulty,rng}){
    const n=3,solution=Array.from({length:n},()=>Array.from({length:n},()=>C.randomInt(rng,1,9)));
    const rowSums=solution.map(row=>row.reduce((a,b)=>a+b,0)),colSums=Array.from({length:n},(_,c)=>solution.reduce((sum,row)=>sum+row[c],0));
    const puzzle=C.cloneGrid(solution),minimum={easy:5,medium:4,hard:3}[difficulty]||4;let clues=n*n;
    for(const index of C.shuffle(Array.from({length:n*n},(_,i)=>i),rng)){
      if(clues<=minimum)break;const r=Math.floor(index/n),c=index%n,old=puzzle[r][c];puzzle[r][c]=0;
      if(matrixCount(C.cloneGrid(puzzle),rowSums,colSums,2,[]).length!==1)puzzle[r][c]=old;else clues--;
    }
    return {puzzle,solution,rowSums,colSums,clues,size:n};
  }
  function matrixValidate(record){
    const solutions=matrixCount(C.cloneGrid(record.puzzle),record.rowSums,record.colSums,2,[]),matches=solutions.length===1&&JSON.stringify(solutions[0])===JSON.stringify(record.solution);
    return {valid:matches,unique:solutions.length===1,solutionChecked:matches,clues:record.clues};
  }
  function matrixDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C',n=record.size,values=opts.solution?record.solution:record.puzzle;
    const copy=C.pageCopy(record,{title:'MATH MATRIX',subtitle:'Complete the grid so every row and column matches its total.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const totalSize=Math.min(body.w*.91,body.h*.91),cell=totalSize/(n+1),gridSize=cell*n,x=body.x+(body.w-totalSize)/2,y=body.y+(body.h-totalSize)/2;
    C.drawPanel(ctx,x-28,y-28,totalSize+56,totalSize+56,{fill:'#FFFFFF',stroke:ink,lineWidth:4,radius:30});
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${cell*.42}px Arial, sans-serif`;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++){C.drawPanel(ctx,x+c*cell+5,y+r*cell+5,cell-10,cell-10,{fill:'#FFFFFF',stroke:ink,lineWidth:3,radius:18});if(values[r][c]){ctx.fillStyle=opts.solution&&record.puzzle[r][c]===0?accent:ink;ctx.fillText(String(values[r][c]),x+(c+.5)*cell,y+(r+.52)*cell);}}
    ctx.font=`900 ${cell*.34}px Arial, sans-serif`;
    record.rowSums.forEach((sum,r)=>{C.drawPanel(ctx,x+gridSize+5,y+r*cell+5,cell-10,cell-10,{fill:accent,stroke:accent,lineWidth:3,radius:18});ctx.fillStyle='#FFFFFF';ctx.fillText(String(sum),x+gridSize+cell/2,y+(r+.52)*cell);});
    record.colSums.forEach((sum,c)=>{C.drawPanel(ctx,x+c*cell+5,y+gridSize+5,cell-10,cell-10,{fill:accent,stroke:accent,lineWidth:3,radius:18});ctx.fillStyle='#FFFFFF';ctx.fillText(String(sum),x+(c+.5)*cell,y+gridSize+cell*.52);});
    C.drawPanel(ctx,x+gridSize+5,y+gridSize+5,cell-10,cell-10,{fill:ink,stroke:ink,lineWidth:3,radius:18});ctx.fillStyle='#FFFFFF';ctx.font=`900 ${cell*.22}px Arial, sans-serif`;ctx.fillText('SUM',x+gridSize+cell/2,y+gridSize+cell*.52);
  }
  C.register({id:'mathmatrix',name:'Math Matrix',icon:'SUM',description:'Row/column sum matrix with one possible fill.',source:'math-matrix/',qualityLabel:'Uniqueness solver',generate:matrixGenerate,validate:matrixValidate,draw:matrixDraw});
})(window);
