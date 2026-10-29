import CommentaryPanel from './commentary/CommentaryPanel';
import PitStopIntro from './PitStopIntro';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
const HeritageMuseum=React.lazy(()=>import('./HeritageMuseum'));
const VehicleLibrary=React.lazy(()=>import('./VehicleLibrary'));
const DriverCareers=React.lazy(()=>import('./DriverCareers'));
import SiteShell,{useWorkspace} from './SiteShell';
const DriverShowcase=React.lazy(()=>import('./DriverShowcase'));
const CinematicHome=React.lazy(()=>import('./CinematicHome'));
const RaceEntryTransition=React.lazy(()=>import('./CinematicHome').then(m=>({default:m.RaceEntryTransition})));
const RecordedScene=React.lazy(()=>import('./RaceScenes').then(m=>({default:m.RecordedScene})));
const CircuitScene=React.lazy(()=>import('./RaceScenes').then(m=>({default:m.CircuitScene})));
import DeferredExperience from './DeferredExperience';
import {readScreen,screenUrl} from './navigation';
import type {Screen} from './navigation';
import {ReplaySource,advanceReplayClock} from './race/raceSources';
import type {Channels} from './race/raceSources';
import type {CarState} from './race/unifiedRaceState';
import RaceStateStatus from './race/RaceStateStatus';
const NewsDesk=React.lazy(()=>import('./NewsDesk'));
import PitWall from './PitWall';
import { matchGarageCar } from './GarageAssets';
import RaceViewing from './RaceViewing';
const DriverMedia=React.lazy(()=>import('./DriverMedia'));
const ForecastPage=React.lazy(()=>import('./ForecastPage'));
import { parseLapTime } from './strategyModel';
import type { RaceContext } from './strategyModel';
const StrategyWorkbench=React.lazy(()=>import('./StrategyWorkbench'));
const EngineeringShowcase=React.lazy(()=>import('./EngineeringShowcase'));
import { createRoot } from 'react-dom/client';
import './style.css';
import './professional.css';
import WeekendHub from './WeekendHub';
import PageBoundary from './PageBoundary';
import ReplayMoments from './ReplayMoments';
const PitCallChallenge=React.lazy(()=>import('./PitCallChallenge'));

type XY = [number, number];
type TrackResponse = {
  circuit?: string;
  session_key?: number;
  year: number;
  event: string;
  session: string;
  fastest_lap_driver: string;
  sample_count: number;
  coordinates: XY[];
};
type ReplaySample = { time: number; x: number; y: number; z: number };
type ReplayDriver = {
  driver_number: number;
  code: string;
  name: string;
  color: string;
  samples: ReplaySample[];
  sample_count: number;
};
type ReplayResponse = {
  round: number;
  track: TrackResponse;
  total_duration: number;
  window_start: number;
  window_start_utc: string;
  notice: string;
  session_key: number;
  event: string;
  year: number;
  duration: number;
  drivers: ReplayDriver[];
};

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

function HistoricalReplay({ onBack,year,round,eventName }: { onBack: () => void;year:number;round:number;eventName:string }) {
  const [data, setData] = useState<TrackResponse | null>(null);
  const [replay, setReplay] = useState<ReplayResponse | null>(null);
  const [channels,setChannels]=useState<Channels>({});
  const [error, setError] = useState('');
  const [replayError, setReplayError] = useState('');
  const [windowOffset,setWindowOffset]=useState(0);
  const [sessionDuration,setSessionDuration]=useState(0);
  const [loadRevision,setLoadRevision]=useState(0);
  const [loading, setLoading] = useState(true);
  const [followDriver, setFollowDriver] = useState<number | null>(null);
  const [replayTime, setReplayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [analyst,setAnalyst]=useState(false),[challengeOpen,setChallengeOpen]=useState(false),[tabVisible,setTabVisible]=useState(!document.hidden);
  useEffect(()=>{const change=()=>setTabVisible(!document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change);},[]);
  const replayDuration = replay?.duration ?? 0;
  const source=useMemo(()=>replay?new ReplaySource(replay,channels):null,[replay,channels]);
  const raceState=useMemo(()=>source?.frameAt(replayTime)??null,[source,replayTime]);
  const selectedDriver = raceState?.cars.find(d=>d.driverNumber===followDriver)??null;

  useEffect(() => {
    const controller=new AbortController();
    setLoading(true);setError('');setReplayError('');setReplay(null);setReplayTime(0);setChannels({});
    fetch(`/api/replay/multi?year=${year}&round=${round}&start=${windowOffset}`,{signal:controller.signal})
      .then(async response=>{const result=await response.json().catch(()=>({detail:response.status===404?'No recorded telemetry is available for this event yet. Race results and strategy planning remain available.':'Replay data could not be loaded. The provider may be temporarily unavailable; try again shortly.'}));if(!response.ok)throw Error(result.detail||'Replay unavailable');return result as ReplayResponse;})
      .then(result=>{if(controller.signal.aborted)return;setReplay(result);setData(result.track);setSessionDuration(result.total_duration);setReplayError(result.notice||'');if(!result.drivers.length)setPlaying(false);})
      .catch(error=>{if(!controller.signal.aborted)setError(error.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[year,round,windowOffset,loadRevision]);

  useEffect(() => {
    if (!playing || !tabVisible || replayDuration <= 0) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - previous) / 1000;
      previous = now;
      setReplayTime(current => advanceReplayClock(current,elapsed,playbackSpeed,replayDuration,false));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, playbackSpeed, replayDuration,tabVisible]);

  useEffect(()=>{if(replayDuration>0&&replayTime>=replayDuration)setPlaying(false);},[replayTime,replayDuration,playing]);

  const controlButton: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 6, background: '#263343', color: '#fff',
    border: '1px solid #46566c', cursor: 'pointer',
  };

  return (
    <div className="app">
      <header>
        <div className="logo"><span className="logo-mark">F1</span> STRATEGY <span className="muted">LAB</span></div>
        <span className="phase">RECORDED RACE TELEMETRY</span>
      </header>
      <div style={{ padding: '14px 24px 0' }}>
        <button onClick={onBack} style={{ background: '#263343', color: '#fff', border: '1px solid #58677c', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}>← All races</button>
      </div>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">INTERACTIVE RACE VISUALISATION</div>
            <h1>{eventName} <span>{year}</span></h1>
            <p>Recorded OpenF1 coordinates for the selected race. Load one-minute excerpts and move through its recorded timeline.</p>
          </div>
          <div className="tag">● THREE-DIMENSIONAL VIEW</div>
        </div>
        <details className="replay-analyst"><summary>Watch official footage ↗</summary><RaceViewing key={`${year}/${round}`} year={year} round={round} name={eventName} /></details>
        {sessionDuration>0&&<section style={{padding:16,background:'#151d28',border:'1px solid #35465f',borderRadius:10,marginBottom:18}}>
          <strong>Recorded window: {formatTime(windowOffset)}–{formatTime(Math.min(windowOffset+60,sessionDuration))}</strong><p style={{fontSize:13,color:'#aebed2'}}>Recorded timeline: {formatTime(sessionDuration)}. Each request loads up to 60 seconds for the drivers with available positions. Elapsed time is measured from the earliest recorded first-lap start (or the first usable lap if that timestamp is missing).</p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button style={controlButton} disabled={loading||windowOffset<=0} onClick={()=>setWindowOffset(t=>Math.max(0,t-60))}>← Previous minute</button><button style={controlButton} disabled={loading||windowOffset+60>=sessionDuration} onClick={()=>setWindowOffset(t=>t+60)}>Next minute →</button><label style={{fontSize:13,color:'#c5d4e8'}}>Jump to minute <select aria-label="Jump to recorded minute" style={controlButton} value={windowOffset} disabled={loading} onChange={event=>setWindowOffset(Number(event.target.value))}>{Array.from({length:Math.ceil(sessionDuration/60)},(_,i)=>i*60).map(offset=><option key={offset} value={offset}>{formatTime(offset)}–{formatTime(Math.min(offset+60,sessionDuration))}</option>)}</select></label></div>
        </section>}
        {replay && <button style={{...controlButton,marginBottom:16}} onClick={()=>document.getElementById('recorded-pitwall')?.scrollIntoView({behavior:'smooth',block:'start'})}>Open recorded pit wall ↓</button>}
        {loading&&<div className="fan-panel" role="status">Loading recorded track positions… First retrieval can take a minute.</div>}
        {error&&<div className="fan-panel" role="alert"><h2>This replay is unavailable.</h2><p>{error}</p><button onClick={()=>setLoadRevision(n=>n+1)}>Retry this event</button></div>}
        <div className="replay-view-toggle" role="group" aria-label="Replay presentation"><button aria-pressed={!analyst} onClick={()=>setAnalyst(false)}>Fan view</button><button aria-pressed={analyst} onClick={()=>setAnalyst(true)}>Analyst view · 3D & source detail</button></div>
        <div className={analyst?'replay-pro':'replay-fan'}>
        {replay && data && raceState && <PitWall frame={raceState} onChannels={setChannels} key={`pitwall/${year}/${round}/${windowOffset}`} year={year} round={round} offset={windowOffset} time={replayTime} drivers={replay.drivers} coordinates={data.coordinates} selected={followDriver} onSelect={setFollowDriver} duration={replayDuration} playing={playing} onTime={setReplayTime} onToggle={()=>{if(replayTime>=replayDuration){setReplayTime(0);setPlaying(true);}else setPlaying(p=>!p);}} />}
        </div>
        {replayDuration>0&&replayTime>=replayDuration&&<p role="status" className="fan-notice">End of this recorded excerpt. Restart it or load the next minute.</p>}
        {replay&&raceState&&
            <CommentaryPanel
              key={`${year}/${round}/${windowOffset}`}
              frame={raceState}
              time={replayTime}
              windowOffset={windowOffset}
              playing={playing&&tabVisible}
              playbackSpeed={playbackSpeed}
              selectedDriver={followDriver}
              eventName={eventName}
            />
          }
          {replay&&<ReplayMoments channels={channels} duration={replayDuration} offset={windowOffset} selected={followDriver??replay.drivers[0]?.driver_number??null} onSeek={time=>{setPlaying(false);setReplayTime(time);}}/>}
        {replay&&<div className="fan-panel"><span className="fan-kicker">YOUR TURN</span><h2>What would you call from the pit wall?</h2><p className="fan-muted">Pause the replay and try a separate educational strategy challenge.</p><button onClick={()=>{setPlaying(false);setChallengeOpen(v=>!v);}}>{challengeOpen?'Close challenge':'Pause & make a call →'}</button></div>}
        {challengeOpen&&<Suspense fallback={<p role="status">Loading challenge…</p>}><PitCallChallenge compact context={`${formatTime(windowOffset+replayTime)} in ${eventName} ${year}`}/></Suspense>}
        {analyst&&<>
        {raceState&&replay&&<RaceStateStatus key={`state/${year}/${round}/${windowOffset}`} frame={raceState} year={year} round={round} time={replayTime} driver={followDriver??replay.drivers[0]?.driver_number}/>}
        <div className="layout">
          <section className="panel track-panel">
            <div className="panel-head">
              <div><div className="eyebrow">{data?.circuit||eventName}</div><h2>3D race replay</h2></div>
              <span className="small">DRAG TO ORBIT · SCROLL TO ZOOM</span>
            </div>
            {loading && <div className="message" role="status">Loading recorded race data… First load may take a minute while the track and positions are retrieved.</div>}
            {error && <div className="message error"><p>{error}</p><button style={controlButton} onClick={()=>setLoadRevision(n=>n+1)}>Retry this event</button></div>}
            {data && (
              <div className="scene" aria-label="Interactive 3D circuit">
                {raceState&&<Suspense fallback={<p role="status">Loading the circuit renderer…</p>}><RecordedScene coordinates={data.coordinates} eventName={eventName} year={year} frame={raceState} selected={selectedDriver}/></Suspense>}
              </div>
            )}
            {replayError && <div className="message error">{replayError}</div>}
            {replay && (
              <div style={{ padding: 18, background: '#151d28', borderRadius: 12, marginTop: 12, color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  <strong>HISTORICAL RACE REPLAY</strong>
                  <span>{replay.drivers.length} DRIVERS · {eventName.toUpperCase()} {year}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <button style={{ ...controlButton, background: followDriver === null ? '#e5374b' : '#263343' }}
                    onClick={() => setFollowDriver(null)}>🌐 Circuit overview</button>
                  {replay.drivers.map(driver => (
                    <button key={driver.driver_number}
                      style={{ ...controlButton, borderColor: driver.color,
                        background: followDriver === driver.driver_number ? driver.color : '#263343' }}
                      onClick={() => setFollowDriver(driver.driver_number)}>Follow {driver.code}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                  {replay.drivers.map(driver => (
                    <span key={driver.driver_number} style={{ fontSize: 12 }}>
                      <span style={{ color: driver.color }}>● </span>{driver.code} #{driver.driver_number}
                    </span>
                  ))}
                </div>
                <input type="range" min={0} max={replayDuration} step={0.05} value={replayTime}
                  onChange={event => setReplayTime(Number(event.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }} aria-label="Race replay timeline" />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
                  <span>{formatTime(windowOffset+replayTime)}</span><span>{formatTime(windowOffset+replayDuration)} · excerpt end</span>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button style={controlButton} onClick={() => setReplayTime(0)}>↺ Restart</button>
                  <button style={controlButton} onClick={() => setPlaying(p => !p)}>{playing ? '⏸ Pause' : '▶ Play'}</button>
                  <button style={controlButton} onClick={() => setReplayTime(t => Math.max(0, t - 5))}>−5s</button>
                  <button style={controlButton} onClick={() => setReplayTime(t => Math.min(replayDuration, t + 5))}>+5s</button>
                  <select value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}
                    aria-label="Replay speed" style={{ ...controlButton }}>
                    <option value={1}>1×</option><option value={2}>2×</option>
                    <option value={5}>5×</option><option value={10}>10×</option>
                  </select>
                </div>
              </div>
            )}
            <div className="foot">POSITION SAMPLES <strong>{data?.sample_count ?? '—'}</strong>
              <span> • </span> HISTORICAL MULTI-CAR REPLAY</div>
          </section>
          <aside className="panel details">
            <div className="eyebrow">SESSION INFORMATION</div><h2>Race data</h2>
            {replay && (
              <div style={{ margin: '20px 0' }}>
                <div className="eyebrow">DRIVER TRACKING</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: 12, color: '#a8b5c5' }}>
                  <span>DRIVER</span><span>TELEMETRY</span>
                </div>
                {replay.drivers.map(driver => {
                  const active = !!raceState?.cars.find(c=>c.driverNumber===driver.driver_number)?.pose;
                  return (
                    <button key={driver.driver_number} onClick={() => setFollowDriver(driver.driver_number)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px',
                        marginBottom: 5, textAlign: 'left', color: '#fff', cursor: 'pointer',
                        background: followDriver === driver.driver_number ? '#283444' : '#161f2a',
                        border: 0, borderLeft: `4px solid ${driver.color}`, borderRadius: 5 }}>
                      <strong style={{ color: driver.color }}>{driver.code}</strong>
                      <span style={{ flex: 1, fontSize: 13 }}>{driver.name}</span>
                      <span style={{ fontSize: 11, color: active ? '#58ddb0' : '#a8b5c5' }}>
                        {active ? '● TRACKED' : '— NO SAMPLE'}
                      </span>
                    </button>
                  );
                })}
                <div style={{ marginTop: 12, fontSize: 12, color: '#a8b5c5' }}>
                  Recorded elapsed: {formatTime(windowOffset+replayTime)}
                </div>
              </div>
            )}
            <div className="stat"><span>Event</span><b>{data?.event ?? '—'}</b></div>
            <div className="stat"><span>Season</span><b>{data?.year ?? '—'}</b></div>
            <div className="stat"><span>Session</span><b>{data?.session ?? '—'}</b></div>
            <div className="stat"><span>Reference lap</span><b>{data?.fastest_lap_driver ?? '—'}</b></div>
            <div className="note">Track and driver positions use recorded OpenF1 X/Y samples.
              Position samples are approximate; lateral racing lines and real track elevation are not reconstructed. Road width, lighting and stylised car models are illustrative; the driver list is tracking status, not official race order.</div>
          </aside>
        </div>

        </>}
      </main>
    </div>
  );
}



type CalendarRace = {
  meeting_key: number;
  round: number;
  name: string;
  circuit: string;
  location: string;
  country: string;
  start: string;
  end: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
  replay_ready: boolean;
};
type CalendarResult = { season: number; races: CalendarRace[] };
const panelStyle: React.CSSProperties = {
  border: '1px solid #273347', background: '#151c28', borderRadius: 16, padding: 20,
};
function formatRaceDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(value));
}
function RaceBrowser({ onCircuit, onGarage, onReplay, onRace, onDrivers, onStrategy, onPlanRace, onForecast }: { onCircuit:(year:number,round:number,name:string)=>void; onGarage:(year:number,round:number)=>void; onForecast:(year:number,round:number,name:string)=>void; onPlanRace:(race:RaceContext)=>void; onStrategy: () => void; onReplay: (year:number,round:number,name:string) => void; onRace: (year: number, round: number) => void; onDrivers: () => void }) {
  const currentYear = new Date().getFullYear();
  const workspace=useWorkspace();
  const year=workspace.year;
  const setYear=workspace.selectYear;
  const [races, setRaces] = useState<CalendarRace[]>([]);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'upcoming'>('all');
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    setRaces([]);
    setSelectedKey(null);
    fetch(`/api/archive/season?year=${year}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(`Calendar API returned HTTP ${r.status}`);
        return r.json() as Promise<CalendarResult>;
      })
      .then(data => {
        if (controller.signal.aborted) return;
        setRaces(data.races);
        const next = data.races.find(r => r.status === 'upcoming') ?? data.races[data.races.length - 1];
        setSelectedKey(next?.meeting_key ?? null);
      })
      .catch(err => { if (!controller.signal.aborted) setError(String(err)); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [year]);

  useEffect(()=>{const match=races.find(r=>r.round===workspace.selected?.round);if(match)setSelectedKey(match.meeting_key);},[races,workspace.selected?.round]);
  const selected = races.find(r => r.meeting_key === selectedKey) ?? null;
  const nextRace = races.find(r => r.status === 'upcoming') ?? null;
  const visible = races.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const seasons = Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i);

  return (
    <div className="app">
      <header>
        <div className="logo"><span className="logo-mark">F1</span> STRATEGY <span className="muted">LAB</span></div>
        <span className="phase">RACE ARCHIVE · DRIVER STATISTICS</span>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">RACE CALENDAR · HISTORICAL REPLAYS</div>
            <h1>Race Intelligence <span>{year}</span></h1>
            <p>Browse the current championship and previous seasons. Replay data is added as it becomes available.</p>
          </div>
          <div className="tag">● SEASON BROWSER</div>
        </div>
        <NewsDesk />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
          <button onClick={onStrategy} style={{ background: '#247b74', color: 'white', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>Strategy workbench</button><button onClick={onDrivers} style={{ background: '#e63850', color: 'white', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}>🏁 All-time drivers</button><label htmlFor="season" style={{ color: '#cbd5e1' }}>Season</label>
          <select id="season" value={year} onChange={e => setYear(Number(e.target.value))}
            style={{ background: '#1b2838', color: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #42526b' }}>
            {seasons.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(['all', 'completed', 'upcoming'] as const).map(filter => (
            <button key={filter} onClick={() => setStatusFilter(filter)} style={{
              padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
              color: '#fff', border: '1px solid #42526b',
              background: statusFilter === filter ? '#cc3045' : '#1b2838',
            }}>{filter === 'all' ? 'All races' : filter === 'completed' ? 'Completed' : 'Upcoming'}</button>
          ))}
        </div>
        {busy && <div className="message">Loading {year} race calendar…</div>}
        {error && <div className="message error">{error}. Check that the FastAPI backend is running.</div>}
        {!busy && !error && races.length === 0 && <div className="message">No calendar entries published for this season yet.</div>}
        {!!nextRace && (
          <div style={{ ...panelStyle, marginBottom: 20, borderColor: '#c33a55' }}>
            <div className="eyebrow">NEXT SCHEDULED GRAND PRIX</div>
            <h2 style={{ margin: '10px 0' }}>{nextRace.name}</h2>
            <p style={{ color: '#cbd5e1', margin: 0 }}>{nextRace.circuit} · {nextRace.country} · Weekend starts {formatRaceDate(nextRace.start)}</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1.15fr) minmax(270px, 1fr)', gap: 18 }}>
          <section style={panelStyle}>
            <div className="eyebrow">{year} GRAND PRIX CALENDAR · {visible.length} EVENTS</div>
            <div style={{ display: 'grid', gap: 8, marginTop: 14, maxHeight: 590, overflowY: 'auto' }}>
              {visible.map((race, i) => (
                <button key={race.meeting_key} onClick={() => {setSelectedKey(race.meeting_key);workspace.selectRound(race.round);}}
                  style={{ cursor: 'pointer', textAlign: 'left', padding: 13, borderRadius: 9,
                    border: race.meeting_key === selectedKey ? '1px solid #e63850' : '1px solid #303d50',
                    background: race.meeting_key === selectedKey ? '#2e2533' : '#1b2635', color: '#fff' }}>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{String(i + 1).padStart(2, '0')} · {formatRaceDate(race.start)}</span>
                  <div style={{ fontWeight: 750, margin: '5px 0' }}>{race.name}</div>
                  <span style={{ fontSize: 12, color: '#aebed2' }}>{race.circuit} · {race.status.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </section>
          <aside style={{ ...panelStyle, alignSelf: 'start' }}>
            {selected ? <>
              <div className="eyebrow">SELECTED GRAND PRIX</div>
              <h2 style={{ margin: '12px 0' }}>{selected.name}</h2>
              <div className="stat"><span>Season</span><b>{year}</b></div>
              <div className="stat"><span>Location</span><b>{selected.location || selected.country}</b></div>
              <div className="stat"><span>Circuit</span><b>{selected.circuit}</b></div>
              <div className="stat"><span>Weekend begins</span><b>{formatRaceDate(selected.start)}</b></div>
              <div className="stat"><span>Status</span><b>{selected.status.replace('_', ' ')}</b></div>
              <button style={{...navigationButton,width:'100%',marginTop:16}} onClick={()=>onForecast(year,selected.round,selected.name)}>AI race forecast →</button>
              <button style={{...navigationButton,width:'100%',marginTop:16}} onClick={()=>onPlanRace({season:year,round:selected.round,name:selected.name,circuit:selected.circuit,date:selected.start.slice(0,10)})}>Plan this Grand Prix →</button>
              <button style={{...navigationButton,width:'100%',marginTop:16}} onClick={()=>onCircuit(year,selected.round,selected.name)}>🌤️ Explore circuit preview</button>
              {selected.status==='completed'&&<button style={{...navigationButton,width:'100%',marginTop:16}} onClick={()=>onGarage(year,selected.round)}>🏎️ Explore this race’s 3D garage</button>}
              {selected.status === 'completed' && (
                <button onClick={() => onRace(year, selected.round)} style={{ width: '100%', background: '#2674b8', color: '#fff', padding: 14, border: 0, borderRadius: 9, fontWeight: 800, cursor: 'pointer', marginTop: 16 }}>🏆 View complete race results</button>
              )}
              <RaceViewing key={`${year}/${selected.round}`} year={year} round={selected.round} name={selected.name} completed={selected.status==='completed'} />
              {year>=2023&&selected.status==='completed' ? (
                <button onClick={()=>onReplay(year,selected.round,selected.name)} style={{ width: '100%', background: '#ed4055', color: '#fff',
                  padding: 14, border: 0, borderRadius: 9, fontWeight: 800, cursor: 'pointer', marginTop: 18 }}>
                  ▶ Load recorded 3D replay
                </button>
              ) : (
                <div className="note" style={{ marginTop: 18 }}>
                  {selected.status === 'upcoming' ? 'Replay can be checked after the race has ended and historical telemetry is available.'
                    : 'Race results are available. The position-telemetry archive starts in 2023, so this older event has no recorded 3D replay in the current source.'}
                </div>
              )}
            </> : <p>Select a Grand Prix to view details.</p>}
          </aside>
        </div>
      </main>
    </div>
  );
}
type DriverInfo = { id: string; given_name: string; family_name: string; name: string; nationality?: string; birth_date?: string; number?: string; code?: string; info_url?: string };
type DriverDirectory = { drivers: DriverInfo[]; total: number; page: number };
type RaceDetail = { season: number; round: number; name: string; date: string; circuit: string; location: { locality?: string; country?: string }; winner: RaceRow | null; results: RaceRow[] };
type RaceRow = { position: string; driver: DriverInfo; constructor: string; grid: string; laps: string; status: string; time?: string; points: string; fastest_lap?: string };
type DriverProfile = { driver: DriverInfo; stats: { classified_results: number; wins: number; podiums: number; qualifying_poles_recorded: number }; recent_results: { season: number; round: number; race: string; date: string; position: string; constructor: string; points: string }[]; limitations: string };
const navigationButton: React.CSSProperties = { background: '#243348', color: '#fff', border: '1px solid #42526b', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' };

function ContentShell({ title, caption, onBack, children }: { title: string; caption: string; onBack: () => void; children: React.ReactNode }) {
  return <div className="app"><header><div className="logo"><span className="logo-mark">F1</span> STRATEGY <span className="muted">LAB</span></div><span className="phase">F1 RACE INTELLIGENCE · ARCHIVE</span></header>
    <main><button onClick={onBack} style={{ ...navigationButton, marginBottom: 22 }}>← Back</button><div className="intro"><div><div className="eyebrow">{caption}</div><h1>{title}</h1></div></div>{children}</main></div>;
}
function useRemote<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setLoading(true); setError('');
    fetch(url, { signal: controller.signal }).then(async r => {
      if (!r.ok) { const detail = await r.json().catch(() => ({})) as { detail?: string }; throw new Error(detail.detail || `API returned HTTP ${r.status}`); }
      return r.json() as Promise<T>;
    }).then(d => { if (!controller.signal.aborted) setData(d); })
      .catch(e => { if (!controller.signal.aborted) setError(String(e.message)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [url]);
  return { data, error, loading };
}

function RaceResults({ year, round, onBack, onDriver, onReplay, onPlanRace, onGarage }: { onGarage:(year:number,round:number)=>void; onPlanRace:(race:RaceContext)=>void; year: number; round: number; onBack: () => void; onDriver: (id: string) => void; onReplay: (year:number,round:number,name:string) => void }) {
  const { data, loading, error } = useRemote<RaceDetail>(`/api/archive/race/${year}/${round}`);
  const winner = data?.winner;
  return <ContentShell title={data?.name || `${year} · Round ${round}`} caption={`RACE RESULTS · ${year} · ROUND ${round}`} onBack={onBack}>
    {loading && <div className="message">Loading official race classification…</div>}
    {error && <div className="message error">{error}</div>}
    {data && <>
      <div style={{ ...panelStyle, marginBottom: 18 }}><div className="eyebrow">{data.circuit} · {data.date} · {data.location.country || ''}</div>
        {winner && <><h2 style={{ margin: '12px 0 4px' }}>🏆 Winner: {winner.driver.name}</h2><p style={{ color: '#bbc8d9' }}>{winner.constructor} · {winner.laps} laps · {winner.time || winner.status}</p><button style={navigationButton} onClick={() => onDriver(winner.driver.id)}>View winner's career profile →</button></>}
        <button style={{...navigationButton,marginTop:12}} onClick={()=>onPlanRace({season:data.season,round:data.round,name:data.name,circuit:data.circuit,date:data.date,recordedLaps:winner&&Number.isInteger(Number(winner.laps))&&Number(winner.laps)>0?Number(winner.laps):undefined,fastestLapSeconds:parseLapTime(winner?.fastest_lap)})}>Compare strategies for this race →</button>
        <button style={{...navigationButton,marginTop:12}} onClick={()=>onGarage(year,round)}>🏎️ Explore this race’s 3D garage</button>
        {year>=2023&&<button style={{...navigationButton,marginLeft:12}} onClick={()=>onReplay(year,round,data.name)}>▶ Load recorded 3D replay</button>}
      </div>
      <RaceViewing key={`${year}/${round}`} year={year} round={round} name={data.name} />
      <section style={{ ...panelStyle, overflowX: 'auto' }}><div className="eyebrow">FULL RACE CLASSIFICATION · {data.results.length} DRIVERS</div>
        <table style={{ width: '100%', marginTop: 16, borderCollapse: 'collapse', color: '#e8edf4', minWidth: 610 }}>
          <thead><tr>{['POS','DRIVER','TEAM','GRID','LAPS','TIME / STATUS','PTS'].map(h => <th key={h} style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #46546a', fontSize: 12 }}>{h}</th>)}</tr></thead>
          <tbody>{data.results.map((row, i) => <tr key={`${row.driver.id}-${i}`} style={{ borderBottom: '1px solid #273347' }}>
            <td style={{ padding: '11px 8px' }}>{row.position}</td><td><button onClick={() => onDriver(row.driver.id)} style={{ border: 0, color: '#80bcff', background: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: 700 }}>{row.driver.name}</button></td>
            <td>{row.constructor}</td><td>{row.grid}</td><td>{row.laps}</td><td>{row.time || row.status}</td><td>{row.points}</td>
          </tr>)}</tbody>
        </table><p style={{ color: '#9caabd', fontSize: 12 }}>Classification, gaps and points are provided by Jolpica. Retirements show a status in place of a finishing time.</p>
      </section>
    </>}
  </ContentShell>;
}

type CircuitPreviewData=TrackResponse&{requested_year:number;requested_round:number;requested_event:string;requested_date:string;reference_year:number;reference_round:number;reference_date:string;reference_event:string;limitations:string};
function CircuitPreviewPage({year,round,name,onBack,onPlan}:{year:number;round:number;name:string;onBack:()=>void;onPlan:(race:RaceContext)=>void}){
 const [expanded,setExpanded]=useState(false);
 useEffect(()=>{if(!expanded)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setExpanded(false);};window.addEventListener('keydown',close);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',close);};},[expanded]);
 const [retry,setRetry]=useState(0);
 const {data,loading,error}=useRemote<CircuitPreviewData>(`/api/track?preview_year=${year}&preview_round=${round}&retry=${retry}`);
 const [daylight,setDaylight]=useState(true),[rotation,setRotation]=useState(false);
 const [cameraView,setCameraView]=useState<'overview'|'low'>('overview');
 const [cameraRevision,setCameraRevision]=useState(0);
 return <ContentShell title={`${name} · ${year}`} caption="CIRCUIT PREVIEW · HISTORICAL LAYOUT REFERENCE" onBack={onBack}>
  <p style={{color:'#c3d2e5'}}>Explore the venue before race day. This is a circuit inspection, with no predicted cars, race positions or results.</p>
  {loading&&<p role="status">Finding a recorded layout for this circuit… First load can take a minute.</p>}
  {error&&<div role="alert" className="message error"><p>{error}</p><button style={navigationButton} onClick={()=>setRetry(n=>n+1)}>Retry circuit preview</button></div>}
  {data&&<>
   <div style={{...panelStyle,marginBottom:14}}><strong>Layout reference: {data.reference_event}, {data.reference_year}</strong><p style={{color:'#b8c8db'}}>Recorded {data.reference_date} · {data.circuit} · source: OpenF1 lap positions. {data.limitations}</p></div>
   <section style={expanded?{position:'fixed',inset:12,zIndex:10000,background:'#101923',padding:16,borderRadius:12,overflowY:'auto'}:{}}>{expanded&&<><h2 style={{margin:'0 0 8px'}}>{name} · circuit preview</h2><p style={{fontSize:12}}>Historical reference: {data.reference_year}. Flat terrain and illustrative surroundings.</p></>}
   <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}><button style={navigationButton} aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'Close expanded circuit':'Expand circuit viewer'}</button><button style={navigationButton} onClick={()=>setDaylight(v=>!v)}>{daylight?'Daylight study':'Dusk study'}</button><button aria-pressed={rotation} style={navigationButton} onClick={()=>setRotation(v=>!v)}>Auto orbit: {rotation?'On':'Off'}</button><button style={navigationButton} onClick={()=>{setCameraView('overview');setCameraRevision(n=>n+1);}}>Circuit overview</button><button style={navigationButton} onClick={()=>{setCameraView('low');setCameraRevision(n=>n+1);}}>Low inspection view</button><button style={navigationButton} onClick={()=>onPlan({season:year,round,name,circuit:data.circuit||name,date:data.requested_date})}>Plan this event →</button></div>
   <div style={{height:expanded?'calc(100vh - 175px)':'min(70vh,650px)',minHeight:360,borderRadius:14,overflow:'hidden'}} aria-label="Historical circuit layout preview"><Suspense fallback={<p role="status">Loading circuit renderer…</p>}><CircuitScene coordinates={data.coordinates} eventName={name} year={year} daylight={daylight} low={cameraView==='low'} revision={cameraRevision} rotation={rotation}/></Suspense></div>
   </section>
   <p style={{fontSize:13,color:'#aebed2'}}>Drag to orbit and scroll to zoom. Lighting is a visual study, not a weather forecast. The lap outline is recorded; terrain is flat and safety furniture is illustrative. This is not a surveyed or photorealistic model of the venue.</p>
  </>}
 </ContentShell>;
}


function RaceGarage({year,round,initialDriver,onBack,onDriver}:{year:number;round:number;initialDriver?:string;onBack:()=>void;onDriver:(id:string)=>void}) {
 const {data,loading,error}=useRemote<RaceDetail>(`/api/archive/race/${year}/${round}`);
 const [driverId,setDriverId]=useState(initialDriver||'');
 const [filter,setFilter]=useState('');
 const selected=data?.results.find(row=>row.driver.id===driverId)||data?.results[0];
 const count=data?.results.filter(row=>matchGarageCar(row.driver.id,row.constructor,year)).length||0;
 return <ContentShell title={`${year} · Race garage`} caption={data?`${data.name} · round ${round}`:'LOADING RACE GARAGE'} onBack={onBack}>
  {loading&&<p role="status">Loading this race’s driver and team entries…</p>}
  {error&&<p role="alert">{error}</p>}
  {data&&<><p style={{color:'#c1d1e5'}}>{count} of {data.results.length} entries have a matching team-and-season car representation. Other entries use the engineering concept. Original liveries may carry another driver’s number; all standing figures are study models unless explicitly identified.</p>
   <label style={{display:'block',marginBottom:12}}>Find a driver or team <input aria-label="Find a garage driver or team" value={filter} onChange={e=>setFilter(e.target.value)} style={{...navigationButton,marginLeft:10}} placeholder="Driver or team"/></label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:18}}>{data.results.filter(row=>`${row.driver.name} ${row.constructor}`.toLowerCase().includes(filter.toLowerCase())).map(row=><button key={row.driver.id} aria-pressed={row===selected} style={{...navigationButton,borderColor:row===selected?'#ec4055':'#42526b',textAlign:'left'}} onClick={()=>setDriverId(row.driver.id)}><strong>{row.driver.name}</strong><br/><small>{row.constructor} · {matchGarageCar(row.driver.id,row.constructor,year)?'Matching car installed':'Concept car'}</small></button>)}</div>
   {data.results.filter(row=>`${row.driver.name} ${row.constructor}`.toLowerCase().includes(filter.toLowerCase())).length===0&&<p>No drivers or teams match.</p>}
   {selected&&<><EngineeringShowcase key={`${year}/${selected.driver.id}`} driverName={selected.driver.name} driverId={selected.driver.id} teamName={selected.constructor} driverNumber={selected.driver.number} season={year}/><button style={navigationButton} onClick={()=>onDriver(selected.driver.id)}>View {selected.driver.name}’s photos and career →</button></>}
  </>}
 </ContentShell>;
}

function DriverDirectoryPage({onBack,onDriver}:{onBack:()=>void;onDriver:(id:string)=>void}){const [scope,setScope]=useState<'grid'|'all'>('grid');const w=useWorkspace();return <><div className="directory-switch" role="group" aria-label="Driver directory collection"><button aria-pressed={scope==='grid'} onClick={()=>setScope('grid')}>{w.year} recorded grid</button><button aria-pressed={scope==='all'} onClick={()=>setScope('all')}>All-time archive</button></div>{scope==='all'?<AllTimeDriverDirectoryPage onBack={onBack} onDriver={onDriver}/>:<ContentShell title={`${w.year} · Meet the grid`} caption="DRIVER DIRECTORY / SELECTED SEASON" onBack={onBack}>{w.loading?<p role="status">Finding the latest recorded grid…</p>:w.latest?<RecordedGrid key={`${w.year}/${w.latest.round}`} year={w.year} round={w.latest.round} onDriver={onDriver}/>:<p className="fan-muted">No completed race entries are available for this season yet. Choose the all-time archive or another season.</p>}</ContentShell>}</>;}
function RecordedGrid({year,round,onDriver}:{year:number;round:number;onDriver:(id:string)=>void}){const {data,loading,error}=useRemote<RaceDetail>(`/api/archive/race/${year}/${round}`);return <>{loading&&<p role="status">Loading the race entry list…</p>}{error&&<p role="alert">{error}</p>}{data&&<><p className="fan-muted">Entries from {data.name}, {data.date}. A recorded grid, not a claim about future seats.</p><div className="directory-grid">{data.results.map(row=><button key={row.driver.id} onClick={()=>onDriver(row.driver.id)}><span>{row.constructor}</span><strong>{row.driver.name}</strong><small>#{row.driver.number||'—'} · {row.driver.nationality} ↗</small></button>)}</div></>}</>;}

function AllTimeDriverDirectoryPage({ onBack, onDriver }: { onBack: () => void; onDriver: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const { data, error, loading } = useRemote<DriverDirectory>(`/api/archive/drivers?page=${page}&search=${encodeURIComponent(query)}`);
  return <ContentShell title="All-time F1 drivers" caption="WORLD CHAMPIONSHIP · 1950 TO PRESENT" onBack={onBack}>
    <form onSubmit={e => { e.preventDefault(); setPage(0); setQuery(search.trim()); }} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
      <input aria-label="Search drivers" placeholder="Search e.g. Senna, Hamilton, Schumacher" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0, background: '#1b2838', color: 'white', border: '1px solid #42526b', borderRadius: 8, padding: 12 }}/>
      <button type="submit" style={navigationButton}>Search</button>
      {query && <button type="button" style={navigationButton} onClick={() => { setQuery(''); setSearch(''); setPage(0); }}>Clear</button>}
    </form>
    <section style={panelStyle}>
      {loading && <div className="message">Loading driver records… Searches may take longer the first time.</div>}
      {error && <div className="message error">{error}</div>}
      {data && <><p style={{ color: '#aebed2' }}>{data.total} driver records {query ? `matching “${query}”` : 'in the archive'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {data.drivers.map(d => <button key={d.id} style={{ ...navigationButton, textAlign: 'left', padding: 15 }} onClick={() => onDriver(d.id)}>
            <strong>{d.name}</strong><div style={{ color: '#aebed2', fontSize: 12, marginTop: 5 }}>{d.nationality || 'Nationality unavailable'} · {d.birth_date || 'Date not recorded'}</div>
          </button>)}
        </div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button style={navigationButton} disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Previous</button>
          <span>Page {page + 1}</span>
          <button style={navigationButton} disabled={(page + 1) * (query ? 40 : 40) >= data.total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div></>}
    </section>
  </ContentShell>;
}


function DriverHero({driverName,driverId}:{driverName:string;driverId:string}) {
 const [imageOK,setImageOK]=useState(true);
 useEffect(()=>setImageOK(true),[driverId]);
 const image=`/images/driver-hero/${encodeURIComponent(driverId)}.jpg`;
 return <section style={{position:'relative',height:330,overflow:'hidden',borderRadius:17,marginBottom:18,
 background:'radial-gradient(ellipse at 65% 90%, #334452 0%, #131f30 44%, #080e17 100%)',border:'1px solid #30405a'}}>
  {imageOK&&<img src={image} onError={()=>setImageOK(false)} alt={`${driverName} racing on circuit`} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center 52%'}}/>}
  {!imageOK&&<div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,transparent 10%,#182b3d 80%),repeating-linear-gradient(-11deg,transparent 0 38px,#1d354477 40px 42px)'}}/>}
  <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,#080e18ee 0%,#080e1877 45%,transparent 100%)'}}/>
  <div style={{position:'absolute',bottom:24,left:24,right:24,color:'#fff',textShadow:'0 2px 7px #000'}}>
   <div style={{fontSize:12,letterSpacing:3,color:'#a8e7e3'}}>F1 STRATEGY LAB · DRIVER FILE</div>
   <h2 style={{fontSize:'clamp(26px,4vw,46px)',margin:'8px 0'}}>{driverName}</h2>
   <div style={{fontSize:13,color:'#d1dfed'}}>{imageOK?'Trackside profile photograph':'Add a licensed track image to customise this driver profile'}</div>
  </div>
 </section>;
}

function DriverProfilePage({ id, onBack, onRace }: { id: string; onBack: () => void; onRace: (year: number, round: number) => void }) {
  const { data, loading, error } = useRemote<DriverProfile>(`/api/archive/driver/${encodeURIComponent(id)}`);
  return <ContentShell title={data?.driver.name || 'Driver profile'} caption="DRIVER CAREER · STATISTICS" onBack={onBack}>
    {loading && <div className="message">Loading career statistics…</div>}
    {error && <div className="message error">{error}</div>}
    {data && <><a className="career-profile-link" href={screenUrl({type:'careers',id})}>Explore the full career, achievements & milestones ↗</a><DriverMedia id={id} name={data.driver.name}/><section style={{ ...panelStyle, marginBottom: 18 }}>
      <div className="eyebrow">{data.driver.nationality || 'Nationality unavailable'} · Born {data.driver.birth_date || 'Not recorded'}</div>
      <h2 style={{ margin: '12px 0' }}>{data.driver.name} {data.driver.code ? `(${data.driver.code})` : ''}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12 }}>
        {([{ key: 'classified_results', label: 'Race result records' }, { key: 'wins', label: 'Race victories' }, { key: 'podiums', label: 'Podium finishes' }, { key: 'qualifying_poles_recorded', label: 'Recorded qualifying poles' }] as const).map(s =>
          <div key={s.key} style={{ background: '#202d3f', padding: 16, borderRadius: 8 }}><div style={{ color: '#aebed2', fontSize: 12 }}>{s.label}</div><h2 style={{ fontSize: 28, margin: '9px 0 0' }}>{data.stats[s.key]}</h2></div>)}
      </div><p style={{ color: '#aebed2', fontSize: 12 }}>{data.limitations}</p>
      {data.driver.info_url?.startsWith('https://') && <a href={data.driver.info_url} target="_blank" rel="noreferrer" style={{ color: '#80bcff' }}>Additional biographical information ↗</a>}
    </section>
    <EngineeringShowcase driverName={data.driver.name} driverId={id} teamName={data.recent_results[0]?.constructor} driverNumber={data.driver.number} season={data.recent_results[0]?.season} />
    <section style={panelStyle}><h2>Recent Grand Prix results</h2>
      {data.recent_results.length === 0 && <p>No race results returned.</p>}
      {data.recent_results.map((r, i) => <button key={`${r.season}-${r.round}-${i}`} style={{ ...navigationButton, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 8 }} onClick={() => onRace(r.season, r.round)}>
        <span><strong>{r.race}</strong><br/><span style={{ color: '#aebed2', fontSize: 12 }}>{r.season} · {r.constructor}</span></span>
        <strong>P{r.position} →</strong>
      </button>)}
    </section></>}
  </ContentShell>;
}

function App() {
  const [screen, updateScreen] = useState<Screen>(()=>readScreen(window.location.hash));
  const [entryTarget,setEntryTarget]=useState<Screen|null>(null);
  const [effects,setEffects]=useState(()=>localStorage.getItem('ri-effects')!=='off');
  const entered=useRef(false);
  const setScreen=(next:Screen)=>{updateScreen(next);if(window.location.hash!==screenUrl(next))window.location.hash=screenUrl(next);};
  useEffect(()=>{const change=()=>{if(window.location.hash!=='#page-content')updateScreen(readScreen(window.location.hash));};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
  const [previous, setPrevious] = useState<Screen>({ type: 'calendar' });
  const open = (next: Screen) => { setPrevious(screen);if(screen.type==='home'&&['calendar','replay','race','circuit'].includes(next.type)&&effects&&!entered.current&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){entered.current=true;setEntryTarget(next);}else setScreen(next); };
  const finishEntry=()=>{if(entryTarget)setScreen(entryTarget);setEntryTarget(null);};
  const back = () => setScreen(previous.type === screen.type ? { type: 'calendar' } : previous);
  function renderScreen(){
  if(screen.type==='challenge')return <PitCallChallenge onNavigate={open}/>;
  if(screen.type==='home')return <main className="homepage"><WeekendHub onNavigate={open}/><DeferredExperience title="Explore the machine"><Suspense fallback={<div className="page-loading" role="status">Preparing the interactive car…</div>}><CinematicHome onNavigate={open} effects={effects} onEffects={value=>{setEffects(value);localStorage.setItem('ri-effects',value?'on':'off');}}/></Suspense></DeferredExperience><DeferredExperience title="Meet the grid"><Suspense fallback={<div className="page-loading" role="status">Preparing the driver showcase…</div>}><DriverShowcase onNavigate={open}/></Suspense></DeferredExperience></main>;
  if(screen.type==='library'||screen.type==='personal-garage')return <VehicleLibrary key={screen.type} personal={screen.type==='personal-garage'}/>;
  if(screen.type==='museum')return <HeritageMuseum key={`${screen.section}/${screen.id}`} section={screen.section} initialCar={screen.id} onNavigate={open}/>;
  if(screen.type==='careers')return <DriverCareers initialId={screen.id} onNavigate={open}/>;
  if(screen.type==='news')return <main className="newsroom-page"><div className="edition-label">PADDOCK / NEWS & RADIO</div><h1>THE LATEST LAP.</h1><NewsDesk/></main>;
  if (screen.type === 'circuit') return <CircuitPreviewPage key={`${screen.year}/${screen.round}`} year={screen.year} round={screen.round} name={screen.name} onBack={()=>setScreen({type:'calendar'})} onPlan={race=>open({type:'strategy',race})}/>;
  if (screen.type === 'garage') return <RaceGarage key={`${screen.year}/${screen.round}/${screen.driver}`} initialDriver={screen.driver} year={screen.year} round={screen.round} onBack={()=>setScreen({type:'calendar'})} onDriver={id=>open({type:'driver',id})}/>;
  if (screen.type === 'forecast') return <ForecastPage key={`${screen.year}/${screen.round}`} year={screen.year} round={screen.round} name={screen.name} onBack={()=>setScreen({type:'calendar'})} onDriver={id=>open({type:'driver',id})}/>;
  if (screen.type === 'strategy') return <StrategyWorkbench key={`${screen.race?.season}/${screen.race?.round}`} race={screen.race} onBack={() => setScreen({ type: 'calendar' })}/>;
  if (screen.type === 'replay') return <HistoricalReplay key={`${screen.year}-${screen.round}`} year={screen.year} round={screen.round} eventName={screen.name} onBack={() => setScreen({ type: 'calendar' })}/>;
  if (screen.type === 'race') return <RaceResults onGarage={(year,round)=>open({type:'garage',year,round})} onPlanRace={race=>open({type:'strategy',race})} year={screen.year} round={screen.round} onBack={back} onDriver={id => open({ type: 'driver', id })} onReplay={(year,round,name)=>open({type:'replay',year,round,name})}/>;
  if (screen.type === 'drivers') return <DriverDirectoryPage onBack={back} onDriver={id => open({ type: 'driver', id })}/>;
  if (screen.type === 'driver') return <DriverProfilePage id={screen.id} onBack={back} onRace={(year, round) => open({ type: 'race', year, round })}/>;
  return <RaceBrowser onCircuit={(year,round,name)=>open({type:'circuit',year,round,name})} onGarage={(year,round)=>open({type:'garage',year,round})} onForecast={(year,round,name)=>open({type:'forecast',year,round,name})} onPlanRace={race=>open({type:'strategy',race})} onStrategy={() => open({ type: 'strategy' })} onReplay={(year,round,name)=>open({type:'replay',year,round,name})} onRace={(year, round) => open({ type: 'race', year, round })} onDrivers={() => open({ type: 'drivers' })}/>;
  }
  return <SiteShell screen={screen} onSelectRace={next=>{setPrevious(screen);setScreen(next);}} onNavigate={open} blocked={!!entryTarget}><div inert={!!entryTarget}><PageBoundary key={screen.type}><Suspense fallback={<div className="page-loading" role="status"><span className="fan-kicker">FASTONE LABS</span><h1>Opening your next experience…</h1><p>Loading the page’s tools. Your race selection is preserved.</p></div>}>{renderScreen()}</Suspense></PageBoundary></div>{entryTarget&&<Suspense fallback={<div className="page-loading" role="status">Opening Race Centre…</div>}><RaceEntryTransition onDone={finishEntry}/></Suspense>}{screen.type==='home'&&<PitStopIntro/>}</SiteShell>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
