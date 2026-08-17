(function(global){
  'use strict';
  const C=global.DuelPuzzleCore,LINES=[
    [[0,0],[0,1],[0,2]],[[1,0],[1,1],[1,2]],[[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]],[[0,1],[1,1],[2,1]],[[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]],[[0,2],[1,1],[2,0]]
  ];

  function hasWin(board,mark){return LINES.some(line=>line.every(([r,c])=>board[r][c]===mark));}
  function winningMoves(board,mark){
    const moves=[];
    for(let r=0;r<3;r++)for(let c=0;c<3;c++)if(!board[r][c]){board[r][c]=mark;if(hasWin(board,mark))moves.push([r,c]);board[r][c]='';}
    return moves;
  }
  function boardKey(board){return board.flat().map(value=>value||'-').join('');}

  let tacticalPool=null;
  function getPool(){
    if(tacticalPool)return tacticalPool;
    tacticalPool=[];
    for(let state=0;state<19683;state++){
      let value=state,x=0,o=0;const board=Array.from({length:3},()=>Array(3).fill(''));
      for(let i=0;i<9;i++){const digit=value%3;value=Math.floor(value/3);const mark=digit===1?'X':digit===2?'O':'';board[Math.floor(i/3)][i%3]=mark;if(mark==='X')x++;if(mark==='O')o++;}
      if(!(x===o||x===o+1)||x+o<4||x+o>7||hasWin(board,'X')||hasWin(board,'O'))continue;
      const turn=x===o?'X':'O',moves=winningMoves(board,turn);
      if(moves.length===1)tacticalPool.push({board,turn,winningMove:moves[0],marks:x+o,key:boardKey(board)});
    }
    return tacticalPool;
  }

  function xoGenerate({difficulty,rng}){
    const ranges={easy:[6,7],medium:[5,7],hard:[4,6]},[min,max]=ranges[difficulty]||ranges.medium;
    const candidates=C.shuffle(getPool().filter(item=>item.marks>=min&&item.marks<=max),rng),seen=new Set(),puzzle=[];
    for(const item of candidates){if(seen.has(item.key))continue;seen.add(item.key);puzzle.push({board:C.cloneGrid(item.board),turn:item.turn,winningMove:item.winningMove.slice()});if(puzzle.length===3)break;}
    if(puzzle.length!==3)throw new Error('Could not construct three distinct XO tactics.');
    return {puzzle,solution:puzzle.map(item=>item.winningMove.slice())};
  }

  function xoValidate(record){
    const valid=record.puzzle.length===3&&record.solution.length===3&&record.puzzle.every((item,index)=>{
      const moves=winningMoves(C.cloneGrid(item.board),item.turn),solution=record.solution[index];
      return moves.length===1&&moves[0][0]===solution[0]&&moves[0][1]===solution[1]&&!hasWin(item.board,'X')&&!hasWin(item.board,'O');
    });
    return {valid,unique:valid,solutionChecked:valid,boards:record.puzzle.length};
  }

  function xoDraw(ctx,rect,record,opts){
    const ink=opts.ink||'#111111',accent=opts.accent||'#C81E3C';
    const copy=C.pageCopy(record,{title:'XO TACTICS',subtitle:'Three boards. Find the single winning move in each.'});
    const body=C.premiumLayout(ctx,rect,{...copy,solution:opts.solution,ink,accent});
    const gap=30,x=body.x+body.w*.02,w=body.w*.96,cardH=(body.h-gap*2)/3;
    record.puzzle.forEach((item,index)=>{
      const y=body.y+index*(cardH+gap);C.drawPanel(ctx,x,y,w,cardH,{fill:'#FFFFFF',stroke:ink,lineWidth:3,radius:30});
      ctx.fillStyle=accent;C.roundedPath(ctx,x,y,22,cardH,11);ctx.fill();
      const infoX=x+58,infoW=w*.42;
      C.drawPill(ctx,infoX,y+cardH*.13,Math.min(270,infoW*.70),Math.min(66,cardH*.14),`ROUND ${index+1}`,{fill:accent,fontSize:Math.min(28,cardH*.055)});
      ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`900 ${Math.min(82,cardH*.16)}px Arial, sans-serif`;ctx.fillText(`${item.turn} TO MOVE`,infoX,y+cardH*.34);
      ctx.globalAlpha=.68;ctx.font=`700 ${Math.min(38,cardH*.075)}px Arial, sans-serif`;ctx.fillText(opts.solution?'Winning move shown':'Win in one move',infoX,y+cardH*.56);ctx.globalAlpha=1;
      const boardSize=Math.min(cardH*.80,w*.42),bx=x+w-boardSize-48,by=y+(cardH-boardSize)/2,cell=boardSize/3;
      C.drawPanel(ctx,bx-18,by-18,boardSize+36,boardSize+36,{fill:'#FFFFFF',stroke:accent,lineWidth:5,radius:24});
      if(opts.solution){const [sr,sc]=item.winningMove;C.drawPanel(ctx,bx+sc*cell+8,by+sr*cell+8,cell-16,cell-16,{fill:accent,stroke:false,radius:20});}
      ctx.strokeStyle=ink;ctx.lineWidth=Math.max(8,boardSize*.018);ctx.lineCap='round';
      for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(bx+i*cell,by+12);ctx.lineTo(bx+i*cell,by+boardSize-12);ctx.stroke();ctx.beginPath();ctx.moveTo(bx+12,by+i*cell);ctx.lineTo(bx+boardSize-12,by+i*cell);ctx.stroke();}
      for(let r=0;r<3;r++)for(let c=0;c<3;c++){
        let mark=item.board[r][c];if(opts.solution&&r===item.winningMove[0]&&c===item.winningMove[1])mark=item.turn;if(!mark)continue;
        ctx.fillStyle=opts.solution&&r===item.winningMove[0]&&c===item.winningMove[1]?'#FFFFFF':ink;ctx.font=`900 ${cell*.58}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(mark,bx+(c+.5)*cell,by+(r+.53)*cell);
      }
    });
  }

  C.register({id:'xo',name:'XO Tactics',icon:'XO',description:'Three styled win-in-one XO boards per page.',source:'premium-xo/',qualityLabel:'Unique winning move x3',generate:xoGenerate,validate:xoValidate,draw:xoDraw});
})(window);
