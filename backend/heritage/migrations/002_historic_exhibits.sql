-- Applied after 001 only when building a new, disposable catalogue projection.
-- Not an in-place upgrade of any simulator or user-supplied database.
CREATE TABLE exhibits (
    vehicle_id TEXT PRIMARY KEY REFERENCES entities(id),
    payload TEXT NOT NULL CHECK(json_valid(payload))
);
PRAGMA user_version = 2;
