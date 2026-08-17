'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const fakeToken='r8_'+'A'.repeat(37);
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
    return {ok:true,status:200,json:async()=>({output:`\n\`\`\`json\n${JSON.stringify(generated)}\n\`\`\``})};
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname,'..','replicate-content.js'),'utf8'),context,{filename:'replicate-content.js'});

(async()=>{
  const ai=context.window.DuelReplicateContent;
  assert.equal(ai.MODEL,'google/gemini-2.5-flash');
  assert.equal(ai.anagramCount('medium'),10);
  assert.equal(JSON.stringify(ai.uniqueWords(['café','SEA LION','coral','CORAL'])),JSON.stringify(['CAFE','SEALION','CORAL']));

  const progress=[];
  const plan=await ai.generate({
    apiToken:fakeToken,niche:'Ocean exploration',audience:'Kids ages 8-12',language:'English',
    tone:'Playful',difficulty:'medium',extra:'Use vivid sea vocabulary.',schedule
  },event=>progress.push(event));

  assert.equal(requestUrl,'/api/replicate-content');
  assert.ok(!requestUrl.includes(fakeToken),'The token must not appear in the request URL.');
  assert.equal(requestOptions.method,'POST');
  assert.equal(requestOptions.headers.Authorization,`Bearer ${fakeToken}`,'The local proxy must receive the token in the Authorization header.');
  assert.ok(!requestOptions.body.includes(fakeToken),'The token must not appear in the JSON body.');
  assert.deepEqual(Object.keys(JSON.parse(requestOptions.body)),['prompt']);
  assert.match(JSON.parse(requestOptions.body).prompt,/Interior language: English/);
  assert.equal(plan.activities.length,3);
  assert.equal(plan.activities[0].words.length,6);
  assert.equal(plan.activities[1].words.length,10);
  assert.equal(plan.activities[2].drawPrompt,'LIGHTHOUSE');
  assert.equal(plan.book.title,generated.book.title);
  assert.equal(plan.provider,'Replicate');
  assert.ok(!JSON.stringify(plan).includes(fakeToken),'Generated/exportable content must never retain the token.');
  assert.ok(progress.length>=2,'Generation must report progress for the interface.');

  console.log('Passed Replicate content adapter, JSON validation, and token-handling tests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
