import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {staticBalance} from '../src/heritage/engineeringModel.ts';
import {parseExhibit,libraryExhibitReference} from '../src/heritage/exhibitContracts.ts';
import {parseSearch,parseDetail} from '../src/heritage/api.ts';
const seed=JSON.parse(fs.readFileSync(new URL('../../backend/heritage/data/cooper-1959-1960.json',import.meta.url),'utf8'));
test('static balance conserves reactions and responds to engine placement',()=>{
 for(const x of [0,.2,.5,.7,1])for(const mass of [100,150,300]){
  const r=staticBalance(x,mass);assert.ok(Math.abs(r.frontFraction+r.rearFraction-1)<1e-12);assert.ok(r.frontFraction>=0&&r.rearFraction>=0);
 }
 assert.ok(staticBalance(.7,150).rearFraction>staticBalance(.2,150).rearFraction);
 assert.equal(staticBalance(.5,150).total,625);
 // Independent moment-equilibrium calculation for the default teaching assumptions.
 assert.equal(staticBalance(.2,150).rearFraction,(400*.5+75*.4+150*.2)/625);
 for(const [x,m] of [[NaN,150],[-1,150],[2,150],[.5,Infinity],[.5,0]])assert.throws(()=>staticBalance(x,m));
});
test('new collection engine and dated-layout contract preserves the evidence gap',()=>{
 const response={schema_version:1,revision:seed.revision,coverage:seed.coverage,facets:{kinds:['engine'],years:[1959,1960]},items:seed.entities,total:19,offset:0,limit:20};
 assert.equal(parseSearch(response).items.filter(e=>e.kind==='engine').length,1);
 const entity=seed.entities.find(e=>e.id==='cooper-t51');
 const detail={schema_version:1,revision:seed.revision,entity,sources:seed.sources,links:[],related:[],classifications:[],names:{},links_total:0,classifications_total:0,exhibit:seed.exhibits[0],layouts:[]};
 assert.equal(parseDetail(detail).exhibit.state,'not-supplied');
 assert.throws(()=>parseDetail({...detail,exhibit:{...seed.exhibits[0],vehicle_id:'cooper-t53'}}));
 assert.throws(()=>parseDetail({...detail,layouts:[entity]}));
});
test('pending exhibit cannot smuggle a model or assembly labels',()=>{
 const pending=seed.exhibits[0];assert.equal(parseExhibit(pending,seed.sources).state,'not-supplied');
 assert.throws(()=>parseExhibit({...pending,asset:{}},seed.sources));
 assert.throws(()=>parseExhibit({...pending,assembly_labels:['engine']},seed.sources));
 assert.equal(libraryExhibitReference(pending,[]),null);
});
function supplied(){
 const source={...seed.sources[0],id:'test-model',reuse:'permitted'};
 const plan={...seed.exhibits[0],state:'supplied',asset:{path:'/models/heritage/cooper/t51.glb',format:'glb',sha256:'a'.repeat(64),bytes:100,creator:'Synthetic fixture',attribution:'Synthetic fixture',licence:'Synthetic fixture',reuse:'permitted',sources:['test-model'],fidelity:'approximate',units:'m',up_axis:'Y',measurement_sources:[],modifications:'None',supports_exploded:false,assembly_mapping_sha256:null,vehicle_library_id:'test-t51',permitted_uses:['private-exhibit'],commercial_reviewed:false}};
 return {plan,sources:[...seed.sources,source]};
}
test('model bridge requires permission, dimensional evidence, assembly mapping and exact library identity',()=>{
 const {plan,sources}=supplied();const parsed=parseExhibit(plan,sources);
 const matching={id:'test-t51',path:plan.asset.path,sha256:plan.asset.sha256};
 assert.equal(libraryExhibitReference(parsed,[matching]),'test-t51');
 assert.equal(libraryExhibitReference(parsed,[{...matching,sha256:'b'.repeat(64)}]),null);
 for(const change of [{path:'https://example.com/car.glb'},{path:'/models/heritage/../car.glb'},{sources:['goodwood-t51']},{fidelity:'validated'}, {supports_exploded:true},{permitted_uses:['commercial']},{bytes:-1},{up_axis:'Z'}])assert.throws(()=>parseExhibit({...plan,asset:{...plan.asset,...change}},sources));
});
