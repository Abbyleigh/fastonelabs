import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

type Race = {
  season: number;
  round: number;
  name: string;
};

type EngineerResponse = {
  answer: string;
  model: string;
  raceId: string;
  sourceKind: string;
  provider: string;
  timestampUtc: string | null;
  limitations: string[];
};

type Message = {
  role: 'user' | 'engineer';
  content: string;
  metadata?: EngineerResponse;
};

const suggestions = [
  'Analyse the recorded driver positions.',
  'Which drivers appear closest together?',
  'What can this snapshot tell us about race strategy?',
  'What information is missing for an undercut calculation?',
];

const panel: React.CSSProperties = {
  padding: 24,
  border: '1px solid #36556b',
  borderRadius: 14,
  background: '#13232e',
  color: '#eaf3fa',
};

const field: React.CSSProperties = {
  background: '#0b1720',
  color: '#fff',
  border: '1px solid #486075',
  borderRadius: 8,
  padding: 12,
  width: '100%',
  boxSizing: 'border-box',
};

export default function RaceEngineer({
  race,
}: {
  race?: Race;
}) {
  const [question, setQuestion] = useState('');
  const [start, setStart] = useState(0);
  const [time, setTime] = useState(30);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    controller.current?.abort();
    controller.current = null;
    setMessages([]);
    setError('');
    setBusy(false);
  }, [race?.season, race?.round]);

  useEffect(() => {
    return () => controller.current?.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const text = question.trim();

    if (!race || !text || busy) return;

    const request = new AbortController();
    controller.current = request;

    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/race-engineer/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: request.signal,
        body: JSON.stringify({
          question: text,
          year: race.season,
          round: race.round,
          start,
          time,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : 'Race Engineer request failed.'
        );
      }

      if (typeof data.answer !== 'string') {
        throw new Error('Unexpected Race Engineer response.');
      }

      setMessages(previous => [
        ...previous,
        { role: 'user', content: text },
        { role: 'engineer', content: data.answer, metadata: data },
      ]);

      setQuestion('');
    } catch (err) {
      if (request.signal.aborted) return;

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to contact the Race Engineer.'
      );
    } finally {
      if (controller.current === request) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section style={panel} aria-label="AI Race Engineer">
      <div style={{ marginBottom: 20 }}>
        <span style={{ color: '#80caff', fontSize: 12 }}>
          FASTONE LABS / RACE INTELLIGENCE
        </span>

        <h2 style={{ margin: '10px 0' }}>
          🏎️ AI Race Engineer
        </h2>

        <p style={{ color: '#b8cbd9', lineHeight: 1.6 }}>
          Ask technical questions about recorded race data.
          Answers are AI interpretations, not verified strategy
          recommendations or live telemetry.
        </p>
      </div>

      {!race ? (
        <p role="status">
          Select a Grand Prix in the race workspace to begin.
        </p>
      ) : (
        <>
          <div
            style={{
              padding: 14,
              background: '#0b1720',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <strong>{race.season} · {race.name}</strong>
            <p style={{ marginBottom: 0, color: '#a9bdce' }}>
              Round {race.round} · Recorded OpenF1 replay
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <label>
              <span>Replay window start (seconds)</span>
              <input
                style={field}
                type="number"
                min={0}
                step={1}
                value={start}
                disabled={busy}
                onChange={e => setStart(Number(e.target.value))}
              />
            </label>

            <label>
              <span>Seconds into window (0–60)</span>
              <input
                style={field}
                type="number"
                min={0}
                max={60}
                step={1}
                value={time}
                disabled={busy}
                onChange={e => setTime(Number(e.target.value))}
              />
            </label>
          </div>

          <p style={{ color: '#a9bdce', fontSize: 12 }}>
            Replay time is relative to the selected recorded
            window, not necessarily the race start.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              margin: '20px 0',
            }}
          >
            {suggestions.map(suggestion => (
              <button
                key={suggestion}
                type="button"
                disabled={busy}
                onClick={() => setQuestion(suggestion)}
                style={{
                  padding: '9px 12px',
                  border: '1px solid #486075',
                  borderRadius: 8,
                  background: '#203849',
                  color: '#eaf3fa',
                  cursor: 'pointer',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div aria-live="polite">
            {messages.map((message, index) => (
              <article
                key={index}
                style={{
                  background:
                    message.role === 'engineer'
                      ? '#1a3444'
                      : '#0b1720',
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <strong>
                  {message.role === 'engineer'
                    ? 'AI Race Engineer'
                    : 'Your question'}
                </strong>

                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    lineHeight: 1.7,
                    marginTop: 10,
                  }}
                >
                  {message.content}
                </div>

                {message.metadata && (
                  <p
                    style={{
                      color: '#a9bdce',
                      fontSize: 12,
                      marginTop: 16,
                    }}
                  >
                    {message.metadata.provider}
                    {' · '}
                    {message.metadata.sourceKind}
                    {' · '}
                    {message.metadata.timestampUtc ?? 'Time unavailable'}
                    {' · '}
                    {message.metadata.model}
                  </p>
                )}
              </article>
            ))}
          </div>

          {error && (
            <p role="alert" style={{ color: '#ffb0a8' }}>
              {error}
            </p>
          )}

          <form onSubmit={submit}>
            <label htmlFor="race-engineer-question">
              Ask your Race Engineer
            </label>

            <textarea
              id="race-engineer-question"
              style={{
                ...field,
                minHeight: 100,
                marginTop: 8,
                resize: 'vertical',
              }}
              maxLength={500}
              value={question}
              disabled={busy}
              placeholder="e.g. What can we infer from the current gaps?"
              onChange={e => setQuestion(e.target.value)}
            />

            <button
              type="submit"
              disabled={
                busy ||
                !question.trim() ||
                !Number.isFinite(start) ||
                start < 0 ||
                !Number.isFinite(time) ||
                time < 0 ||
                time > 60
              }
              style={{
                marginTop: 12,
                padding: '12px 20px',
                border: 0,
                borderRadius: 8,
                background: '#76c5ff',
                color: '#071722',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {busy ? 'Analysing race data…' : 'Ask Race Engineer →'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
