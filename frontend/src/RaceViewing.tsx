import { useState } from 'react';

// Only verified uploads from Formula 1's official channel. Unknown races use
// channel search rather than guessed video IDs or unrelated race footage.
const highlights: Record<string, { id: string; source: string }> = {
  '2024/8': { id: 'aeCI0ObFY8M', source: 'https://www.formula1.com/en/video/race-highlights-2024-monaco-grand-prix.1800132618250746394' },
  '2024/12': { id: 'yPvoKz6tyJs', source: 'https://www.formula1.com/en/video/race-highlights-2024-british-grand-prix.1803937851447855766' },
};
const linkStyle = { display: 'inline-block', padding: '11px 14px', borderRadius: 8, background: '#263b53', color: '#e8f2ff', textDecoration: 'none', fontWeight: 700 };

export default function RaceViewing({ year, round, name, completed = true }: { year: number; round: number; name: string; completed?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const video = highlights[`${year}/${round}`];
  const title = `${year} ${name}`;
  const search = `https://www.youtube.com/@Formula1/search?query=${encodeURIComponent(`${title} race highlights`)}`;
  return <section aria-label={`Watch ${title}`} style={{ marginTop: 18, marginBottom: 18, padding: 16, border: '1px solid #3c4c63', borderRadius: 12, background: '#101c2b' }}>
    <div style={{ fontSize: 12, letterSpacing: 2, color: '#aebfd5' }}>REAL RACE FOOTAGE</div>
    <h3 style={{ margin: '10px 0' }}>Watch {title}</h3>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      <a style={linkStyle} href="https://f1tv.formula1.com/" target="_blank" rel="noopener noreferrer">{completed ? 'Find full race on F1 TV ↗' : 'Open F1 TV ↗'}</a>
      {completed && (video ? <button type="button" style={{ ...linkStyle, border: 0, cursor: 'pointer' }} aria-expanded={playing} onClick={() => setPlaying(!playing)}>{playing ? 'Close highlights' : '▶ Open highlights player'}</button>
        : <a style={linkStyle} href={search} target="_blank" rel="noopener noreferrer">Find official highlights ↗</a>)}
    </div>
    <p style={{ color: '#b8c7da', fontSize: 13, lineHeight: 1.6, marginBottom: 0 }}>F1 TV opens separately. Search for “{title}” in its archive. Subscription, regional availability and replay delays apply.{!completed && ' Race footage becomes available after the event.'}</p>
    {completed && !video && <p style={{ color: '#b8c7da', fontSize: 13, lineHeight: 1.6 }}>Highlights opens a search on Formula 1’s official YouTube channel; a matching upload may not be available.</p>}
    {video && playing && <div style={{ marginTop: 16 }}>
      <iframe title={`Official race highlights: ${title}`} src={`https://www.youtube-nocookie.com/embed/${video.id}`} style={{ width: '100%', aspectRatio: '16 / 9', border: 0, borderRadius: 8 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      <p style={{ fontSize: 13, color: '#b8c7da', lineHeight: 1.6 }}>Official Formula 1 highlights. If this player is restricted, <a style={{ color: '#8bc6ff' }} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">watch on YouTube ↗</a> or <a style={{ color: '#8bc6ff' }} href={video.source} target="_blank" rel="noopener noreferrer">Formula1.com ↗</a>.</p>
    </div>}
  </section>;
}
