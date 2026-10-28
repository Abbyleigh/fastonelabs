import type {MuseumSection} from './heritageData';
import type {RaceContext} from './strategyModel';
export type Screen={type:'museum';section?:MuseumSection;id?:string}|{type:'library'}|{type:'personal-garage'}|{type:'home'}|{type:'news'}|{type:'calendar';year?:number;round?:number}|{type:'careers';id?:string}|{type:'drivers'}|{type:'driver';id:string}|{type:'strategy';race?:RaceContext}|{type:'garage';year:number;round:number;driver?:string}|{type:'circuit'|'replay'|'forecast';year:number;round:number;name:string}|{type:'race';year:number;round:number};
export function screenUrl(screen:Screen){const p=new URLSearchParams();for(const[k,v]of Object.entries(screen)){if(k==='type'||v===undefined)continue;if(k==='race'){const r=v as RaceContext;p.set('race',JSON.stringify(r));}else p.set(k,String(v));}return `#${screen.type}${p.size?'?'+p.toString():''}`;}
export function readScreen(hash:string):Screen{
 const [kind,query]=hash.replace(/^#/,'').split('?'),p=new URLSearchParams(query);const year=Number(p.get('year')),round=Number(p.get('round')),name=p.get('name')||'Grand Prix';
 if(kind==='library'||kind==='personal-garage'||kind==='home'||kind==='news'||kind==='drivers')return {type:kind};
 if(kind==='museum'){const section=p.get('section')||'origins',id=p.get('id');return {type:'museum',section:(['origins','timeline','collection','innovations','compare','races','historian'].includes(section)?section:'origins') as MuseumSection,...(id&&['alfa-158','lotus-25','mp4-1'].includes(id)?{id}:{})};}
 if(kind==='calendar')return {type:'calendar',...(Number.isInteger(year)&&year>=1950&&year<=new Date().getFullYear()?{year}:{}),...(Number.isInteger(round)&&round>=1&&round<=30?{round}:{})};
 if(kind==='driver'&&/^[a-zA-Z0-9_]+$/.test(p.get('id')||''))return {type:'driver',id:p.get('id')!};
 if(kind==='careers')return {type:'careers',...(/^[a-zA-Z0-9_]+$/.test(p.get('id')||'')?{id:p.get('id')!}:{})};
 if(kind==='strategy'){try{const race=JSON.parse(p.get('race')||'null');if(race&&Number.isInteger(race.season)&&race.season>=1950&&race.season<=new Date().getFullYear()&&Number.isInteger(race.round)&&race.round>=1&&race.round<=30&&['name','circuit','date'].every(k=>typeof race[k]==='string'&&race[k].length<=200))return {type:'strategy',race};}catch{/* Invalid URL state falls back to the saved-workbench entry. */}return {type:'strategy'};}
 if(!Number.isInteger(year)||year<1950||year>new Date().getFullYear()||!Number.isInteger(round)||round<1||round>30)return {type:'home'};
 if(kind==='garage')return {type:'garage',year,round,...(/^[a-zA-Z0-9_]+$/.test(p.get('driver')||'')?{driver:p.get('driver')!}:{})};
 if(kind==='race')return {type:'race',year,round};
 if(kind==='circuit'||kind==='replay'||kind==='forecast')return {type:kind,year,round,name};
 return {type:'home'};
}
export function nextSlide(index:number,direction:number,count:number){return count>0?((index+direction)%count+count)%count:0;}
export function shouldAdvance(enabled:boolean,reduced:boolean,hovered:boolean,focused:boolean,visible:boolean,count:number){return enabled&&!reduced&&!hovered&&!focused&&visible&&count>1;}

export type WorkspaceEvent={year:number;round:number;name:string;circuit:string;start:string;status:string};
/** Keep the current race tool when its selected event supports that tool. */
export function screenForEvent(current:Screen,event:WorkspaceEvent):Screen{
 const {year,round,name}=event;
 if(current.type==='strategy')return {type:'strategy',race:{season:year,round,name,circuit:event.circuit,date:event.start.slice(0,10)}};
 if(current.type==='forecast'||current.type==='circuit')return {type:current.type,year,round,name};
 if(current.type==='replay'&&event.status==='completed'&&year>=2023)return {type:'replay',year,round,name};
 if(current.type==='race'&&event.status==='completed')return {type:'race',year,round};
 if(current.type==='garage'&&event.status==='completed')return {type:'garage',year,round,...(current.driver?{driver:current.driver}:{})};
 if(['replay','race','garage'].includes(current.type))return event.status==='completed'?{type:'race',year,round}:{type:'circuit',year,round,name};
 return {type:'calendar',year,round};
}
export function eventInSeason<T extends WorkspaceEvent>(events:T[],previous:WorkspaceEvent|null){
 return events.find(e=>previous&&(e.circuit===previous.circuit||e.name===previous.name))??events.find(e=>e.status==='upcoming')??events[events.length-1]??null;
}
