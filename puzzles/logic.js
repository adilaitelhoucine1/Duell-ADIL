(function(global){
  'use strict';
  const C=global.DuelPuzzleCore;

  function sudokuCandidates(board,r,c){
    const used=new Set(board[r]);
    for(let i=0;i<9;i++) used.add(board[i][c]);
    const br=Math.floor(r/3)*3,bc=Math.floor(c/3)*3;
    for(let rr=br;rr<br+3;rr++) for(let cc=bc;cc<bc+3;cc++) used.add(board[rr][cc]);
    const values=[];for(let n=1;n<=9;n++) if(!used.has(n)) values.push(n);
    return values;
  }

  function sudokuCount(board,limit=2){
    let best=null,bestValues=null;
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(board[r][c]===0){
      const values=sudokuCandidates(board,r,c);
      if(!values.length) return 0;
      if(!bestValues||values.length<bestValues.length){best=[r,c];bestValues=values;if(values.length===1)break;}
    }
    if(!best) return 1;
    let count=0;const [r,c]=best;
    for(const value of bestValues){
      board[r][c]=value;count+=sudokuCount(board,limit-count);board[r][c]=0;
      if(count>=limit) return count;
    }
    return count;
  }

  function sudokuSolution(rng){
    const base=3,side=9;
    const pattern=(r,c)=>(base*(r%base)+Math.floor(r/base)+c)%side;
    const bands=C.shuffle([0,1,2],rng),stacks=C.shuffle([0,1,2],rng);
    const rows=bands.flatMap(b=>C.shuffle([0,1,2],rng).map(r=>b*base+r));
    const cols=stacks.flatMap(s=>C.shuffle([0,1,2],rng).map(c=>s*base+c));
    const nums=C.shuffle([1,2,3,4,5,6,7,8,9],rng);
    return rows.map(r=>cols.map(c=>nums[pattern(r,c)]));
  }

  function sudokuGenerate({difficulty,rng}){
    const solution=sudokuSolution(rng),puzzle=C.cloneGrid(solution);
    const targets={easy:38,medium:46,hard:52};let removed=0;
    for(const index of C.shuffle(Array.from({length:81},(_,i)=>i),rng)){
      if(removed>=(targets[difficulty]||targets.medium)) break;
      const r=Math.floor(index/9),c=index%9,old=puzzle[r][c];puzzle[r][c]=0;
      if(sudokuCount(C.cloneGrid(puzzle),2)!==1) puzzle[r][c]=old;else removed++;
    }
    return {puzzle,solution,removed};
  }

  function sudokuValidate(record){
    const unique=sudokuCount(C.cloneGrid(record.puzzle),2)===1;
    const rows=record.solution.every(row=>new Set(row).size===9&&row.every(value=>value>=1&&value<=9));
    const cols=Array.from({length:9},(_,c)=>record.solution.map(row=>row[c])).every(col=>new Set(col).size===9);
    const boxes=[];for(let br=0;br<3;br++)for(let bc=0;bc<3;bc++){const box=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)box.push(record.solution[br*3+r][bc*3+c]);boxes.push(box);}
    const regions=boxes.every(box=>new Set(box).size===9),givens=record.puzzle.every((row,r)=>row.every((value,c)=>value===0||value===record.solution[r][c]));
    return {valid:unique&&rows&&cols&&regions&&givens,unique,solutionChecked:true,clues:81-record.removed};
  }

  function sudokuDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111',accent=opts.accent||ink,values=opts.solution?record.solution:record.puzzle;
    const copy=C.pageCopy(record,{title:'SUDOKU',subtitle:'Fill every row, column and 3 x 3 box with the numbers 1-9.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const size=Math.min(body.w*.96,body.h*.96),x=body.x+(body.w-size)/2,y=body.y+(body.h-size)/2,cell=size/9;
    C.drawPanel(ctx,x-24,y-24,size+48,size+48,{fill:'#FFFFFF',stroke:accent,lineWidth:5,radius:28});
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineCap='square';
    for(let i=0;i<=9;i++){
      ctx.strokeStyle=i%3===0?accent:ink;ctx.lineWidth=i%3===0?Math.max(3,size*.006):Math.max(1,size*.002);
      ctx.beginPath();ctx.moveTo(x+i*cell,y);ctx.lineTo(x+i*cell,y+size);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x,y+i*cell);ctx.lineTo(x+size,y+i*cell);ctx.stroke();
    }
    ctx.font=`700 ${cell*.52}px Arial, sans-serif`;
    for(let r=0;r<9;r++) for(let c=0;c<9;c++) if(values[r][c]){
      ctx.fillStyle=opts.solution&&record.puzzle[r][c]===0?accent:ink;
      ctx.fillText(String(values[r][c]),x+c*cell+cell/2,y+r*cell+cell/2+cell*.02);
    }
  }

  C.register({id:'sudoku',name:'Sudoku',icon:'▦',description:'Unique-solution 9×9 Sudoku.',source:'sudoku/',qualityLabel:'Uniqueness solver',generate:sudokuGenerate,validate:sudokuValidate,draw:sudokuDraw});

  function mazeGenerate({difficulty,rng}){
    const sizes={easy:15,medium:21,hard:27},n=sizes[difficulty]||sizes.medium;
    const cells=Array.from({length:n},()=>Array.from({length:n},()=>({n:true,e:true,s:true,w:true,seen:false})));
    const dirs=[['n',-1,0,'s'],['e',0,1,'w'],['s',1,0,'n'],['w',0,-1,'e']];
    const stack=[[0,0]];cells[0][0].seen=true;
    while(stack.length){
      const [r,c]=stack[stack.length-1];
      const choices=C.shuffle(dirs,rng).filter(([,dr,dc])=>r+dr>=0&&r+dr<n&&c+dc>=0&&c+dc<n&&!cells[r+dr][c+dc].seen);
      if(!choices.length){stack.pop();continue;}
      const [wall,dr,dc,opposite]=choices[0],nr=r+dr,nc=c+dc;
      cells[r][c][wall]=false;cells[nr][nc][opposite]=false;cells[nr][nc].seen=true;stack.push([nr,nc]);
    }
    const parent=Array.from({length:n},()=>Array(n).fill(null)),queue=[[0,0]];parent[0][0]=[-1,-1];
    for(let i=0;i<queue.length;i++){
      const [r,c]=queue[i];if(r===n-1&&c===n-1)break;
      for(const [wall,dr,dc] of dirs){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<n&&nc>=0&&nc<n&&!cells[r][c][wall]&&!parent[nr][nc]){parent[nr][nc]=[r,c];queue.push([nr,nc]);}}
    }
    const path=[];let r=n-1,c=n-1;
    while(r>=0){path.push([r,c]);const p=parent[r][c];if(!p||p[0]<0)break;[r,c]=p;}
    path.reverse();return {puzzle:{cells,n},solution:{path},path};
  }

  function mazeValidate(record){
    const p=record.path,n=record.puzzle.n,cells=record.puzzle.cells,dirs=[['n',-1,0,'s'],['e',0,1,'w'],['s',1,0,'n'],['w',0,-1,'e']];
    let reciprocal=true,edges=0;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const [wall,dr,dc,opposite] of dirs){const nr=r+dr,nc=c+dc;if(nr<0||nr>=n||nc<0||nc>=n)continue;if(cells[r][c][wall]!==cells[nr][nc][opposite])reciprocal=false;if((wall==='e'||wall==='s')&&!cells[r][c][wall])edges++;}
    const seen=new Set(['0,0']),queue=[[0,0]];
    for(let i=0;i<queue.length;i++){const [r,c]=queue[i];for(const [wall,dr,dc] of dirs){const nr=r+dr,nc=c+dc,key=`${nr},${nc}`;if(nr>=0&&nr<n&&nc>=0&&nc<n&&!cells[r][c][wall]&&!seen.has(key)){seen.add(key);queue.push([nr,nc]);}}}
    const pathLegal=p.length>1&&p[0][0]===0&&p[0][1]===0&&p[p.length-1][0]===n-1&&p[p.length-1][1]===n-1&&new Set(p.map(cell=>cell.join(','))).size===p.length&&p.slice(1).every(([r,c],i)=>{const [pr,pc]=p[i],dr=r-pr,dc=c-pc,dir=dirs.find(([,rr,cc])=>rr===dr&&cc===dc);return !!dir&&!cells[pr][pc][dir[0]];});
    const perfect=reciprocal&&edges===n*n-1&&seen.size===n*n;
    return {valid:perfect&&pathLegal,unique:perfect,solutionChecked:pathLegal,cells:n*n};
  }

  function mazeDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111',accent=opts.accent||'#C81E3C',n=record.puzzle.n;
    const copy=C.pageCopy(record,{title:'MAZE',subtitle:'Trace one continuous route from START to FINISH.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const size=Math.min(body.w*.97,body.h*.97),x=body.x+(body.w-size)/2,y=body.y+(body.h-size)/2,cell=size/n;
    C.drawPanel(ctx,x-22,y-22,size+44,size+44,{fill:'#FFFFFF',stroke:accent,lineWidth:5,radius:26});
    ctx.strokeStyle=ink;ctx.lineWidth=Math.max(2,size*.003);ctx.lineCap='square';
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      const q=record.puzzle.cells[r][c],cx=x+c*cell,cy=y+r*cell;
      if(q.n){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+cell,cy);ctx.stroke();}
      if(q.w){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+cell);ctx.stroke();}
      if(c===n-1&&q.e){ctx.beginPath();ctx.moveTo(cx+cell,cy);ctx.lineTo(cx+cell,cy+cell);ctx.stroke();}
      if(r===n-1&&q.s){ctx.beginPath();ctx.moveTo(cx,cy+cell);ctx.lineTo(cx+cell,cy+cell);ctx.stroke();}
    }
    if(opts.solution){ctx.strokeStyle=accent;ctx.lineWidth=Math.max(4,size*.009);ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();record.path.forEach(([r,c],i)=>{const px=x+c*cell+cell/2,py=y+r*cell+cell/2;i?ctx.lineTo(px,py):ctx.moveTo(px,py);});ctx.stroke();}
    ctx.fillStyle=accent;ctx.font=`900 ${Math.max(24,cell*.62)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('S',x+cell/2,y+cell/2);ctx.fillText('F',x+size-cell/2,y+size-cell/2);
  }

  C.register({id:'maze',name:'Maze',icon:'⌁',description:'Perfect maze with exactly one path.',source:'mazes/',qualityLabel:'Unique path verified',generate:mazeGenerate,validate:mazeValidate,draw:mazeDraw});

  function binoxoLineValid(line){
    const n=line.length,half=n/2,zeros=line.filter(v=>v===0).length,ones=line.filter(v=>v===1).length;
    if(zeros>half||ones>half)return false;
    for(let i=0;i<n-2;i++) if(line[i]!==-1&&line[i]===line[i+1]&&line[i]===line[i+2])return false;
    return line.includes(-1)||zeros===half&&ones===half;
  }

  function binoxoGridValid(grid){
    const n=grid.length,rows=grid,cols=Array.from({length:n},(_,c)=>grid.map(r=>r[c]));
    if(!rows.every(binoxoLineValid)||!cols.every(binoxoLineValid))return false;
    const fullRows=rows.filter(row=>!row.includes(-1)).map(row=>row.join(''));
    const fullCols=cols.filter(col=>!col.includes(-1)).map(col=>col.join(''));
    return new Set(fullRows).size===fullRows.length&&new Set(fullCols).size===fullCols.length;
  }

  function binoxoSolve(grid,rng,limit=1){
    const n=grid.length;let best=null,bestOpts=null;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(grid[r][c]===-1){
      const opts=[];for(const v of [0,1]){grid[r][c]=v;if(binoxoGridValid(grid))opts.push(v);grid[r][c]=-1;}
      if(!opts.length)return [];
      if(!bestOpts||opts.length<bestOpts.length){best=[r,c];bestOpts=opts;if(opts.length===1)break;}
    }
    if(!best)return [C.cloneGrid(grid)];
    const solutions=[],order=rng?C.shuffle(bestOpts,rng):bestOpts,[r,c]=best;
    for(const v of order){grid[r][c]=v;solutions.push(...binoxoSolve(grid,rng,limit-solutions.length));grid[r][c]=-1;if(solutions.length>=limit)break;}
    return solutions;
  }

  function binoxoGenerate({difficulty,rng}){
    const n=difficulty==='hard'?8:6,empty=Array.from({length:n},()=>Array(n).fill(-1));
    const solution=binoxoSolve(empty,rng,1)[0];if(!solution)throw new Error('Could not construct Binoxo solution.');
    const puzzle=C.cloneGrid(solution),target={easy:22,medium:18,hard:30}[difficulty]||18;
    let clues=n*n;
    for(const index of C.shuffle(Array.from({length:n*n},(_,i)=>i),rng)){
      if(clues<=target)break;const r=Math.floor(index/n),c=index%n,old=puzzle[r][c];puzzle[r][c]=-1;
      if(binoxoSolve(C.cloneGrid(puzzle),null,2).length!==1)puzzle[r][c]=old;else clues--;
    }
    return {puzzle,solution,size:n,clues};
  }

  function binoxoValidate(record){
    const solutions=binoxoSolve(C.cloneGrid(record.puzzle),null,2);
    return {valid:solutions.length===1&&binoxoGridValid(record.solution),unique:solutions.length===1,solutionChecked:true,clues:record.clues};
  }

  function binoxoDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111',accent=opts.accent||ink,n=record.size,values=opts.solution?record.solution:record.puzzle;
    const copy=C.pageCopy(record,{title:'BINOXO',subtitle:'Balance X and O. Never place three identical symbols in a row.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const size=Math.min(body.w*.93,body.h*.93),x=body.x+(body.w-size)/2,y=body.y+(body.h-size)/2,cell=size/n;
    C.drawPanel(ctx,x-26,y-26,size+52,size+52,{fill:'#FFFFFF',stroke:accent,lineWidth:5,radius:28});
    ctx.strokeStyle=ink;ctx.lineWidth=Math.max(3,size*.003);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${cell*.50}px Arial`;
    for(let r=0;r<n;r++) for(let c=0;c<n;c++){
      ctx.strokeRect(x+c*cell,y+r*cell,cell,cell);const value=values[r][c];
      if(value!==-1){ctx.fillStyle=opts.solution&&record.puzzle[r][c]===-1?accent:ink;ctx.fillText(value===0?'O':'X',x+c*cell+cell/2,y+r*cell+cell/2);}
    }
  }

  C.register({id:'binoxo',name:'Binoxo',icon:'XO',description:'Binary grid with a unique solution.',source:'binoxo/',qualityLabel:'Uniqueness solver',generate:binoxoGenerate,validate:binoxoValidate,draw:binoxoDraw});

  function permutations(values,length,prefix=[],out=[]){
    if(prefix.length===length){out.push(prefix.slice());return out;}
    for(let i=0;i<values.length;i++) permutations([...values.slice(0,i),...values.slice(i+1)],length,[...prefix,values[i]],out);
    return out;
  }
  function codeScore(code,guess){let exact=0,common=0;for(let i=0;i<code.length;i++)if(code[i]===guess[i])exact++;for(const d of guess)if(code.includes(d))common++;return [exact,common-exact];}
  function scoreKey(score){return score.join(':');}

  function crackGenerate({difficulty,rng}){
    const length=difficulty==='hard'?4:3,all=permutations([0,1,2,3,4,5,6,7,8,9],length),secret=C.choice(all,rng);
    let candidates=all.slice(),clues=[];
    while(candidates.length>1&&clues.length<8){
      const sample=C.shuffle(all,rng).slice(0,Math.min(90,all.length));let best=null,bestWorst=Infinity;
      for(const guess of sample){
        if(guess.join('')===secret.join(''))continue;
        const groups=new Map();for(const candidate of candidates){const key=scoreKey(codeScore(candidate,guess));groups.set(key,(groups.get(key)||0)+1);}
        const worst=Math.max(...groups.values());if(worst<bestWorst){bestWorst=worst;best=guess;}
      }
      if(!best)break;const score=codeScore(secret,best);clues.push({guess:best,exact:score[0],misplaced:score[1]});
      candidates=candidates.filter(candidate=>scoreKey(codeScore(candidate,best))===scoreKey(score));
    }
    if(candidates.length!==1)throw new Error('Could not construct a unique code puzzle.');
    return {puzzle:{clues,length},solution:secret,clues,length};
  }

  function crackValidate(record){
    const all=permutations([0,1,2,3,4,5,6,7,8,9],record.length);
    const solutions=all.filter(code=>record.clues.every(clue=>{const score=codeScore(code,clue.guess);return score[0]===clue.exact&&score[1]===clue.misplaced;}));
    return {valid:solutions.length===1&&solutions[0].join('')===record.solution.join(''),unique:solutions.length===1,solutionChecked:true};
  }

  function crackDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'CRACK THE CODE',subtitle:'Use every clue to discover the one possible secret code.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const x=body.x+body.w*.025,w=body.w*.95,gap=Math.max(22,body.h*.008),answerH=Math.max(250,body.h*.12);
    const rowH=Math.min(420,(body.h-answerH-gap*(record.clues.length+1))/record.clues.length);
    const contentH=record.clues.length*rowH+(record.clues.length-1)*gap+answerH+gap,start=body.y+(body.h-contentH)/2;
    record.clues.forEach((clue,i)=>{
      const y=start+i*(rowH+gap);C.drawPanel(ctx,x,y,w,rowH,{fill:'#FFFFFF',stroke:ink,lineWidth:3,radius:28});
      const digitGap=18,digitSize=Math.min(rowH*.62,(w*.42-digitGap*(record.length-1))/record.length),digitsW=record.length*digitSize+(record.length-1)*digitGap,dx=x+34,dy=y+(rowH-digitSize)/2;
      clue.guess.forEach((digit,j)=>{C.drawPanel(ctx,dx+j*(digitSize+digitGap),dy,digitSize,digitSize,{fill:'#FFFFFF',stroke:accent,lineWidth:4,radius:18});ctx.fillStyle=ink;ctx.font=`900 ${digitSize*.46}px ui-monospace, monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(digit),dx+j*(digitSize+digitGap)+digitSize/2,dy+digitSize*.52);});
      const hintX=Math.max(dx+digitsW+35,x+w*.52),hintW=x+w-hintX-34,pillGap=18,pillH=(rowH-pillGap*3)/2;
      C.drawPill(ctx,hintX,y+pillGap,hintW,pillH,`${clue.exact} EXACT`,{fill:ink,fontSize:pillH*.31});
      C.drawPill(ctx,hintX,y+pillGap*2+pillH,hintW,pillH,`${clue.misplaced} WRONG SPOT`,{fill:accent,fontSize:pillH*.27});
    });
    const answerY=start+record.clues.length*(rowH+gap),box=Math.min(150,answerH*.52),boxGap=26,total=record.length*box+(record.length-1)*boxGap,bx=body.x+(body.w-total)/2;
    ctx.fillStyle=ink;ctx.font=`900 ${Math.max(34,answerH*.16)}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(opts.solution?'THE CODE':'WRITE YOUR CODE',body.x+body.w/2,answerY+8);
    for(let i=0;i<record.length;i++){const by=answerY+answerH-box-12;C.drawPanel(ctx,bx+i*(box+boxGap),by,box,box,{fill:opts.solution?accent:'#FFFFFF',stroke:accent,lineWidth:5,radius:24});if(opts.solution){ctx.fillStyle='#FFFFFF';ctx.font=`900 ${box*.48}px ui-monospace, monospace`;ctx.textBaseline='middle';ctx.fillText(String(record.solution[i]),bx+i*(box+boxGap)+box/2,by+box*.52);}}
  }

  C.register({id:'crackthecode',name:'Crack the Code',icon:'⌕',description:'Mastermind-style clues with one possible code.',source:'crack-the-code/',qualityLabel:'Exhaustive uniqueness check',generate:crackGenerate,validate:crackValidate,draw:crackDraw});
})(window);
