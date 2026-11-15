import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'vite';
const entry='outpost:mission-audio-test';
const bundle=await build({configFile:false,logLevel:'silent',plugins:[{
  name:'mission-audio-test-entry',resolveId:id=>id===entry?`\0${id}`:null,
  load:id=>id===`\0${entry}`?`export * from '/src/utils/missionAudio.ts'; export {runExperiment} from '/src/engine/simulation.ts'; export {createRunInput} from '/src/engine/runInput.ts';`:null,
}],build:{write:false,minify:false,rollupOptions:{input:entry,output:{format:'es'},preserveEntrySignatures:'strict'}}});
const [{code}]=bundle.output;
const {missionMusicState,decisionAudioCue,runExperiment,createRunInput}=await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const run=(choices)=>runExperiment(createRunInput(choices));

test('menu overrides danger; exploration and critical follow actual latest run results',()=>{
  assert.equal(missionMusicState(false,run([])),'exploration');
  const low=run([1,0,2]);assert.ok(low.final.powerKwh<20);
  assert.equal(missionMusicState(false,low),'critical');
  assert.equal(missionMusicState(true,low),'menu');
  // The selector accepts a computed run, not a displayed/history phase index.
  assert.equal(missionMusicState(false,run([0,0,1])),'exploration');
});

test('new low reserve gets one warning; later low-reserve choices get normal feedback',()=>{
  const previous=run([1,0]);const low=run([1,0,2]);
  assert.equal(decisionAudioCue(previous,low,3),'batteryAlert');
  assert.equal(decisionAudioCue(low,run([1,0,2,0]),4),'choice');
  assert.equal(decisionAudioCue(previous,run([1,0,1]),3),'backup');
});

test('completion chooses success/failure feedback ahead of routine decision sounds',()=>{
  const success=run([1,0,1,0,2,2]);
  assert.equal(success.outcome,'success');
  assert.equal(decisionAudioCue(run([1,0,1,0,2]),success,6),'success');
  const abort=run([2,2,2,2,0,0]);assert.equal(abort.outcome,'abort');
  assert.equal(decisionAudioCue(run([]),abort,6),'failure');
  assert.equal(decisionAudioCue(abort,abort,6),'choice');
});
