-- Separate catalogue: never migrates the simulator or an existing database.
PRAGMA foreign_keys = ON;
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE sources (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload)));
CREATE TABLE entities (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK(kind IN ('season','circuit','layout','constructor','driver','vehicle','race','regulation','development','engine')),
  name TEXT NOT NULL,
  coverage_start INTEGER NOT NULL CHECK(coverage_start >= 1950),
  coverage_end INTEGER NOT NULL CHECK(coverage_end >= coverage_start),
  payload TEXT NOT NULL CHECK(json_valid(payload))
);
CREATE INDEX entities_kind_year ON entities(kind, coverage_start, coverage_end);
CREATE TABLE entity_sources (
  entity_id TEXT REFERENCES entities(id), source_id TEXT REFERENCES sources(id),
  PRIMARY KEY(entity_id, source_id)
);
CREATE TABLE claims (
  entity_id TEXT REFERENCES entities(id), key TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('verified','estimated','missing','simulated')),
  payload TEXT NOT NULL CHECK(json_valid(payload)), PRIMARY KEY(entity_id, key)
);
CREATE TABLE claim_sources (
  entity_id TEXT, claim_key TEXT, source_id TEXT REFERENCES sources(id),
  FOREIGN KEY(entity_id, claim_key) REFERENCES claims(entity_id, key),
  PRIMARY KEY(entity_id, claim_key, source_id)
);
CREATE TABLE links (
  id INTEGER PRIMARY KEY, subject TEXT NOT NULL REFERENCES entities(id),
  target TEXT NOT NULL REFERENCES entities(id), predicate TEXT NOT NULL,
  payload TEXT NOT NULL CHECK(json_valid(payload))
);
CREATE INDEX links_subject ON links(subject);
CREATE INDEX links_target ON links(target);
CREATE TABLE classifications (
  id TEXT PRIMARY KEY, category TEXT NOT NULL CHECK(category IN ('race','qualifying','driver-standing','constructor-standing')),
  season_id TEXT NOT NULL REFERENCES entities(id), race_id TEXT REFERENCES entities(id),
  constructor_id TEXT NOT NULL REFERENCES entities(id),
  position INTEGER CHECK(position > 0), payload TEXT NOT NULL CHECK(json_valid(payload))
);
-- Position is intentionally not unique: ties and shared drives exist.
CREATE TABLE classification_drivers (
  classification_id TEXT REFERENCES classifications(id), driver_id TEXT REFERENCES entities(id),
  PRIMARY KEY(classification_id, driver_id)
);
CREATE INDEX classifications_race ON classifications(race_id, category, position);
CREATE INDEX classifications_season ON classifications(season_id, category, position);
CREATE INDEX classification_driver ON classification_drivers(driver_id);
PRAGMA user_version = 1;
