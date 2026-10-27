import type {RaceContext} from './strategyModel';
export type Screen={type:'home'}|{type:'news'}|{type:'calendar';year?:number}|{type:'careers';id?:string}|{type:'drivers'}|{type:'driver';id:string}|{type:'strategy';race?:RaceContext}|{type:'garage';year:number;round:number;driver?:string}|{type:'circuit'|'replay'|'forecast';year:number;round:number;name:string}|{type:'race';year:number;round:number};
export function screenUrl(screen:Screen){const p=new URLSearchParams();for(const[k,v]of Object.entries(screen)){if(k==='type'||v===undefined)continue;if(k==='race'){const r=v as RaceContext;p.set('race',JSON.stringify(r));}else p.set(k,String(v));}return `#${screen.type}${p.size?'?'+p.toString():''}`;}
export function readScreen(hash:string):Screen{
 const [kind,query]=hash.replace(/^#/,'').split('?'),p=new URLSearchParams(query);const year=Number(p.get('year')),round=Number(p.get('round')),name=p.get('name')||'Grand Prix';
 if(kind==='home'||kind==='news'||kind==='drivers')return {type:kind};
 if(kind==='calendar')return {type:'calendar',...(Number.isInteger(year)&&year>=1950&&year<=new Date().getFullYear()?{year}:{})};
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
