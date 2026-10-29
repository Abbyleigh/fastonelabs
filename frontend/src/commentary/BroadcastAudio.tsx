import {useEffect,useRef,useState} from 'react';

type Props = {
  time:number;
  windowOffset:number;
  playing:boolean;
  playbackSpeed:number;
};

export default function BroadcastAudio({
  time,windowOffset,playing,playbackSpeed
}:Props){
  const audioRef=useRef<HTMLAudioElement|null>(null);
  const urlRef=useRef<string|null>(null);
  const previousClock=useRef<number|null>(null);
  const previousPlaying=useRef(false);
  const previousOffset=useRef(0);
  const [filename,setFilename]=useState('');
  const [offset,setOffset]=useState(0);
  const [volume,setVolume]=useState(80);
  const [status,setStatus]=useState('');

  const clock=windowOffset+time;

  useEffect(()=>{
    return ()=>{
      audioRef.current?.pause();
      if(urlRef.current)URL.revokeObjectURL(urlRef.current);
    };
  },[]);

  useEffect(()=>{
    const audio=audioRef.current;
    if(!audio||!filename)return;

    const previous=previousClock.current;
    const delta=previous===null?0:clock-previous;

    const initial=previous===null;
    const jumped=previous!==null&&(
      delta<-.25||delta>2
    );
    const started=playing&&!previousPlaying.current;
    const offsetChanged=offset!==previousOffset.current;

    // Seek only on initialisation, replay jumps,
    // resume or an explicit sync-offset change.
    if(initial||jumped||started||offsetChanged){
      const target=Math.max(0,clock+offset);
      const duration=audio.duration;

      const bounded=Number.isFinite(duration)
        ?Math.min(target,Math.max(0,duration-.05))
        :target;

      if(audio.readyState>=1){
        audio.currentTime=bounded;
      }
    }

    audio.playbackRate=Math.max(
      .5,Math.min(4,playbackSpeed)
    );

    if(!playing){
      audio.pause();
    }else if(started || audio.paused){
      void audio.play().then(()=>{
        setStatus('🎙️ Commentary synchronised with race playback.');
      }).catch(error=>{
        setStatus(
          error.name==='NotAllowedError'
            ?'Click Play Audio once to enable commentary in this browser.'
            :'Audio playback failed: '+error.name
        );
      });
    }

    previousClock.current=clock;
    previousPlaying.current=playing;
    previousOffset.current=offset;
  },[
    clock,playing,playbackSpeed,offset,filename
  ]);

  useEffect(()=>{
    if(audioRef.current){
      audioRef.current.volume=volume/100;
    }
  },[volume]);

  const loadFile=(file:File|undefined)=>{
    if(!file)return;

    const audio=audioRef.current;
    if(!audio)return;

    audio.pause();

    if(urlRef.current){
      URL.revokeObjectURL(urlRef.current);
    }

    const url=URL.createObjectURL(file);
    urlRef.current=url;
    audio.src=url;
    audio.load();

    previousClock.current=null;
    previousPlaying.current=false;

    setFilename(file.name);
    setStatus('Audio loaded. Ready for playback.');
  };

  const buttonStyle={
    padding:'8px 12px',
    background:'#24394e',
    border:'1px solid #526b82',
    borderRadius:6,
    color:'white',
    cursor:'pointer'
  } as const;

  return <section style={{
    padding:14,
    marginTop:12,
    background:'#0b1724',
    borderRadius:9
  }}>
    <h4 style={{margin:'0 0 12px'}}>
      🎙️ Original Broadcast Audio
    </h4>

    <input
      type="file"
      accept="audio/*,.mp3,.wav,.m4a,.aiff"
      onChange={e=>loadFile(e.target.files?.[0])}
      style={{maxWidth:'100%',marginBottom:12}}
    />

    <audio
      ref={audioRef}
      controls
      preload="metadata"
      onLoadedMetadata={()=>{
        const audio=audioRef.current;
        if(!audio)return;
        const target=Math.max(0,clock+offset);
        audio.currentTime=Math.min(
          target,Math.max(0,audio.duration-.05)
        );
      }}
      style={{width:'100%',marginBottom:12}}
    />

    {filename&&<>
      <div style={{
        fontSize:12,
        marginBottom:12,
        overflowWrap:'anywhere'
      }}>{filename}</div>

      <div style={{
        display:'flex',
        gap:8,
        marginBottom:12
      }}>
        <button
          type="button"
          style={buttonStyle}
          onClick={()=>{
            const audio=audioRef.current;
            if(!audio)return;
            void audio.play().then(()=>{
              setStatus('Audio playing.');
            }).catch(e=>{
              setStatus('Playback failed: '+e.name);
            });
          }}
        >
          ▶ Play Audio
        </button>

        <button
          type="button"
          style={buttonStyle}
          onClick={()=>audioRef.current?.pause()}
        >
          ⏸ Pause
        </button>
      </div>

      <label style={{display:'block',marginBottom:12}}>
        Sync offset: {offset.toFixed(1)}s
        <input
          type="range"
          min="-120"
          max="120"
          step=".5"
          value={offset}
          onChange={e=>setOffset(Number(e.target.value))}
          style={{display:'block',width:'100%'}}
        />
      </label>

      <label style={{display:'block'}}>
        Volume: {volume}%
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={e=>setVolume(Number(e.target.value))}
          style={{display:'block',width:'100%'}}
        />
      </label>
    </>}

    <p role="status" style={{
      fontSize:12,
      color:'#b8c9d8'
    }}>{status}</p>
  </section>;
}
