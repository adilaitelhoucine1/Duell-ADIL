(function(global){
  'use strict';

  const PROXY_ENDPOINT='/api/replicate-content';
  const MODEL='google/gemini-2.5-flash';
  const BATCH_SIZE=20;
  const DEFAULT_COPY={
    wordsearch:['WORD SEARCH','Find and circle all six hidden words.'],
    numbersearch:['NUMBER SEARCH','Find and circle all six hidden numbers.'],
    sudoku:['SUDOKU','Fill every row, column and 3 x 3 box with the numbers 1-9.'],
    maze:['MAZE','Trace one continuous route from START to FINISH.'],
    anagram:['ANAGRAM','Rearrange every letter to reveal the hidden word.'],
    pyramid:['NUMBER PYRAMID','Each box is the sum of the two boxes directly below it.'],
    mathmatrix:['MATH MATRIX','Complete the grid so every row and column matches its total.'],
    crackthecode:['CRACK THE CODE','Use every clue to discover the one possible secret code.'],
    binoxo:['BINOXO','Balance X and O. Never place three identical symbols in a row.'],
    xo:['XO TACTICS','Three boards. Find the single winning move in each.'],
    dotsboxes:['DOTS & BOXES','Join adjacent dots. Complete a box to score, then play again.'],
    drawobject:['DRAW THE OBJECT','Draw the named object. The closest recognizable drawing wins.']
  };

  function cleanText(value,max,fallback=''){
    const text=String(value||'').replace(/[\u0000-\u001F\u007F]/g,' ').replace(/\s+/g,' ').trim();
    return (text||fallback).slice(0,max);
  }

  function cleanWord(value,max=18){
    return String(value||'').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z]/g,'').slice(0,max);
  }

  function uniqueWords(values,max=18){
    const seen=new Set(),result=[];
    for(const value of Array.isArray(values)?values:[]){
      const word=cleanWord(value,max);
      if(word.length>=3&&!seen.has(word)){seen.add(word);result.push(word);}
    }
    return result;
  }

  function anagramCount(difficulty){return {easy:8,medium:10,hard:12}[difficulty]||10;}

  function mechanicsText(){
    return Object.entries(DEFAULT_COPY).map(([type,[,instruction]])=>`- ${type}: mechanics must remain equivalent to "${instruction}"`).join('\n');
  }

  function buildPrompt(config,batch,start,total){
    const schedule=batch.map((type,index)=>`${start+index+1}. ${type}`).join('\n');
    const count=anagramCount(config.difficulty);
    return `Create original interior copy for a family-safe two-player puzzle activity book.

BOOK BRIEF
- Niche/theme: ${config.niche}
- Audience/age: ${config.audience}
- Interior language: ${config.language}
- Tone: ${config.tone}
- Puzzle difficulty: ${config.difficulty}
- Extra direction: ${config.extra||'None'}

Create niche-specific copy for this exact batch of the ${total}-activity book. Return exactly one activity object per numbered line, in the same order and with the exact type and index shown:
${schedule}

RULES
- Make every title original, niche-specific, 2-6 words, and no more than 42 characters.
- Make each instruction clear, no more than 110 characters, in the requested language, while preserving the mechanics below.
- Make each footer a short motivational line, no more than 56 characters.
- For wordsearch: words must contain exactly 6 unique niche words, uppercase A-Z only, 3-14 letters, no spaces.
- For anagram: words must contain exactly ${count} unique niche words, uppercase A-Z only, 3-12 letters, no spaces.
- For drawobject: drawPrompt must be one concrete niche object, 2-36 characters, easy to draw.
- For all other types: words must be [] and drawPrompt must be "".
- Avoid brands, copyrighted characters, unsafe content, factual claims, and repeated titles.
- Write book title, subtitle, introduction, how-to guide, and closing line in the requested interior language.

MECHANICS THAT MUST NOT CHANGE
${mechanicsText()}

Return one raw JSON object only, with no Markdown or code fence, in this exact shape:
{"book":{"title":"","subtitle":"","introTitle":"","introBody":"","guideTitle":"","guideBody":"","closingLine":""},"activities":[{"index":1,"type":"wordsearch","title":"","instruction":"","footer":"","words":[],"drawPrompt":""}]}`;
  }

  function parseJsonOutput(value){
    let text=String(value||'').trim();
    text=text.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
    const start=text.indexOf('{'),end=text.lastIndexOf('}');
    if(start<0||end<=start)throw new Error('Replicate returned no JSON content.');
    try{return JSON.parse(text.slice(start,end+1));}
    catch(error){throw new Error(`Replicate returned invalid JSON: ${error.message}`);}
  }

  async function requestBatch({apiToken,prompt,signal}){
    if(typeof location!=='undefined'&&location.protocol==='file:'){
      throw new Error('Replicate needs the local DUEL server. Run npm start, then open http://127.0.0.1:4173.');
    }
    let response;
    try{
      response=await fetch(PROXY_ENDPOINT,{
        method:'POST',signal,
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiToken}`},
        body:JSON.stringify({prompt})
      });
    }catch(error){
      if(error.name==='AbortError')throw error;
      throw new Error('Cannot reach the local Replicate proxy. Run npm start and use http://127.0.0.1:4173.');
    }
    let payload=null;try{payload=await response.json();}catch(_error){}
    if(!response.ok)throw new Error(cleanText(payload?.error,320,`Replicate proxy failed (${response.status}).`));
    return parseJsonOutput(payload?.output);
  }

  function normalizeBook(book,config){
    return {
      title:cleanText(book?.title,70,`${config.niche} Puzzle Duel`),
      subtitle:cleanText(book?.subtitle,110,`A ${config.tone.toLowerCase()} activity book for ${config.audience}`),
      introTitle:cleanText(book?.introTitle,60,'WELCOME TO THE DUEL'),
      introBody:cleanText(book?.introBody,500,'Choose a side, solve carefully, and compare your score.'),
      guideTitle:cleanText(book?.guideTitle,60,'HOW TO PLAY'),
      guideBody:cleanText(book?.guideBody,600,'Read each activity rule, play fairly, and check the answers at the end.'),
      closingLine:cleanText(book?.closingLine,90,'THINK CLEARLY | PLAY BOLDLY')
    };
  }

  function normalizeActivity(raw,type,index,config){
    const fallback=DEFAULT_COPY[type]||['DUEL PUZZLE','Complete the activity.'];
    if(Number(raw?.index)!==index||raw?.type!==type)throw new Error(`AI content order mismatch at activity ${index}.`);
    const item={
      index,type,title:cleanText(raw.title,42,fallback[0]),instruction:cleanText(raw.instruction,110,fallback[1]),
      footer:cleanText(raw.footer,56,'THINK CLEARLY | PLAY BOLDLY'),words:[],drawPrompt:''
    };
    if(type==='wordsearch'){
      item.words=uniqueWords(raw.words,14);
      if(item.words.length!==6)throw new Error(`Activity ${index} needs exactly six valid Word Search words.`);
    }else if(type==='anagram'){
      const count=anagramCount(config.difficulty);item.words=uniqueWords(raw.words,12);
      if(item.words.length!==count)throw new Error(`Activity ${index} needs exactly ${count} valid Anagram words.`);
    }else if(type==='drawobject'){
      item.drawPrompt=cleanText(raw.drawPrompt,36).toUpperCase();
      if(item.drawPrompt.length<2)throw new Error(`Activity ${index} needs a Draw the Object prompt.`);
    }
    return item;
  }

  function validateConfig(config){
    if(!/^r8_[A-Za-z0-9_-]{30,}$/.test(String(config.apiToken||'').trim()))throw new Error('Enter a valid Replicate API token beginning with r8_.');
    if(cleanText(config.niche,100).length<2)throw new Error('Enter the book niche or theme.');
    if(cleanText(config.audience,100).length<2)throw new Error('Select the target audience or age range.');
    if(cleanText(config.language,50).length<2)throw new Error('Select the interior language.');
    if(!Array.isArray(config.schedule)||!config.schedule.length)throw new Error('Select at least one activity and set a puzzle count.');
  }

  async function generate(config,onProgress=()=>{}){
    validateConfig(config);
    const normalized={...config,apiToken:String(config.apiToken).trim(),niche:cleanText(config.niche,100),audience:cleanText(config.audience,100),language:cleanText(config.language,50,'English'),tone:cleanText(config.tone,50,'Playful'),extra:cleanText(config.extra,500)};
    const activities=[],batches=[];let book=null;
    for(let start=0;start<normalized.schedule.length;start+=BATCH_SIZE)batches.push({start,types:normalized.schedule.slice(start,start+BATCH_SIZE)});
    for(let batchIndex=0;batchIndex<batches.length;batchIndex++){
      const batch=batches[batchIndex];onProgress({batch:batchIndex+1,batches:batches.length,completed:activities.length,total:normalized.schedule.length});
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),135000);let raw;
      try{raw=await requestBatch({apiToken:normalized.apiToken,prompt:buildPrompt(normalized,batch.types,batch.start,normalized.schedule.length),signal:controller.signal});}
      catch(error){if(error.name==='AbortError')throw new Error('Replicate timed out. Try again.');throw error;}
      finally{clearTimeout(timer);}
      if(!book)book=normalizeBook(raw.book,normalized);
      if(!Array.isArray(raw.activities)||raw.activities.length!==batch.types.length)throw new Error(`Replicate returned ${raw.activities?.length||0} activities for a batch of ${batch.types.length}.`);
      raw.activities.forEach((item,offset)=>activities.push(normalizeActivity(item,batch.types[offset],batch.start+offset+1,normalized)));
    }
    onProgress({batch:batches.length,batches:batches.length,completed:activities.length,total:activities.length});
    return {book,activities,provider:'Replicate',model:MODEL,createdAt:new Date().toISOString()};
  }

  global.DuelReplicateContent={MODEL,BATCH_SIZE,DEFAULT_COPY,generate,cleanWord,uniqueWords,anagramCount,parseJsonOutput};
})(window);
