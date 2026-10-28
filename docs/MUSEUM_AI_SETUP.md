# Optional museum AI connection

The museum works without an AI account. Public GET `/api/museum/historian` always uses curated source retrieval. It never invokes a paid provider. The UI labels that mode explicitly.

A local-only POST endpoint is prepared for OpenAI Responses API evidence selection. It requires all three server settings: `MUSEUM_AI_ENABLED=1`, `OPENAI_API_KEY`, and `MUSEUM_AI_MODEL`. No model ID or secret is guessed. Public demo proxy forwards GET only, so it cannot expose the paid endpoint. A future public AI rollout requires authenticated users and enforceable quotas, not simply enabling this flag.

## Private local setup

Do not paste an API key into chat or commit it. From the repository root, run:

```
backend/.venv312/bin/python tools/configure_museum_ai.py
```

The script asks for the key with hidden input and the Responses-compatible model ID from your account. It saves `backend/.env.museum` with owner-only permissions; `.gitignore` excludes it. Restart the existing local backend using `backend/.venv312/bin/python tools/start_museum_backend.py` after stopping its current instance. The app on port 5173 detects the configured local service. The public demonstration remains source-only. API usage can incur provider charges; configure spending limits in your provider account.

## Grounding and implementation

`tools/export_museum_knowledge.mjs` produces the versioned backend snapshot from the same typed sources used by the UI. The gate checks for snapshot drift.

`backend/museum.py` retrieves bounded candidates. The model receives only the submitted question and those public museum summaries; no user history or application secrets. `store:false` is set. Structured output is a list of existing evidence IDs plus an abstention flag. The server validates those IDs and renders the corpus text and references, rather than displaying invented generated statements. This design constrains what is displayed; it does not guarantee that retrieval selected the best answer or that every source is infallible. Uncertainty is displayed with each record.

No live provider request has been verified: no provider key/model is configured. Mock tests cover request shape, secret isolation, unknown IDs, source-only operation and route restrictions. Live verification remains required after configuration.

Official OpenAI Docs checked 28 October 2026:
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/reference/resources/responses/methods/create

The API reference exceeded the research tool’s page-length limit when opened; request format was corroborated using the fetched Structured Outputs guide and official reference search. No claim that JSON schema alone prevents factual hallucination is made; the application’s ID-only selection and corpus rendering are separate controls.
