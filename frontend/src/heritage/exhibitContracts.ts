import type {ExhibitPlan,Source} from './contracts';
const object=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const strings=(v:unknown):v is string[]=>Array.isArray(v)&&v.every(x=>typeof x==='string');
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function parseExhibit(v:unknown,sources:Source[]):ExhibitPlan {
 if(!object(v)||typeof v.vehicle_id!=='string'||!['not-supplied','supplied'].includes(String(v.state))
  ||typeof v.notes!=='string'||!strings(v.sources)||!v.sources.length||!strings(v.assembly_labels))throw Error('Unsupported historic exhibit contract.');
 const known=new Map(sources.map(s=>[s.id,s]));
 if(!v.sources.every(id=>known.has(id)))throw Error('Unknown exhibit evidence.');
 const a=v.asset;
 if(v.state==='not-supplied'){
  if(a!==null&&a!==undefined||v.assembly_labels.length)throw Error('Pending exhibit must not contain a model.');
 }else{
  if(!object(a)||typeof a.path!=='string'||!/^\/models\/heritage\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_-]*\.glb$/.test(a.path)
   ||!hash(a.sha256)||typeof a.bytes!=='number'||!Number.isInteger(a.bytes)||a.bytes<=0||a.bytes>200*1024*1024
   ||!['creator','attribution','licence','modifications'].every(k=>typeof a[k]==='string'&&a[k])
   ||a.reuse!=='permitted'||!strings(a.sources)||!a.sources.length||!a.sources.every(id=>known.get(id)?.reuse==='permitted')
   ||!['illustrative','approximate','validated'].includes(String(a.fidelity))||a.format!=='glb'||a.units!=='m'||a.up_axis!=='Y'
   ||!strings(a.measurement_sources)||!a.measurement_sources.every(id=>known.has(id))
   ||a.fidelity==='validated'&&!a.measurement_sources.length
   ||typeof a.supports_exploded!=='boolean'||a.supports_exploded&&!hash(a.assembly_mapping_sha256)
   ||v.assembly_labels.length&&!a.supports_exploded
   ||!strings(a.permitted_uses)||!a.permitted_uses.length||!a.permitted_uses.every(p=>['private-exhibit','public-exhibit','commercial'].includes(p))
   ||typeof a.commercial_reviewed!=='boolean'||a.permitted_uses.includes('commercial')&&!a.commercial_reviewed
   ||a.vehicle_library_id!==null&&typeof a.vehicle_library_id!=='string')throw Error('Historic asset rights or fidelity checks fail.');
 }
 return v as ExhibitPlan;
}
/** Metadata bridge only; a matching label never grants permission or downloads bytes. */
export function libraryExhibitReference(plan:ExhibitPlan,library:{id:string;path?:string;sha256?:string}[]):string|null{
 const a=plan.asset;
 if(plan.state!=='supplied'||!a?.vehicle_library_id)return null;
 const found=library.find(item=>item.id===a.vehicle_library_id);
 return found&&found.path===a.path&&found.sha256===a.sha256?a.vehicle_library_id:null;
}
