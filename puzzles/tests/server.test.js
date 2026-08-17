'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {runReplicate,CREATE_URL,REPLICATE_MODEL,predictionOutput,staticTarget}=require('../../server.js');

const fakeToken='r8_'+'B'.repeat(37);
let calledUrl='',calledOptions=null;
const fetchImpl=async(url,options)=>{
  calledUrl=url;calledOptions=options;
  return {ok:true,status:200,json:async()=>({id:'test-prediction',status:'succeeded',output:['{"book":', '{}', '}']})};
};

(async()=>{
  const output=await runReplicate({token:fakeToken,prompt:'Create valid JSON content for a safe puzzle book.',fetchImpl});
  assert.equal(REPLICATE_MODEL,'google/gemini-2.5-flash');
  assert.equal(calledUrl,CREATE_URL,'The proxy must call only the fixed official-model endpoint.');
  assert.equal(calledOptions.headers.Authorization,`Bearer ${fakeToken}`);
  assert.ok(!calledOptions.body.includes(fakeToken),'The Replicate token must never enter the model input body.');
  assert.equal(output,'{"book":{}}');
  assert.equal(predictionOutput({output:['one','two']}),'onetwo');
  assert.equal(path.basename(staticTarget('/')),'index.html');
  assert.equal(staticTarget('/..%2f..%2fWindows/win.ini'),null,'Static serving must block traversal outside the workspace.');
  console.log('Passed local proxy endpoint, token forwarding, output, and path-safety tests.');
})().catch(error=>{console.error(error);process.exitCode=1;});
