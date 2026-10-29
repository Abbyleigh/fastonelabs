import {useId,useState} from 'react';
import type {Entity,Source} from './contracts';

/** Museum evidence viewer. Never imports simulator geometry or geographic calibration. */
export default function HistoricalCircuit({layout,sources}:{layout:Entity;sources:Source[]}){
 const [expanded,setExpanded]=useState(false),panel=useId();
 const geometry=layout.claims.find(c=>c.key==='geometry');
 return <section className={'hc-circuit'+(expanded?' hc-circuit-expanded':'')} aria-label="Historical circuit experience">
  <div className="hc-circuit-top"><span className="hc-eyebrow">CIRCUIT ATLAS / LAYOUT IDENTITY</span><button aria-expanded={expanded} aria-controls={panel} onClick={()=>setExpanded(v=>!v)}>{expanded?'Collapse circuit study':'Expand circuit study'}</button></div>
  <div className="hc-circuit-stage"><div><span className="hc-era">{layout.coverage_start}</span><h4>{layout.name}</h4><p>{layout.summary}</p><button aria-controls={panel} aria-expanded={expanded} onClick={()=>setExpanded(true)}>Read layout evidence →</button></div><div className="hc-geometry-note"><span className="hc-status hc-missing">Geometry unavailable</span><h4>The record comes before the reconstruction.</h4><p>{geometry?.context??'No reviewed historic coordinates are available.'}</p><p>No track outline is displayed. A modern layout would misrepresent this event.</p></div></div>
  <div id={panel} hidden={!expanded} className="hc-circuit-evidence"><h4>What this layout record supports</h4><p>{layout.coverage}</p><dl>{layout.claims.map(c=><div key={c.key}><dt>{c.label}</dt><dd>{c.value===null?'Not verified':String(c.value)}{c.value!==null&&c.unit?' '+c.unit:''}<small>{c.context}</small></dd></div>)}</dl><p>Future layouts require separate dated records, reviewed coordinates, source attribution and geometry reuse permission before a measured map can appear here.</p><ul className="hc-citations">{sources.filter(s=>layout.sources.includes(s.id)).map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.publisher} · {s.title} ↗</a><small>Checked {s.checked} · reuse {s.reuse}</small></li>)}</ul></div>
 </section>;
}
