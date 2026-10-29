import type {Channels} from './race/raceSources';
export type ReplayMoment={time:number;label:string;kind:'Race control'|'Team radio';driver:number|null};
/** Bookmarks are derived only from messages inside this loaded window. */
export function recordedMoments(channels:Channels,duration:number,selected:number|null){
 const rows:ReplayMoment[]=[];
 for(const row of channels.race_control??[]){if(typeof row.message!=='string'||!row.message.trim())continue;rows.push({time:row.time,label:row.message.slice(0,160),kind:'Race control',driver:null});}
 for(const row of channels.team_radio??[]){if(typeof row.recording_url!=='string'||!row.recording_url.startsWith('https://')||(selected!==null&&row.driver_number!==selected))continue;rows.push({time:row.time,label:'Available recorded radio clip',kind:'Team radio',driver:row.driver_number??null});}
 const seen=new Set<string>();return rows.filter(r=>{if(!Number.isFinite(r.time)||r.time<0||r.time>duration)return false;const id=`${r.kind}/${r.time}/${r.label}/${r.driver}`;if(seen.has(id))return false;seen.add(id);return true;}).sort((a,b)=>a.time-b.time).slice(0,16);
}
