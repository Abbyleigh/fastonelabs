export const viewDirections:Record<string,[number,number,number]>={perspective:[7,3,-8],side:[1,.05,0],front:[0,.06,-1],top:[0,1,.001]};
/** Fit every box corner against both camera planes, accounting for its depth. */
export function fitDistance(size:[number,number,number],verticalFov:number,aspect:number,margin=1.15,direction:[number,number,number]=viewDirections.perspective){
 if(!size.every(n=>Number.isFinite(n)&&n>=0)||!Number.isFinite(verticalFov)||verticalFov<=0||verticalFov>=179||!Number.isFinite(aspect)||aspect<=0||!Number.isFinite(margin)||margin<1||!direction.every(Number.isFinite)||Math.hypot(...direction)===0)throw Error('Invalid model framing dimensions.');
 const normalize=(v:number[])=>{const n=Math.hypot(...v);return v.map(x=>x/n);},dot=(a:number[],b:number[])=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dir=normalize(direction),right=normalize(cross(Math.abs(dir[1])>.99999?[0,0,1]:[0,1,0],dir)),up=cross(dir,right),tanV=Math.tan(verticalFov*Math.PI/360),tanH=tanV*aspect;
 let distance=.1;for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){const corner=[x*size[0]/2,y*size[1]/2,z*size[2]/2],depth=dot(corner,dir);distance=Math.max(distance,depth+Math.abs(dot(corner,right))/tanH,depth+Math.abs(dot(corner,up))/tanV);}return distance*margin;
}
