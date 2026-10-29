# Heritage catalogue data model

Schema version 1. The pilot uses standard-library SQLite and the existing Pydantic/FastAPI dependencies. It does not migrate a simulator database.

## Records and evidence

An `Entity` has a stable slug, kind, name, original short summary, explicit coverage note, coverage years, source references and individual claims. Kinds include season, circuit, layout, constructor, driver, vehicle, race, regulation and development. Regulation/development kinds are supported but not populated by invented examples.

**Coverage years describe the reviewed collection window.** A driver record with 1950–1950 does not claim a one-year career. The `silverstone-1950` layout identifies the reviewed event, not its full operational lifespan. It contains no geometry and must not reuse the simulator's modern coordinates.

Every claim has a key, label, scalar value, optional unit, context, status and citations:

| Status | Meaning | Validation |
|---|---|---|
| verified | The specific stated value is supported by reviewed cited evidence | Non-null value and at least one source |
| estimated | A qualified estimate, with its method/limitations in context | Non-null value and cited basis |
| missing | Unknown, not supplied or explicitly not applicable in context | Null value; never inferred as zero |
| simulated | A reconstruction or teaching result, labelled in context | Non-null value and cited method/basis |

All substantive fields in the pilot are verified or missing; it includes no estimates or simulations. Verification says nothing about redistribution permission. Sources separately record publisher, HTTPS URL, check date, licence description, reuse review (`unreviewed`, `non-commercial`, `permitted`) and notes. All five pilot sources remain **unreviewed for reuse**. This is a review flag, not an automatic commercial eligibility decision.

Entity-level sources support identity and original summary; claim-level sources support each specification. Source references must exist. Duplicate identifiers, dangling relationships, reversed periods, invalid relationship kinds, unsafe source URLs, non-finite numbers and unknown fields reject the entire batch.

## Relationships and classifications

Reviewed period links connect race → season/circuit/layout, layout → circuit, vehicle → constructor, driver → constructor/vehicle, and vehicle → engineering development/regulation. Predicates enforce subject/target kinds. These period links must not be read as complete career contracts or ownership continuity.

`Classification` separates race, qualifying, final driver standings and final constructor standings. A classification references a season, constructor, optional race, and one or more drivers for shared entries. Race/qualifying records must reference a race linked to the selected season. Shared drives can contain multiple driver IDs. Position is deliberately not unique, so ties and shared drives survive ingestion. Null positions coexist with position text for non-classified entries. Points are numeric, not calculated under modern rules; the pilot's championship totals come directly from the reviewed final standings.

The schema supports shared entries but does not yet model distinct entrant and engine-manufacturer identities, separate grid positions, all scoring-rule versions, penalties, qualifying segments or event-by-event standings. Add typed models for these before bulk ingestion. Do not overload classification points with invented modern equivalents.

## Storage

`migrations/001_catalog.sql` creates a new catalogue with metadata, sources, entities, entity_sources, claims, claim_sources, links, classifications and classification_drivers. Foreign keys protect identity/citation links; indexes support kind/period and classification lookups. JSON payloads preserve the Pydantic contracts while indexed scalar columns provide relational search. Schema version is also stored in SQLite `user_version`.

The importer validates up to 20 MiB per batch, writes a temporary DB, checks foreign keys and publishes with a same-filesystem no-clobber hard link. Existing output paths are never replaced. An error removes the temporary file. No ingestion HTTP endpoint is exposed.

The API builds a process-local SQLite projection from the packaged reviewed JSON once, then enables `query_only`. Reads are locked across FastAPI worker threads. The importer produces an independently inspectable SQLite artifact; the current API deliberately reads the packaged JSON rather than arbitrary user-supplied DB paths. Restart the backend after changing the reviewed seed. Multi-batch merge/update and runtime DB switching are future work, not features of v1.

## API contracts

- `GET /api/heritage/entities?q=Alfetta&kind=vehicle&year=1950&limit=6&offset=0`
- `GET /api/heritage/entities/alfa-158`

Search returns version, revision, collection coverage, global facets, records and pagination totals. Bounds: query 100 characters, page 1–50, offset 0–100000, year 1950–2100 and enumerated kinds. Literal substring matching uses bound SQL parameters; `%`, `_` and SQL fragments are not wildcards or executable SQL. Search is SQLite case-insensitive for ASCII, not an accent-normalised full-text index.

Detail returns claims, citations, connected records, referenced participant names and selected classifications. Links and classification rows are each capped at 100 with explicit total counts. Higher-volume per-entity pagination is a next step before extensive ingestion. Source metadata accompanies detail; classification and link citation lists remain embedded and are validated before storage.

Responses carry representation-specific SHA-256 ETags, conditional GET support and a five-minute public cache directive. Nothing is fetched upstream per public request. OpenAPI exposes typed response models. `tools/generate_heritage_contracts.py` generates TypeScript from Pydantic; `--check` detects drift. The frontend additionally checks response shape and citation URLs before rendering.

## Pilot accuracy boundaries

Race podium only: Farina, Fagioli, Parnell. Qualifying: Farina only; a starting grid is not substituted for missing qualifying rows. Final championship top three: Farina, Fangio, Fagioli. Four driver records are partial profiles. The 158 specifications describe the museum's configuration, not a certified Silverstone chassis. Museum weight has an unspecified fuel/dry basis. No validated 3D asset, historic survey, full results table or career aggregate is supplied.
