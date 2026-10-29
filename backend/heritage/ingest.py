"""Offline, non-destructive importer: python -m heritage.ingest input.json new.sqlite"""
import argparse
import json
import os
from pathlib import Path
import sqlite3
import tempfile
from .store import read_dataset, populate


def ingest(source, output):
    dataset = read_dataset(source)  # Reject the entire batch before creating output.
    output = Path(output)
    with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.sqlite', delete=False) as file:
        temporary = Path(file.name)
    try:
        with sqlite3.connect(temporary) as connection:
            populate(connection, dataset)
        # Atomic no-clobber publish on one filesystem; an existing DB is never replaced.
        os.link(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    return {'revision': dataset.revision, 'entities': len(dataset.entities), 'classifications': len(dataset.classifications)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    try:
        print(json.dumps(ingest(args.source, args.output)))
    except (ValueError, OSError, sqlite3.DatabaseError) as error:
        parser.exit(1, f'Ingestion rejected: {error}\n')
