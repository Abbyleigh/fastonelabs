import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseSearch,parseDetail,fetchHeritage} from '../src/heritage/api.ts';
const seed=JSON.parse(fs.readFileSync(new URL('../../backend/heritage/data/silverstone-1950.json',import.meta.url),'utf8'));
const search={schema_version:1,revision:seed.revision,coverage:seed.coverage,facets:{kinds:[...new Set(seed.entities.map(e=>e.kind))],years:[1950]},items:seed.entities,total:10,offset:0,limit:20};
const detail={schema_version:1,revision:seed.revision,links_total:seed.links.length,classifications_total:seed.classifications.length,entity:seed.entities.find(e=>e.id==='alfa-158'),links:seed.links,related:seed.entities,classifications:seed.classifications.map(r=>({position:null,laps:null,points:null,time:null,...r})),names:Object.fromEntries(seed.entities.map(e=>[e.id,e.name])),sources:seed.sources};

test('catalogue contracts preserve missing measurements and separate source rights',()=>{
 assert.equal(parseSearch(search).total,10);
 assert.equal(parseDetail(detail).entity.claims.find(c=>c.key==='model').value,null);
 assert.ok(detail.sources.every(s=>s.reuse==='unreviewed'));
});
test('malformed upstream shapes are rejected before rendering',()=>{
 for(const value of [null,{},[],{...search,schema_version:2},{...search,items:[{}]},{...search,facets:{kinds:['invented'],years:[1950]}}])assert.throws(()=>parseSearch(value));
 for(const change of [{sources:[{...seed.sources[0],url:'javascript:alert(1)'}]},{entity:{...detail.entity,claims:[{...detail.entity.claims[0],status:'missing'}]}},{classifications:[{}]},{links:[{}]},{names:{farina:123}}])assert.throws(()=>parseDetail({...detail,...change}));
});
test('fetch uses same-origin, carries cancellation, and reports failures',async()=>{
 const original=globalThis.fetch,signal=new AbortController().signal;
 try{
  globalThis.fetch=async(url,options)=>{assert.equal(url,'/api/heritage/entities');assert.equal(options.signal,signal);return {ok:true,json:async()=>search};};
  assert.equal((await fetchHeritage('entities',parseSearch,signal)).total,10);
  for(const status of [404,503]){globalThis.fetch=async()=>({ok:false,status});await assert.rejects(fetchHeritage('entities',parseSearch,signal),/reviewed collection|unavailable/);}
  globalThis.fetch=async()=>({ok:true,json:async()=>({})});await assert.rejects(fetchHeritage('entities',parseSearch,signal),/unsupported/);
 }finally{globalThis.fetch=original;}
});
