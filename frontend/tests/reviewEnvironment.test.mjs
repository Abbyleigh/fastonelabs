import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewEnvironment} from '../../tools/review_environment.mjs';
test('review children disable both AI providers and remove keys without changing parent environment',()=>{
 const parent={PATH:'/test',MUSEUM_AI_ENABLED:'1',RACE_ENGINEER_AI_ENABLED:'1',GROQ_API_KEY:'sentinel',OPENAI_API_KEY:'sentinel'};
 const child=reviewEnvironment(parent);
 assert.equal(child.MUSEUM_AI_ENABLED,'0');assert.equal(child.RACE_ENGINEER_AI_ENABLED,'0');
 assert.equal(child.GROQ_API_KEY,undefined);assert.equal(child.OPENAI_API_KEY,undefined);
 assert.equal(child.PATH,'/test');assert.equal(parent.GROQ_API_KEY,'sentinel');assert.equal(parent.MUSEUM_AI_ENABLED,'1');
});
