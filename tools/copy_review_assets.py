"""Copy missing local media into a detached sibling worktree; dry-run by default."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOTS = ('models', 'images', 'intro', 'fonts')
EXTENSIONS = {'.glb', '.bin', '.jpg', '.jpeg', '.png', '.webp', '.avif', '.mp4', '.webm', '.woff', '.woff2', '.ttf'}


def git(root, *args):
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()


def digest(path):
    with path.open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()


def stage(source, review, apply=False):
    source, review = Path(source).resolve(strict=True), Path(review).resolve(strict=True)
    if source == review or source in review.parents or review in source.parents:
        raise ValueError('Source and review must be separate, non-overlapping directories')
    for root in (source, review):
        if Path(git(root, 'rev-parse', '--show-toplevel')).resolve() != root:
            raise ValueError('Both paths must be Git worktree roots')
    common = lambda root: Path(git(root, 'rev-parse', '--path-format=absolute', '--git-common-dir')).resolve()
    if common(source) != common(review) or git(review, 'branch', '--show-current'):
        raise ValueError('Review must be a detached worktree of the same repository')
    src, dst = source/'frontend/public', review/'frontend/public'
    for public, owner in ((src, source), (dst, review)):
        for parent in (public, *public.parents):
            if parent == owner:
                break
            if parent.is_symlink():
                raise ValueError('Media ancestors must not be symlinks')
    if not src.is_dir() or not dst.is_dir():
        raise ValueError('Both checkouts must contain frontend/public')
    plan = []
    for folder in ROOTS:
        base = src/folder
        if not base.exists():
            continue
        if base.is_symlink():
            raise ValueError('Source media roots must not be symlinks')
        for path in sorted(base.rglob('*')):
            if path.is_symlink():
                raise ValueError('Source media must not contain symlinks')
            if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
                continue
            rel, sha = path.relative_to(src), digest(path)
            target = dst/rel
            # Check every existing ancestor, including frontend/public, before writes.
            for parent in (target, *target.parents):
                if parent == review:
                    break
                if parent.is_symlink():
                    raise ValueError('Review media paths must not contain symlinks')
            exists = target.exists()
            if exists and (not target.is_file() or digest(target) != sha):
                raise ValueError(f'Conflicting review asset; no files copied: {rel}')
            plan.append((path, target, sha, exists))
    # Validate the complete plan before copying anything. Never overwrite a target.
    for path, target, sha, exists in plan:
        if exists or not apply:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(dir=target.parent, prefix='.review-copy-', delete=False) as handle:
                temporary = Path(handle.name)
                with path.open('rb') as source_handle:
                    shutil.copyfileobj(source_handle, handle)
            if digest(temporary) != sha:
                raise ValueError('Source asset changes during copying; rerun after asset editing stops')
            os.link(temporary, target)  # Atomic no-clobber publication, including racing writers.
        finally:
            if temporary is not None:
                temporary.unlink(missing_ok=True)
    return {'mode': 'copy-missing' if apply else 'dry-run', 'files': [
        {'path': str(target.relative_to(review)), 'sha256': sha, 'action': 'unchanged' if exists else 'copied' if apply else 'would-copy'}
        for _, target, sha, exists in plan
    ]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--review', required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    try:
        print(json.dumps(stage(args.source, args.review, args.apply), indent=2))
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error))
