import { useEffect, useRef, useState } from 'react';
import './PitStopIntro.css';

const SESSION_KEY = 'fastone.pit-intro.seen.v1';
const REVEAL_AT_SECONDS = 6.6;

function hasSeenIntro(): boolean {
  try { return window.sessionStorage.getItem(SESSION_KEY) === '1'; }
  catch { return false; }
}
function markSeen(): void {
  try { window.sessionStorage.setItem(SESSION_KEY, '1'); }
  catch { /* Storage is optional. */ }
}

export default function PitStopIntro() {
  const [active, setActive] = useState(true);
  const [opening, setOpening] = useState(false);
  const left = useRef<HTMLVideoElement>(null);
  const right = useRef<HTMLVideoElement>(null);
  const done = useRef(false);

  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { markSeen(); setActive(false); return; }
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = oldOverflow; };
  }, [active]);

  function finish() {
    if (done.current) return;
    done.current = true;
    markSeen();
    setActive(false);
  }

  function reveal() {
    if (done.current || opening) return;
    setOpening(true);
  }

  function syncVideo() {
    const a = left.current;
    const b = right.current;
    if (a && b && Math.abs(a.currentTime - b.currentTime) > 0.2) {
      try { b.currentTime = a.currentTime; } catch { /* Ignore seek restrictions. */ }
    }
    if (a && a.currentTime >= REVEAL_AT_SECONDS) reveal();
  }

  if (!active) return null;

  return (
    <div className={`pit-intro${opening ? ' pit-intro--opening' : ''}`} role="dialog" aria-label="FastOne Labs opening animation" aria-modal="true">
      <div className="pit-intro__panel pit-intro__panel--left" aria-hidden="true">
        <video className="pit-intro__video pit-intro__video--ambient" src="/intro/pit-stop-reference.mp4" autoPlay muted playsInline loop preload="metadata" aria-hidden="true" />
        <video ref={left} className="pit-intro__video" src="/intro/pit-stop-reference.mp4" autoPlay muted playsInline preload="auto"
          onTimeUpdate={syncVideo} onEnded={reveal} onError={finish} />
      </div>
      <div className="pit-intro__panel pit-intro__panel--right" aria-hidden="true">
        <video className="pit-intro__video pit-intro__video--ambient" src="/intro/pit-stop-reference.mp4" autoPlay muted playsInline loop preload="metadata" aria-hidden="true" />
        <video ref={right} className="pit-intro__video" src="/intro/pit-stop-reference.mp4" autoPlay muted playsInline preload="auto"
          onError={finish} />
      </div>
      <div className="pit-intro__vignette" aria-hidden="true" />
      <div className="pit-intro__brand" aria-hidden="true"><strong>FASTONE<span> LABS</span></strong><small>RACE INTELLIGENCE</small></div>
      <button className="pit-intro__skip" type="button" onClick={finish}>Skip intro ↗</button>
      {opening && <div className="pit-intro__finish" onAnimationEnd={finish} aria-hidden="true" />}
    </div>
  );
}
