'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const puzzleRoot=path.resolve(__dirname,'..');
const context={window:{},console};
vm.createContext(context);

for(const filename of ['core.js','catalog.js','logic.js','word.js','math.js','xo.js','activities.js','solution-pages.js','replicate-content.js']){
  const source=fs.readFileSync(path.join(puzzleRoot,filename),'utf8');
  vm.runInContext(source,context,{filename});
}

const core=context.window.DuelPuzzleCore;
const definitions=core.list();
assert.equal(context.window.DuelPuzzleCatalog.length,22,'The catalog should contain 20 scanned families plus two custom activities.');
assert.equal(definitions.length,12,'Ten certified puzzle adapters and two validated competitive activities should be selectable.');
assert.ok(context.window.DuelPuzzleCatalog.some(item=>item.id==='xo'),'XO must replace True or False.');
assert.ok(!context.window.DuelPuzzleCatalog.some(item=>item.id==='vraisfaux'),'True or False must not remain in the active catalog.');
assert.equal(context.window.DuelReplicateContent.MODEL,'google/gemini-2.5-flash','The adapter must use the fixed Replicate model.');

let cases=0;
for(const definition of definitions){
  for(const difficulty of ['easy','medium','hard']){
    for(let seed=1;seed<=5;seed++){
      const options={difficulty,seed:seed*7919+definition.id.length};
      if(definition.id==='wordsearch'){
        options.words=['ALPHA','BRAVO','CHARLIE','DELTA','ECHO','FOXTROT','GOLF','HOTEL','INDIA','JULIET','KILO','LIMA'];
      }
      const record=core.generate(definition.id,options);
      assert.ok(record.solution,`${definition.id} must store a solution.`);
      assert.notEqual(record.quality?.valid,false,`${definition.id} must pass validation.`);
      if(definition.hasAnswerKey)assert.notEqual(record.solution.answerKey,false,`${definition.id} must remain eligible for the answer section.`);
      else assert.equal(record.solution.answerKey,false,`${definition.id} must be explicitly excluded from answer pages.`);
      if(definition.id==='wordsearch'||definition.id==='numbersearch')assert.equal(record.puzzle.targets.length,6,`${definition.id} must use the premium 2 x 3 target bank.`);
      if(definition.id==='xo')assert.equal(record.puzzle.length,3,'XO must contain three tactical boards per page.');
      if(definition.id==='dotsboxes')assert.deepEqual([record.puzzle.rows,record.puzzle.cols],[5,5],'Dots & Boxes must match the 5 x 5 reference grid.');
      if(definition.id==='drawobject')assert.ok(record.puzzle.prompt.length>=2,'Draw the Object must always have a usable prompt.');
      cases++;
    }
  }
}

const themedWords=['ANCHOR','DOLPHIN','OCTOPUS','SEAHORSE','TURTLE','MARLIN','LAGOON','CURRENT','ISLAND','SPONGE'];
const themedAnagram=core.generate('anagram',{difficulty:'medium',seed:3109,words:themedWords});
assert.equal(themedAnagram.puzzle.length,10,'AI-provided medium Anagram sets must contain ten playable words.');
assert.ok(themedAnagram.solution.every(word=>themedWords.includes(word)),'Anagram generation must use the provided niche word bank.');
themedAnagram.copy={title:'Ocean Explorer Scramble',instruction:'Rearrange every letter to reveal an ocean word.',footer:'Dive deep and solve boldly!'};
assert.equal(core.pageCopy(themedAnagram,{title:'ANAGRAM'}).title,'Ocean Explorer Scramble','Generated titles must reach the print renderer.');

const solutionPages=context.window.DuelSolutionPages;
assert.equal(solutionPages.PAGE_SIZE,4,'Answer sheets must contain four solutions per page.');
assert.equal(JSON.stringify(solutionPages.paginate([1,2,3,4,5,6,7,8,9])),JSON.stringify([[1,2,3,4],[5,6,7,8],[9]]),'Solution pagination must be dynamic.');

const html=fs.readFileSync(path.resolve(puzzleRoot,'..','index.html'),'utf8');
assert.match(html,/seq\.push\(\.\.\.buildSolutionPages\(\)\)/,'Solution sheets must be appended to the main book sequence.');
assert.match(html,/filter\(it=>typeof it\.makeSolutionComposite==='function'\)/,'Only real answer keys may enter the solution section.');
assert.match(html,/dpi:110/,'On-screen solution previews must use the high-resolution path.');
assert.match(html,/format=isSolution\?'PNG':'JPEG'/,'Main-PDF solution pages must use lossless PNG.');
assert.match(html,/addImage\(dataUrl,'PNG'/,'The solutions-only PDF must use lossless PNG.');
assert.match(html,/type="password" id="aiApiKey"/,'The Replicate token input must be masked.');
assert.match(html,/id="btnAiDownload" disabled/,'AI copy export must remain unavailable until content exists.');
assert.match(html,/<select id="aiAudience">/,'Audience and age must be a select control.');
assert.match(html,/<select id="aiLanguage">/,'Interior language must be a select control.');
assert.doesNotMatch(html,/id="aiModel"/,'The editable Gemini model field must be removed.');
assert.doesNotMatch(html,/\b(?:localStorage|sessionStorage)\s*\./,'Replicate credentials and generated content must not be persisted by the app.');
assert.doesNotMatch(html,/id="aiApiKey"[^>]*value=/,'The Replicate token must never be hard-coded into the app.');

console.log(`Passed ${cases} certified puzzle quality cases.`);
