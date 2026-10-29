import {useEffect,useId,useRef,useState} from 'react';
import type {SearchResponse,Source} from './contracts';
import {fetchHeritage,parseDetail,parseSearch} from './api';
import './catalogue.css';

type Load<T>={state:'loading'}|{state:'error';message:string}|{state:'ready';data:T};
function useResource<T>(path:string,parse:(v:unknown)=>T,revision:number):Load<T>{
 const [value,setValue]=useState<{path:string;revision:number;result:Load<T>}>({path,revision,result:{state:'loading'}});
 useEffect(()=>{const controller=new AbortController();setValue({path,revision,result:{state:'loading'}});
  const timeout=setTimeout(()=>controller.abort(),12000);
  fetchHeritage(path,parse,controller.signal).then(data=>{if(!controller.signal.aborted)setValue({path,revision,result:{state:'ready',data}});})
   .catch(error=>{if(!controller.signal.aborted)setValue({path,revision,result:{state:'error',message:error instanceof Error?error.message:'The heritage collection is unavailable.'}});})
   .finally(()=>clearTimeout(timeout));
  const onAbort=()=>setValue({path,revision,result:{state:'error',message:'The request times out. Please retry.'}});
  controller.signal.addEventListener('abort',onAbort);
  return()=>{controller.signal.removeEventListener('abort',onAbort);clearTimeout(timeout);controller.abort();};
 },[path,parse,revision]);
 return value.path===path&&value.revision===revision?value.result:{state:'loading'};
}
function Citations({ids,sources}:{ids:string[];sources:Source[]}){
 return <ul className="hc-citations">{[...new Set(ids)].map(id=>{const s=sources.find(v=>v.id===id);return s?<li key={id}><a href={s.url} target="_blank" rel="noreferrer">{s.publisher} · {s.title} ↗</a><small>Checked {s.checked} · reuse {s.reuse}</small></li>:<li key={id}>Source unavailable: {id}</li>;})}</ul>;
}
function Record({id,onSelect,onBack}:{id:string;onSelect:(id:string)=>void;onBack:()=>void}){
 const [revision,setRevision]=useState(0),result=useResource('entities/'+encodeURIComponent(id),parseDetail,revision),heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(result.state==='ready')heading.current?.focus();},[id,result.state]);
 if(result.state==='loading')return <p role="status">Loading the reviewed record…</p>;
 if(result.state==='error')return <div role="alert"><p>{result.message}</p><button onClick={()=>setRevision(v=>v+1)}>Retry record</button> <button onClick={onBack}>Back to results</button></div>;
 const {entity,links,related,classifications,names,sources,links_total,classifications_total}=result.data;
 return <article className="hc-record"><button onClick={onBack}>← Back to results</button><p className="hc-eyebrow">{entity.kind} / {entity.coverage_start}</p><h3 tabIndex={-1} ref={heading}>{entity.name}</h3><p>{entity.summary}</p><p className="hc-coverage"><strong>Collection coverage.</strong> {entity.coverage}</p>
 <dl className="hc-claims">{entity.claims.map(c=><div key={c.key}><dt>{c.label}<span className={'hc-status hc-'+c.status}>{c.status}</span></dt><dd>{c.value===null?'Not available / not applicable':String(c.value)}{c.unit&&c.value!==null?' '+c.unit:''}<p>{c.context}</p><Citations ids={c.sources} sources={sources}/></dd></div>)}</dl>
 {classifications.length>0&&<div className="hc-table"><table><caption>Selected reviewed results — partial coverage ({classifications.length} of {classifications_total} stored rows)</caption><thead><tr><th scope="col">Session</th><th scope="col">Position</th><th scope="col">Driver / constructor</th><th scope="col">Points</th><th scope="col">Time / laps</th><th scope="col">Evidence</th></tr></thead><tbody>{classifications.map(r=><tr key={r.id}><td>{r.category.replace(/-/g,' ')}<small>{r.context}</small></td><td>{r.position_text}</td><td>{r.driver_ids.map(d=><button key={d} onClick={()=>onSelect(d)}>{names[d]??d}</button>)}<button onClick={()=>onSelect(r.constructor_id)}>{names[r.constructor_id]??r.constructor_id}</button></td><td>{r.points??'—'}</td><td>{r.time??'—'}<small>{r.laps===null?'Lap count not supplied':r.laps+' laps'}</small></td><td><Citations ids={r.sources} sources={sources}/></td></tr>)}</tbody></table></div>}
 {links.length>0&&<section><h4>Explore the connections ({links.length} of {links_total})</h4><ul className="hc-links">{links.map((l,i)=>{const target=l.subject===id?l.target:l.subject;const found=related.find(e=>e.id===target);return <li key={i}><button onClick={()=>onSelect(target)}>{found?.name??target} →</button><small>{l.subject===id?'':'Incoming: '}{l.predicate.replace(/-/g,' ')} · reviewed {l.start_year}–{l.end_year}</small><p>{l.context}</p><Citations ids={l.sources} sources={sources}/></li>;})}</ul></section>}
 <details><summary>Record sources and reuse review</summary><Citations ids={entity.sources} sources={sources}/>{sources.filter(s=>entity.sources.includes(s.id)).map(s=><p key={s.id}><strong>{s.publisher}:</strong> {s.licence}. {s.notes}</p>)}</details>
 </article>;
}
export default function HeritageCatalogue(){
 const label=useId(),[query,setQuery]=useState(''),[settledQuery,setSettledQuery]=useState(''),[kind,setKind]=useState(''),[year,setYear]=useState(''),[offset,setOffset]=useState(0),[selected,setSelected]=useState<string|null>(null),[revision,setRevision]=useState(0),searchRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{const timer=setTimeout(()=>{setSettledQuery(query);setOffset(0);},250);return()=>clearTimeout(timer);},[query]);
 const params=new URLSearchParams({q:settledQuery,limit:'6',offset:String(offset)});if(kind)params.set('kind',kind);if(year)params.set('year',year);
 const result=useResource('entities?'+params.toString(),parseSearch,revision);
 const [facets,setFacets]=useState<SearchResponse['facets']>({kinds:[],years:[]});
 useEffect(()=>{if(result.state==='ready')setFacets(result.data.facets);},[result]);
 function back(){setSelected(null);requestAnimationFrame(()=>searchRef.current?.focus());}
 return <section className="heritage-catalogue" aria-labelledby={label}><header><p className="hc-eyebrow">THE RESEARCH COLLECTION / 001</p><h2 id={label}>One race. A connected history.</h2><p>Explore Silverstone in 1950 through its people, machinery and evidence.</p></header><p className="hc-coverage">A small, reviewed pilot collection. Missing measurements stay visible. Source verification does not grant commercial reuse. No photographs or historic 3D assets are included.</p>
 {selected?<Record key={selected} id={selected} onSelect={setSelected} onBack={back}/>:<><div className="hc-filters"><label>Search the collection<input ref={searchRef} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Silverstone, Farina, Alfetta…" maxLength={100}/></label><label>Record type<select value={kind} onChange={e=>{setKind(e.target.value);setOffset(0);}}><option value="">All types</option>{facets.kinds.map(k=><option key={k} value={k}>{k}</option>)}</select></label><label>Reviewed season<select value={year} onChange={e=>{setYear(e.target.value);setOffset(0);}}><option value="">All seasons</option>{facets.years.map(y=><option key={y} value={y}>{y}</option>)}</select></label><button onClick={()=>{setQuery('');setSettledQuery('');setKind('');setYear('');setOffset(0);}}>Clear filters</button></div>
 {result.state==='loading'&&<p role="status">Loading the research collection…</p>}
 {result.state==='error'&&<div role="alert"><p>{result.message}</p><button onClick={()=>setRevision(v=>v+1)}>Retry collection</button></div>}
 {result.state==='ready'&&<><p role="status">{result.data.total} records match · {result.data.revision}</p><p className="hc-coverage">{result.data.coverage}</p>{result.data.items.length===0?<p>No reviewed records match. Clear filters to return to the collection.</p>:<ul className="hc-grid">{result.data.items.map(e=><li key={e.id}><span className="hc-eyebrow">{e.coverage_start} / {e.kind}</span><h3>{e.name}</h3><p>{e.summary}</p><button onClick={()=>setSelected(e.id)}>Explore {e.name} →</button></li>)}</ul>}<nav className="hc-pagination" aria-label="Collection pages"><button disabled={offset===0} onClick={()=>setOffset(v=>Math.max(0,v-6))}>Previous</button><span>{result.data.total?`${offset+1}–${Math.min(offset+6,result.data.total)} of ${result.data.total}`:'0 records'}</span><button disabled={offset+6>=result.data.total} onClick={()=>setOffset(v=>v+6)}>Next</button></nav></>}
 </>}
 </section>;
}
