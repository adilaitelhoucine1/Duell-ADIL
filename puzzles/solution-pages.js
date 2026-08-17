(function(global){
  'use strict';

  const DEFAULT_PAGE_SIZE=4;

  function paginate(items,pageSize=DEFAULT_PAGE_SIZE){
    if(!Number.isInteger(pageSize)||pageSize<1)throw new Error('Solution page size must be a positive integer.');
    const pages=[];
    for(let start=0;start<items.length;start+=pageSize)pages.push(items.slice(start,start+pageSize));
    return pages;
  }

  function roundedRect(ctx,x,y,w,h,r){
    const radius=Math.min(r,w/2,h/2);
    ctx.beginPath();ctx.moveTo(x+radius,y);ctx.lineTo(x+w-radius,y);ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
    ctx.lineTo(x+w,y+h-radius);ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
    ctx.lineTo(x+radius,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
    ctx.lineTo(x,y+radius);ctx.quadraticCurveTo(x,y,x+radius,y);ctx.closePath();
  }

  function drawContained(ctx,img,x,y,w,h){
    const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,scale=Math.min(w/iw,h/ih);
    const dw=iw*scale,dh=ih*scale;
    ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
  }

  function drawSheet({items,pageNumber,totalPages,pageInches,dpi=300,ink='#14161B',accent='#C81E3C'}){
    const [pw,ph]=pageInches;
    const canvas=document.createElement('canvas');canvas.width=Math.round(pw*dpi);canvas.height=Math.round(ph*dpi);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const unit=dpi,margin=Math.max(14,unit*.22),headerH=Math.max(42,unit*.52),footerH=Math.max(22,unit*.24);
    const gap=Math.max(8,unit*.10),titleSize=Math.max(24,unit*.18),smallSize=Math.max(11,unit*.08);
    ctx.fillStyle=ink;ctx.textAlign='left';ctx.textBaseline='top';ctx.font=`900 ${titleSize}px Arial, sans-serif`;
    ctx.fillText('SOLUTIONS',margin,margin);
    ctx.fillStyle=accent;ctx.textAlign='right';ctx.font=`800 ${smallSize*1.15}px Arial, sans-serif`;
    ctx.fillText(`PAGE ${pageNumber} / ${totalPages}`,canvas.width-margin,margin+titleSize*.22);
    ctx.strokeStyle=accent;ctx.lineWidth=Math.max(2,unit*.018);ctx.beginPath();ctx.moveTo(margin,margin+headerH*.72);ctx.lineTo(canvas.width-margin,margin+headerH*.72);ctx.stroke();

    const top=margin+headerH,bottom=canvas.height-margin-footerH;
    const cardW=(canvas.width-margin*2-gap)/2,cardH=(bottom-top-gap)/2;
    items.forEach((item,index)=>{
      const col=index%2,row=Math.floor(index/2),x=margin+col*(cardW+gap),y=top+row*(cardH+gap);
      ctx.save();roundedRect(ctx,x,y,cardW,cardH,Math.max(8,unit*.07));ctx.fillStyle='#F7F8FA';ctx.fill();ctx.strokeStyle='#C9CDD6';ctx.lineWidth=Math.max(1,unit*.01);ctx.stroke();ctx.restore();
      const labelH=Math.max(22,unit*.20),pad=Math.max(7,unit*.055);
      ctx.fillStyle=ink;ctx.font=`800 ${smallSize}px Arial, sans-serif`;ctx.textAlign='left';ctx.textBaseline='middle';
      const number=String(item.solutionNumber||index+1).padStart(2,'0');
      ctx.fillText(`${number}  ${String(item.kindLabel||item.kind||'PUZZLE').toUpperCase()}`,x+pad,y+labelH*.54);
      // Prefer the clean answer tile. Repeating the full decorative border in
      // every quadrant wastes resolution and makes thin puzzle lines look soft.
      const preview=(item.makeSolutionTile||item.makeSolutionComposite)(Math.max(72,dpi));
      drawContained(ctx,preview,x+pad,y+labelH,cardW-pad*2,cardH-labelH-pad);
    });
    ctx.fillStyle=ink;ctx.globalAlpha=.62;ctx.font=`700 ${smallSize}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='bottom';
    ctx.fillText('FOUR ANSWERS PER PAGE  |  CHECK, LEARN, PLAY AGAIN',canvas.width/2,canvas.height-margin*.48);
    return canvas;
  }

  global.DuelSolutionPages={PAGE_SIZE:DEFAULT_PAGE_SIZE,paginate,drawSheet};
})(window);
