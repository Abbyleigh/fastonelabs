"""Exercise the Mac review asset helper against disposable real Git worktrees."""
import importlib.util
from pathlib import Path
import subprocess
import pytest

spec = importlib.util.spec_from_file_location('review_assets', Path(__file__).resolve().parents[2]/'tools/copy_review_assets.py')
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


@pytest.fixture
def trees(tmp_path):
    source, review = tmp_path/'active', tmp_path/'review'
    source.mkdir()
    def git(*args):
        subprocess.run(['git', '-C', str(source), *args], check=True, capture_output=True)
    git('init')
    public = source/'frontend/public/models'
    public.mkdir(parents=True)
    (public/'model-info.json').write_text('{}')
    git('add', '.')
    git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture')
    git('worktree', 'add', '--detach', str(review), 'HEAD')
    (public/'original.glb').write_bytes(b'original model bytes')
    return source, review


def test_dry_run_and_copy_preserve_source_and_review_metadata(trees):
    source, review = trees
    target = review/'frontend/public/models/original.glb'
    metadata = review/'frontend/public/models/model-info.json'
    metadata.write_text('{"review":true}')
    assert helper.stage(source, review)['files'][0]['action'] == 'would-copy'
    assert not target.exists()
    assert helper.stage(source, review, True)['files'][0]['action'] == 'copied'
    assert target.read_bytes() == (source/'frontend/public/models/original.glb').read_bytes()
    assert metadata.read_text() == '{"review":true}'
    assert helper.stage(source, review, True)['files'][0]['action'] == 'unchanged'


def test_existing_different_assets_abort_without_any_copy(trees):
    source, review = trees
    folder = review/'frontend/public/models'
    (folder/'original.glb').write_bytes(b'review version')
    (source/'frontend/public/models/a-first.glb').write_bytes(b'new')
    with pytest.raises(ValueError, match='Conflicting'):
        helper.stage(source, review, True)
    assert not (folder/'a-first.glb').exists()
    assert (folder/'original.glb').read_bytes() == b'review version'


def test_source_or_target_symlinks_fail_closed(trees):
    source, review = trees
    (review/'frontend/public/models/original.glb').symlink_to(source/'frontend/public/models/original.glb')
    with pytest.raises(ValueError, match='symlink'):
        helper.stage(source, review, True)


def test_active_or_overlapping_destination_is_rejected(trees):
    source, review = trees
    with pytest.raises(ValueError, match='non-overlapping'):
        helper.stage(source, source, True)
    with pytest.raises(ValueError, match='detached'):
        helper.stage(review, source, True)


def test_symlinked_source_media_directory_is_rejected(trees):
    source, review = trees
    images = source/'frontend/public/images'
    images.symlink_to(source/'frontend/public/models', target_is_directory=True)
    with pytest.raises(ValueError, match='symlink'):
        helper.stage(source, review, True)
    assert not (review/'frontend/public/models/original.glb').exists()
