import BroadcastAudio from './BroadcastAudio';
import {useEffect,useRef,useState} from 'react';
import type {UnifiedRaceState} from '../race/unifiedRaceState';
import {
  makeCommentary,
  pitCommentary,
  type CommentaryCue
} from './CommentaryEngine';

type Props={
  frame:UnifiedRaceState;
  time:number;
  windowOffset:number;
  playing:boolean;
  playbackSpeed:number;
  selectedDriver:number|null;
  eventName:string;
};

export default function CommentaryPanel({
  frame,time,windowOffset,playing,playbackSpeed,
  selectedDriver,eventName
}:Props){
  const [voiceEnabled,setVoiceEnabled]=useState(false);
  const [source,setSource]=useState<'generated'|'broadcast'>('generated');
  const [captionsEnabled,setCaptionsEnabled]=useState(true);
  const [cue,setCue]=useState<CommentaryCue|null>(null);

  const previousTime=useRef<number|null>(null);
  const lastSegment=useRef<number|null>(null);
  const lastPit=useRef<string|null>(null);
  const lastPitAnnouncement=useRef(-Infinity);
  const sequence=useRef(0);

  const stopSpeech=()=>{
    if(typeof window!=='undefined'&&'speechSynthesis' in window){
      window.speechSynthesis.cancel();
    }
  };

  useEffect(()=>{
    if(!playing||!voiceEnabled||source==='broadcast')stopSpeech();
  },[playing,voiceEnabled,source]);

  useEffect(()=>{
    return ()=>{
      if('speechSynthesis' in window){
        window.speechSynthesis.cancel();
      }
    };
  },[]);

  useEffect(()=>{
    const previous=previousTime.current;
    previousTime.current=time;

    const jumped=previous!==null&&(
      time<previous-.3||
      time-previous>2.5
    );

    if(jumped){
      stopSpeech();
      lastSegment.current=Math.floor((windowOffset+time)/20);
      lastPit.current=null;
      setCue(null);
      return;
    }

    if(!playing)return;

    const driver=frame.cars.find(
      c=>c.driverNumber===selectedDriver
    )??frame.cars[0];

    const pit=driver?.pitPhase??'unknown';
    const previousPit=lastPit.current;
    lastPit.current=pit;

    let nextCue:CommentaryCue|null=null;

    if(
      previousPit!==null&&
      previousPit!==pit&&
      ['entry','box','exit'].includes(pit)&&
      time-lastPitAnnouncement.current>=8
    ){
      nextCue=pitCommentary(
        frame,time,windowOffset,selectedDriver
      );
      lastPitAnnouncement.current=time;
    }

    const segment=Math.floor((windowOffset+time)/20);

    if(lastSegment.current===null){
      lastSegment.current=segment;
      nextCue=nextCue??makeCommentary(
        frame,time,windowOffset,selectedDriver,
        sequence.current++
      );
    }else if(segment!==lastSegment.current){
      lastSegment.current=segment;
      nextCue=nextCue??makeCommentary(
        frame,time,windowOffset,selectedDriver,
        sequence.current++
      );
    }

    if(!nextCue)return;

    setCue(nextCue);

    if(
      source==='generated'&&voiceEnabled&&
      playbackSpeed===1&&
      'speechSynthesis' in window
    ){
      window.speechSynthesis.cancel();

      const utterance=new SpeechSynthesisUtterance(nextCue.text);
      utterance.lang='en-GB';
      utterance.rate=1.04;
      utterance.pitch=nextCue.speaker==='Strategy analyst'
        ?.93:1.05;

      window.speechSynthesis.speak(utterance);
    }
  },[
    frame,time,windowOffset,playing,
    playbackSpeed,selectedDriver,voiceEnabled,source
  ]);

  return <section
    aria-label="FastOne race commentary"
    style={{
      background:'#142233',
      border:'1px solid #3c5267',
      borderRadius:12,
      padding:16,
      margin:'14px 0',
      color:'#f4f7fb'
    }}
  >
    <div style={{marginBottom:14}}>
      <label style={{
        display:'block',
        fontSize:12,
        color:'#a7b8c8',
        marginBottom:6
      }}>
        Commentary source
      </label>
      <select
        value={source}
        onChange={e=>{
          stopSpeech();
          setSource(e.target.value as 'generated'|'broadcast');
        }}
        style={{
          background:'#263b50',
          color:'#fff',
          padding:'9px 12px',
          border:'1px solid #536a82',
          borderRadius:6
        }}
      >
        <option value="generated">FastOne generated commentary</option>
        <option value="broadcast">Original broadcast audio</option>
      </select>
    </div>

    <div style={{
      display:'flex',
      justifyContent:'space-between',
      gap:12,
      flexWrap:'wrap',
      alignItems:'center'
    }}>
      <div>
        <div style={{
          fontSize:11,
          letterSpacing:2,
          color:'#ff7656',
          fontWeight:800
        }}>
          FASTONE COMMENTARY · PROTOTYPE
        </div>
        <strong>{eventName}</strong>
      </div>

      {source==='generated'&&
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button
          type="button"
          aria-pressed={voiceEnabled}
          onClick={()=>setVoiceEnabled(value=>!value)}
          style={{
            padding:'8px 12px',
            background:voiceEnabled?'#e96845':'#263b50',
            color:'white',
            border:'1px solid #597087',
            borderRadius:6,
            cursor:'pointer'
          }}
        >
          {voiceEnabled?'🔊 Voice on':'🔇 Voice off'}
        </button>

        <button
          type="button"
          aria-pressed={captionsEnabled}
          onClick={()=>setCaptionsEnabled(value=>!value)}
          style={{
            padding:'8px 12px',
            background:'#263b50',
            color:'white',
            border:'1px solid #597087',
            borderRadius:6,
            cursor:'pointer'
          }}
        >
          {captionsEnabled?'Subtitles on':'Subtitles off'}
        </button>
      </div>}
    </div>

    {source==='broadcast'&&
      <BroadcastAudio
        time={time}
        windowOffset={windowOffset}
        playing={playing}
        playbackSpeed={playbackSpeed}
      />
    }

    {source==='generated'&&captionsEnabled&&
      <div
        aria-live="polite"
        style={{
          marginTop:14,
          background:'#0b1724',
          padding:14,
          borderRadius:8,
          minHeight:65
        }}
      >
        <div style={{
          color:'#8db5d2',
          fontSize:12,
          marginBottom:6
        }}>
          {cue?.speaker??'Commentary ready'}
        </div>
        <div>
          {cue?.text??(
            playing
              ?'Waiting for the next commentary cue…'
              :'Press Play to begin commentary.'
          )}
        </div>
      </div>
    }

    {source==='generated'&&<p style={{
      color:'#a7b8c8',
      fontSize:12,
      margin:'10px 0 0'
    }}>
      Generated narration based on replay state.
      Pit-lane indications may be inferred.
      Spoken audio is available at 1× playback speed.
      This is not original F1 broadcast commentary.
    </p>}
  </section>;
}
