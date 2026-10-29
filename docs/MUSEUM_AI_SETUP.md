# Optional museum AI connection

Public GET `/api/museum/historian` always retrieves from the existing editorial corpus. It never invokes an AI provider. The local-only POST can optionally ask **Groq** to select evidence IDs. Displayed facts and sources still come from the checked corpus; free-form model text is never shown.

## Configuration

The checkpoint uses `GROQ_API_KEY` and `MUSEUM_AI_ENABLED=1`. `MUSEUM_AI_MODEL` optionally overrides its existing `openai/gpt-oss-20b` model setting. The `openai/` prefix is the Groq-hosted model ID; it does not make the provider OpenAI. Model availability and permissions depend on the configured account. No credentials are supplied or live paid request is executed during this assignment.

For local setup, `tools/configure_museum_ai.py` prompts with hidden key input and a model ID, then writes the ignored `backend/.env.museum` with owner-only permissions. `tools/start_museum_backend.py` loads only the three museum variables and starts loopback Uvicorn on port 8001. The helper now uses the same Groq variable as the backend. Previous OpenAI-only helper files do not activate Groq; rerun setup locally if that older configuration is present. Do not commit keys or paste them into chat.

The standard-library HTTP implementation needs no `openai` or `groq` SDK. It posts to a fixed Groq chat-completions endpoint, uses a 25-second timeout, caps output bytes at 64 KiB and refuses incomplete or malformed responses. There are no automatic paid retries. The provider can return only up to four candidate IDs plus an abstention flag; IDs outside the supplied candidates are rejected. Provider failure returns curated matches with a visible fallback notice.

POST remains restricted to loopback clients, expected local browser origins and JSON, with a 2 KiB limit enforced while reading the request stream. The public demo forwards GET only and does not expose POST. Behind a reverse proxy, **loopback client checks alone are not authentication**: the proxy itself may appear local. Keep POST blocked at the edge and AI disabled until authenticated user identity, quotas, spending limits and privacy review exist.

## Retrieval and corpus integrity

`tools/export_museum_knowledge.mjs` exports the existing UI editorial collection. The backend validates its version, collection sizes, unique IDs, source URLs/dates, entity references and specification citations before indexing. Cached lexical matching stores bounded immutable ID tuples and returns independent copies, preventing one caller from corrupting later answers. This is source-backed lexical retrieval, not semantic search, live web research or proof of every inherited factual claim.

The new `/api/heritage` collection is a separate reviewed structured pilot. Legacy editorial records do not automatically acquire the new pilot's verification or reuse status. Do not merge them without checking each source/configuration.

Offline tests cover valid Groq request shape, configured public GET isolation, malformed/oversized/truncated outputs, unknown IDs, fallback, streamed body limits and cache mutation isolation. Live provider connectivity and billing behaviour remain untested.

Primary provider documentation checked 29 October 2026:

- https://console.groq.com/docs/openai
- https://console.groq.com/docs/text-chat
