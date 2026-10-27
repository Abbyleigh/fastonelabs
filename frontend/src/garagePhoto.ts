export const GARAGE_PHOTO={
 path:'/images/garage/silverstone-alphatauri-2021.jpg',
 title:'AlphaTauri garage · Silverstone 2021',
 author:'Jen Ross',
 source:'https://commons.wikimedia.org/wiki/File:Alpha_Tauri_F1_Team_Garage,_British_GP,_Silverstone_2021_(51349514318).jpg',
 license:'CC BY 2.0',licenseUrl:'https://creativecommons.org/licenses/by/2.0/',
};
export function coverRect(iw:number,ih:number,w:number,h:number){const scale=Math.max(w/iw,h/ih);return {x:(w-iw*scale)/2,y:(h-ih*scale)/2,width:iw*scale,height:ih*scale};}
