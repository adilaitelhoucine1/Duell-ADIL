'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'..','..','index.html'),'utf8');
const inlineBlocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(source=>source.trim());
inlineBlocks.forEach(source=>new Function(source));

const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(new Set(ids).size,ids.length,'Every interface id must be unique.');
for(const required of ['aiApiKey','aiModel','aiNiche','aiAudience','aiLanguage','aiTone','aiExtra','btnAiGenerate','btnAiDownload','aiUseContent']){
  assert.ok(ids.includes(required),`The AI interface must contain #${required}.`);
}

console.log(`Compiled ${inlineBlocks.length} inline script block and verified ${ids.length} unique interface ids.`);
