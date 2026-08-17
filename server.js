'use strict';

const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');

const HOST='127.0.0.1';
const DEFAULT_PORT=4173;
const ROOT=path.resolve(__dirname);
const REPLICATE_MODEL='google/gemini-2.5-flash';
const CREATE_URL=`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`;
const TERMINAL_STATUSES=new Set(['succeeded','successful','failed','canceled','cancelled']);
const MIME={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'
};

function sendJson(response,status,payload){
  const body=JSON.stringify(payload);
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),'Cache-Control':'no-store'});
  response.end(body);
}

function cleanError(value,fallback='Replicate request failed.'){
  const text=typeof value==='string'?value:(value&&typeof value==='object'?JSON.stringify(value):'');
  return (text||fallback).replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim().slice(0,320);
}

function readJson(request,maxBytes=150000){
  return new Promise((resolve,reject)=>{
    const chunks=[];let size=0;
    request.on('data',chunk=>{
      size+=chunk.length;
      if(size>maxBytes){reject(Object.assign(new Error('Request body is too large.'),{statusCode:413}));request.destroy();return;}
      chunks.push(chunk);
    });
    request.on('end',()=>{
      try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}
      catch(_error){reject(Object.assign(new Error('Request body must be valid JSON.'),{statusCode:400}));}
    });
    request.on('error',reject);
  });
}

function tokenFrom(request){
  const authorization=String(request.headers.authorization||'');
  const supplied=authorization.startsWith('Bearer ')?authorization.slice(7).trim():'';
  return supplied||String(process.env.REPLICATE_API_TOKEN||'').trim();
}

async function responseJson(response){
  let payload=null;
  try{payload=await response.json();}catch(_error){}
  if(!response.ok)throw new Error(cleanError(payload?.detail||payload?.error,`Replicate request failed (${response.status}).`));
  return payload||{};
}

function predictionOutput(prediction){
  const output=prediction?.output;
  if(Array.isArray(output))return output.join('');
  if(typeof output==='string')return output;
  return '';
}

function delay(milliseconds){return new Promise(resolve=>setTimeout(resolve,milliseconds));}

async function runReplicate({token,prompt,fetchImpl=globalThis.fetch}){
  if(!/^r8_[A-Za-z0-9_-]{30,}$/.test(token))throw Object.assign(new Error('Enter a valid Replicate API token beginning with r8_.'),{statusCode:401});
  if(typeof fetchImpl!=='function')throw new Error('This Node.js version does not provide fetch. Install Node.js 18 or newer.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),125000);
  const headers={
    'Authorization':`Bearer ${token}`,'Content-Type':'application/json','Prefer':'wait=60','Cancel-After':'120s',
    'User-Agent':'duel-book-builder/3.0'
  };
  try{
    let prediction=await responseJson(await fetchImpl(CREATE_URL,{
      method:'POST',headers,signal:controller.signal,
      body:JSON.stringify({input:{
        prompt,system_instruction:'Return only the requested valid JSON object. Do not use Markdown or code fences.',
        temperature:.75,top_p:.95,max_output_tokens:8192,thinking_budget:0
      }})
    }));
    const deadline=Date.now()+120000;
    while(!TERMINAL_STATUSES.has(String(prediction.status||'').toLowerCase())&&Date.now()<deadline){
      if(!prediction.id)throw new Error('Replicate returned an incomplete prediction.');
      await delay(850);
      prediction=await responseJson(await fetchImpl(`https://api.replicate.com/v1/predictions/${encodeURIComponent(prediction.id)}`,{
        headers:{'Authorization':`Bearer ${token}`,'User-Agent':'duel-book-builder/3.0'},signal:controller.signal
      }));
    }
    const status=String(prediction.status||'').toLowerCase();
    if(status!=='succeeded'&&status!=='successful')throw new Error(cleanError(prediction.error,`Replicate prediction ${status||'did not finish'}.`));
    const output=predictionOutput(prediction);
    if(!output.trim())throw new Error('Replicate returned no usable text.');
    return output;
  }catch(error){
    if(error.name==='AbortError')throw new Error('Replicate timed out after two minutes. Try again.');
    throw error;
  }finally{clearTimeout(timer);}
}

async function handleApi(request,response){
  try{
    const body=await readJson(request),prompt=String(body.prompt||'').trim(),token=tokenFrom(request);
    if(prompt.length<20||prompt.length>120000)throw Object.assign(new Error('The AI prompt is missing or too large.'),{statusCode:400});
    const output=await runReplicate({token,prompt});
    sendJson(response,200,{output,model:REPLICATE_MODEL});
  }catch(error){sendJson(response,error.statusCode||502,{error:cleanError(error.message)});}
}

function staticTarget(requestUrl){
  let pathname;
  try{pathname=decodeURIComponent(new URL(requestUrl,'http://localhost').pathname);}catch(_error){return null;}
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const target=path.resolve(ROOT,relative);
  return target===ROOT||target.startsWith(ROOT+path.sep)?target:null;
}

function serveStatic(request,response){
  const target=staticTarget(request.url);
  if(!target){response.writeHead(403);response.end('Forbidden');return;}
  fs.stat(target,(error,stats)=>{
    if(error||!stats.isFile()){response.writeHead(404);response.end('Not found');return;}
    response.writeHead(200,{'Content-Type':MIME[path.extname(target).toLowerCase()]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(request.method==='HEAD'){response.end();return;}
    fs.createReadStream(target).pipe(response);
  });
}

function createServer(){
  return http.createServer((request,response)=>{
    if(request.url==='/api/replicate-content'){
      if(request.method!=='POST'){sendJson(response,405,{error:'Method not allowed.'});return;}
      handleApi(request,response);return;
    }
    if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405);response.end('Method not allowed');return;}
    serveStatic(request,response);
  });
}

if(require.main===module){
  const requestedPort=Number.parseInt(process.env.DUEL_BUILDER_PORT||'',10),port=Number.isInteger(requestedPort)&&requestedPort>0?requestedPort:DEFAULT_PORT;
  createServer().listen(port,HOST,()=>{
    console.log(`DUEL Builder is ready at http://${HOST}:${port}`);
    console.log('The Replicate token is accepted from the masked app input and is never logged or stored.');
  });
}

module.exports={createServer,runReplicate,REPLICATE_MODEL,CREATE_URL,predictionOutput,staticTarget};
