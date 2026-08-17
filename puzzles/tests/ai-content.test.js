'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const fakeKey='TEST_KEY_NOT_REAL';
const schedule=['wordsearch','anagram','drawobject'];
const generated={
  book:{
    title:'Ocean Explorer Duels',subtitle:'Dive into clever two-player challenges',
    introTitle:'WELCOME ABOARD',introBody:'Explore the ocean one friendly puzzle duel at a time.',
    guideTitle:'HOW TO PLAY',guideBody:'Choose a side, follow each rule, and compare your score.',
    closingLine:'DIVE DEEP | THINK SHARP'
  },
  activities:[
    {index:1,type:'wordsearch',title:'Hidden Reef Words',instruction:'Find and circle all six ocean words.',footer:'Make every discovery count!',words:['CORAL','WHALE','SHARK','OCEAN','SHELL','REEFS'],drawPrompt:''},
    {index:2,type:'anagram',title:'Unscramble the Sea',instruction:'Rearrange every letter to reveal each ocean word.',footer:'Unjumble the whole tide!',words:['ANCHOR','DOLPHIN','OCTOPUS','SEAHORSE','TURTLE','MARLIN','LAGOON','CURRENT','ISLAND','SPONGE'],drawPrompt:''},
    {index:3,type:'drawobject',title:'Sketch the Ocean',instruction:'Draw the named ocean object. The closest drawing wins.',footer:'Ready, set, sketch!',words:[],drawPrompt:'LIGHTHOUSE'}
  ]
};

let requestUrl='',requestOptions=null;
const context={
  window:{},console,AbortController,setTimeout,clearTimeout,
  fetch:async(url,options)=>{
    requestUrl=url;requestOptions=options;
    return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(generated)}]}}]})};
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..','ai-content.js'),'utf8'),context,{filename:'ai-content.js'});

(async()=>{
  const ai=context.window.DuelAIContent;
  assert.equal(ai.DEFAULT_MODEL,'gemini-3.7-flash');
  assert.equal(ai.anagramCount('medium'),10);
  assert.equal(JSON.stringify(ai.uniqueWords(['café','SEA LION','coral','CORAL'])),JSON.stringify(['CAFE','SEALION','CORAL']));

  const progress=[];
  const plan=await ai.generate({
    apiKey:fakeKey,model:ai.DEFAULT_MODEL,niche:'Ocean exploration',audience:'Kids ages 8-12',
    language:'English',tone:'Playful',difficulty:'medium',extra:'Use vivid sea vocabulary.',schedule
  },event=>progress.push(event));

  assert.match(requestUrl,/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.7-flash:generateContent$/);
  assert.ok(!requestUrl.includes(fakeKey),'The API key must not appear in the request URL.');
  assert.equal(requestOptions.method,'POST');
  assert.equal(requestOptions.headers['x-goog-api-key'],fakeKey,'The API key must use the supported request header.');
  assert.ok(!requestOptions.body.includes(fakeKey),'The API key must not appear in the JSON body.');
  assert.equal(requestOptions.headers['Content-Type'],'application/json');

  const body=JSON.parse(requestOptions.body);
  assert.equal(body.generationConfig.responseMimeType,'application/json');
  assert.equal(body.generationConfig.responseSchema.type,'OBJECT');
  assert.equal(plan.activities.length,3);
  assert.equal(plan.activities[0].words.length,6);
  assert.equal(plan.activities[1].words.length,10);
  assert.equal(plan.activities[2].drawPrompt,'LIGHTHOUSE');
  assert.equal(plan.book.title,generated.book.title);
  assert.ok(!JSON.stringify(plan).includes(fakeKey),'Generated/exportable content must never retain the API key.');
  assert.ok(progress.length>=2,'Generation must report progress for the interface.');

  console.log('Passed Gemini content adapter, schema, validation, and key-handling tests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
