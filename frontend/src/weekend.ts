export type Session={name:string;date:string;start:string|null;time_confirmed:boolean};
export type Weekend={year:number;round:number;name:string;circuit:string;start:string;sessions?:Session[];time_confirmed?:boolean;status:string};
/** Only explicit timezone-bearing timestamps can drive a countdown. */
export function confirmedStart(session:Session){if(!session.time_confirmed||!session.start||!/(Z|[+-]\d\d:\d\d)$/.test(session.start))return null;const t=Date.parse(session.start);return Number.isFinite(t)?t:null;}
export function upcomingSession(races:Weekend[],now:number){return races.flatMap(r=>r.sessions?.map(s=>({race:r,session:s,start:confirmedStart(s)}))??[]).filter((r):r is typeof r & {start:number}=>r.start!==null&&r.start>now).sort((a,b)=>a.start-b.start)[0]??null;}
export function countdown(start:number,now:number){const minutes=Math.max(0,Math.ceil((start-now)/60000)),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;return `${days?days+'d ':''}${hours}h ${String(mins).padStart(2,'0')}m`;}
