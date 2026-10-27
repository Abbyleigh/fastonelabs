import React,{useEffect,useState} from 'react';
type Photo={url:string;source:string;title:string;description:string;artist:string;license:string;license_url:string;date:string};
type Media={photos:Photo[];notice:string};
export default function DriverMedia({id,name}:{id:string;name:string}){
 const [data,setData]=useState<Media|null>(null),[index,setIndex]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{const controller=new AbortController();setData(null);setIndex(0);setFailed(false);fetch(`/api/archive/driver/${encodeURIComponent(id)}?media=true`,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(setData).catch(()=>{if(!controller.signal.aborted)setData({photos:[],notice:'Racing photos are temporarily unavailable.'});});return()=>controller.abort();},[id]);
 const photo=data?.photos[index];
 return <section className="strategy-card" style={{padding:0,overflow:'hidden',marginBottom:18}}>
  <div style={{background:'#090f19',display:'flex',justifyContent:'center',alignItems:'center',minHeight:180}}>
   {photo&&!failed&&<img src={photo.url} alt={`${name} · ${photo.title}`} onError={()=>setFailed(true)} style={{display:'block',width:'100%',height:'auto',maxHeight:'70vh',objectFit:'contain',objectPosition:'center top'}}/>}
   {(!photo||failed)&&<p style={{padding:24,color:'#b9cbe2'}}>{!data?'Finding racing photographs…':'No verified racing photo available yet. Explore the 3D model below.'}</p>}
  </div>
  <div style={{padding:'18px 24px 0'}}><div className="eyebrow">DRIVER RACING GALLERY</div><h2 style={{fontSize:'clamp(24px,3vw,36px)',margin:'8px 0'}}>{name}</h2>{photo&&!failed&&<p style={{fontSize:13,margin:0,color:'#b9cbe2',overflowWrap:'anywhere'}}>{photo.title}</p>}</div>
  <div style={{padding:18,color:'#b9cbe2',fontSize:12,lineHeight:1.7}}>{photo&&<><a href={photo.source} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>Source & full image details</a> · {photo.artist} · <a href={photo.license_url||photo.source} target="_blank" rel="noreferrer" style={{color:'#86c8ff'}}>{photo.license}</a><br/></>}{data?.notice}
   {(data?.photos.length??0)>1&&<div className="strategy-actions" style={{marginTop:12}}>{data!.photos.map((p,i)=><button key={p.url} aria-label={`Racing photo ${i+1}`} aria-pressed={index===i} onClick={()=>{setIndex(i);setFailed(false);}} style={{border:'1px solid #425a75',background:index===i?'#355378':'#202e42',color:'white',padding:'8px 12px',borderRadius:7,cursor:'pointer'}}>Photo {i+1}</button>)}</div>}
  </div>
 </section>;
}
