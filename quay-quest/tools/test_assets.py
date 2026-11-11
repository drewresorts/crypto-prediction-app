"""Consistency checks for the generated sprite atlas (stdlib only, run by pytest)."""
import json
import os
import re
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read_picks():
    picks = []
    with open(os.path.join(ROOT, 'tools', 'picks.txt')) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                name, query, rank = [p.strip() for p in line.split('|')]
                picks.append((name, query, int(rank)))
    return picks


def read_atlas_index():
    with open(os.path.join(ROOT, 'js', 'atlas.js')) as f:
        src = f.read()
    cols = int(re.search(r'QQ\.ATLAS_COLS = (\d+);', src).group(1))
    sprites = json.loads(re.search(r'QQ\.SPRITES = (\{.*?\});', src).group(1))
    return cols, sprites


def png_size(path):
    with open(path, 'rb') as f:
        head = f.read(24)
    assert head[:8] == b'\x89PNG\r\n\x1a\n'
    return struct.unpack('>II', head[16:24])


def test_picks_are_unique_and_ranked_in_range():
    picks = read_picks()
    names = [p[0] for p in picks]
    assert len(names) == len(set(names))
    assert all(0 <= rank < 32 for _, _, rank in picks)


def test_atlas_index_matches_picks():
    cols, sprites = read_atlas_index()
    picks = read_picks()
    assert cols == 16
    assert sprites == {name: i for i, (name, _, _) in enumerate(picks)}


def test_atlas_png_holds_every_sprite():
    cols, sprites = read_atlas_index()
    w, h = png_size(os.path.join(ROOT, 'assets', 'atlas.png'))
    assert w == cols * 16
    assert h == -(-len(sprites) // cols) * 16


def test_credits_cover_every_sprite():
    with open(os.path.join(ROOT, 'assets', 'sprites.json')) as f:
        credits = json.load(f)
    picks = read_picks()
    assert [c['name'] for c in credits] == [p[0] for p in picks]
    assert all(isinstance(c['sprite_id'], int) and c['subject'] for c in credits)


def test_game_scripts_reference_only_atlas_sprites():
    _, sprites = read_atlas_index()
    with open(os.path.join(ROOT, 'js', 'data.js')) as f:
        data = f.read()
    used = set(re.findall(r"(?:sprite|icon|fx): '([a-z0-9_]+)'", data))
    assert used, 'expected sprite references in data.js'
    assert used <= set(sprites), sorted(used - set(sprites))
