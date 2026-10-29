import type {DetailResponse, Entity, SearchResponse, Source, Claim, Classification, Link} from './contracts.ts';

const kinds = new Set(['season','circuit','layout','constructor','driver','vehicle','race','regulation','development']);
const statuses = new Set(['verified','estimated','missing','simulated']);
const object = (v:unknown):v is Record<string,unknown> => typeof v==='object' && v!==null && !Array.isArray(v);
const strings = (v:unknown):v is string[] => Array.isArray(v) && v.every(s=>typeof s==='string');
const number = (v:unknown):v is number => typeof v==='number' && Number.isFinite(v);
function claim(v:unknown):v is Claim {
  return object(v) && typeof v.key==='string' && typeof v.label==='string' && typeof v.context==='string'
    && statuses.has(String(v.status)) && strings(v.sources) && (v.unit===null || typeof v.unit==='string')
    && (v.status==='missing' ? v.value===null : v.value!==null && ['string','number','boolean'].includes(typeof v.value));
}
function entity(v:unknown):v is Entity {
  return object(v) && typeof v.id==='string' && typeof v.name==='string' && kinds.has(String(v.kind))
    && number(v.coverage_start) && number(v.coverage_end) && typeof v.summary==='string' && typeof v.coverage==='string'
    && strings(v.sources) && Array.isArray(v.claims) && v.claims.every(claim);
}
function source(v:unknown):v is Source {
  if(!object(v))return false;
  try {const url=new URL(String(v.url));if(url.protocol!=='https:'||url.username||url.password)return false;}catch{return false;}
  return ['id','title','publisher','url','checked','licence','notes'].every(k=>typeof v[k]==='string')
    && ['unreviewed','non-commercial','permitted'].includes(String(v.reuse));
}
function link(v:unknown):v is Link {
  return object(v) && ['subject','predicate','target','context'].every(k=>typeof v[k]==='string')
    && number(v.start_year) && number(v.end_year) && strings(v.sources);
}
function classification(v:unknown):v is Classification {
  return object(v) && ['id','season_id','entry','constructor_id','position_text','context'].every(k=>typeof v[k]==='string')
    && ['race','qualifying','driver-standing','constructor-standing'].includes(String(v.category))
    && (v.race_id===null||typeof v.race_id==='string') && strings(v.driver_ids) && strings(v.sources)
    && ['position','laps','points'].every(k=>v[k]===null||number(v[k])) && (v.time===null||typeof v.time==='string');
}
export function parseSearch(v:unknown):SearchResponse {
  if(!object(v)||v.schema_version!==1||typeof v.revision!=='string'||typeof v.coverage!=='string'
    ||!Array.isArray(v.items)||!v.items.every(entity)||!number(v.total)||!number(v.offset)||!number(v.limit)
    ||!object(v.facets)||!strings(v.facets.kinds)||!v.facets.kinds.every(k=>kinds.has(k))
    ||!Array.isArray(v.facets.years)||!v.facets.years.every(number)) throw Error('The heritage service returns an unsupported data contract.');
  return v as SearchResponse;
}
export function parseDetail(v:unknown):DetailResponse {
  if(!object(v)||v.schema_version!==1||typeof v.revision!=='string'||!entity(v.entity)
    ||!Array.isArray(v.sources)||!v.sources.every(source)||!Array.isArray(v.links)||!v.links.every(link)
    ||!Array.isArray(v.related)||!v.related.every(entity)||!Array.isArray(v.classifications)||!v.classifications.every(classification)
    ||!number(v.links_total)||!number(v.classifications_total)||!object(v.names)||!Object.values(v.names).every(n=>typeof n==='string')) throw Error('The heritage record has an unsupported data contract.');
  return v as DetailResponse;
}
export async function fetchHeritage<T>(path:string, parse:(value:unknown)=>T, signal:AbortSignal):Promise<T> {
  // The API is same-origin. Credentials and arbitrary upstream URLs are never accepted.
  const response=await fetch('/api/heritage/'+path,{signal,headers:{Accept:'application/json'}});
  if(!response.ok)throw Error(response.status===404?'This record is not in the reviewed collection.':'The heritage collection is unavailable. Please retry.');
  return parse(await response.json());
}
