"""Offline re-implementation of the pixel-search space's query pipeline (data files only).
usage: python3 -I pxs.py <dataDir> <pageCache> <outDir> <n> <query>...
  query "id:1,2,3" fetches explicit sprite ids. Writes <slug>.json + <slug>.rgba (n * 16*16*4 bytes)."""
import gzip, json, os, re, subprocess, sys
import numpy as np

data, cache, out, n, *queries = sys.argv[1:]
n = int(n)
gz = lambda name: gzip.decompress(open(f"{data}/{name}", "rb").read())
lines = lambda name: gz(name).decode().split("\n")
man = json.load(open(f"{data}/manifest.json"))
D = man["dims"]; PAGE = man["page_sprites"]; TOTAL = man["catalog_sprites"]
SCALE = 258.15903
subjects = lines("subjects.txt.z"); termsA = lines("terms-a.txt.z"); termsB = lines("terms-b.txt.z")
vecA = np.frombuffer(open(f"{data}/vec-a.bin", "rb").read(), dtype=np.int8).reshape(-1, D).astype(np.float32)
vecB = np.frombuffer(open(f"{data}/vec-b.bin", "rb").read(), dtype=np.int8).reshape(-1, D).astype(np.float32)
vecS = np.frombuffer(open(f"{data}/vec-s.bin", "rb").read(), dtype=np.int8).reshape(-1, D).astype(np.float32)
idxA = {t: i for i, t in enumerate(termsA)}; idxB = {t: i for i, t in enumerate(termsB)}
TOKEN = re.compile(r"[a-z0-9]+(?:['-][a-z0-9]+)*")
tok = lambda s: TOKEN.findall(s.lower())
subj_lower = [s.lower() for s in subjects]
phrase = {" ".join(tok(s)): i for i, s in enumerate(subj_lower)}
STOP = set("a an the of in on with and to for at by from".split())
subj_start = np.frombuffer(gz("catalog-subjects.bin.z"), dtype=np.uint32).astype(np.int64)
count = int(subj_start[-1])
sprite_subject = np.repeat(np.arange(len(subj_start) - 1), np.diff(subj_start))
cs = np.frombuffer(gz("catalog-captions.bin.z"), dtype=np.uint8)
ntok = (len(cs) - count) // 2
cap_tokens = cs[count:count + ntok].astype(np.uint16) | (cs[count + ntok:count + 2 * ntok].astype(np.uint16) << 8)
cap_start = np.zeros(count + 1, dtype=np.int64); np.cumsum(cs[:count], out=cap_start[1:])
palette = np.frombuffer(gz("palette.bin.z"), dtype=np.uint8)
token_count = np.bincount(cap_tokens, minlength=len(termsA))

def caption(s): return " ".join(termsA[t] for t in cap_tokens[cap_start[s]:cap_start[s + 1]])

def lookup(w):
    if w in idxA: return vecA[idxA[w]], idxA[w]
    if w in idxB: return vecB[idxB[w]], -1
    return None

def search(q, limit):
    tokens = tok(q); vec = np.zeros(D, dtype=np.float32); literals = []; attrs = []
    i = 0
    while i < len(tokens):
        hit = 0
        for k in range(min(4, len(tokens) - i), 1, -1):
            p = " ".join(tokens[i:i + k])
            if p in phrase:
                vec += vecS[phrase[p]]; literals.append(p); hit = k; break
        if hit: i += hit; continue
        w = tokens[i]; i += 1
        if w in STOP: continue
        r = lookup(w)
        if r is None and w.endswith("s") and len(w) > 3:
            r = lookup(w[:-1]); w = w[:-1] if r is not None else w
        if r is None: continue
        literals.append(w); vec += r[0]
        if r[1] >= 0: attrs.append(r[1])
    norm = float(np.sqrt((vec * vec).sum()))
    if norm < 1e-3: return []
    vec /= norm * SCALE
    scores = vecS @ vec
    for lit in literals:
        if len(lit) < 2: continue
        for s, name in enumerate(subj_lower):
            if name.startswith(lit) or f" {lit}" in name or f"-{lit}" in name: scores[s] += 0.04
    top = float(scores.max())
    full = " ".join(literals)
    if full in phrase: scores[phrase[full]] += 0.12
    order = np.argsort(-scores); cut = max(0.3, top * 0.66); selected = []
    for s in order[:520]:
        if scores[s] < cut and len(selected) >= 6: break
        selected.append(int(s))
    if len(attrs) >= 2: aw = 0.6
    elif len(attrs) == 1 and token_count[attrs[0]] >= 3225: aw = 0.3
    else: aw = 0.0
    cand = [np.arange(subj_start[s], subj_start[s + 1]) for s in selected]
    for a in attrs:
        if 258 <= token_count[a] <= 193500:
            pos = np.nonzero(cap_tokens == a)[0]
            cand.append(np.searchsorted(cap_start, pos, side="right") - 1)
    cand = np.unique(np.concatenate(cand))
    val = scores[sprite_subject[cand]].astype(np.float64)
    if aw > 0 and attrs:
        starts = cap_start[cand]; lens = cap_start[cand + 1] - starts
        ok = lens > 0
        flat = np.concatenate([np.arange(a, a + l) for a, l in zip(starts[ok], lens[ok])]) if ok.any() else np.zeros(0, dtype=np.int64)
        offs = np.concatenate([[0], np.cumsum(lens[ok])[:-1]]).astype(np.int64)
        bonus = np.zeros(len(cand))
        for a in attrs:
            sim = (vecA @ vecA[a]) / (SCALE * SCALE); sim[a] = 1.0
            best = np.zeros(len(cand))
            if ok.any(): best[ok] = np.maximum.reduceat(sim[cap_tokens[flat]], offs)
            bonus += np.clip((best - 0.62) / 0.38, 0, None)
        bonus /= len(attrs); val += aw * bonus * bonus
    keep = val >= val.max() * 0.62
    cand = cand[keep]; val = val[keep]
    val -= 0.03 * np.log2(1 + (cand - subj_start[sprite_subject[cand]]))
    o = np.lexsort((cand, -val))[:limit]
    return [int(x) for x in cand[o]]

_pages = {}
def page(pn):
    if pn not in _pages:
        f = f"{cache}/{pn}.bin.z"
        if not os.path.exists(f):
            subprocess.run(["curl", "-sSfL", "--retry", "3", "-o", f,
                f"https://huggingface.co/spaces/cfahlgren1/pixel-search/resolve/main/static/data/pages/{pn}.bin.z"], check=True)
        _pages[pn] = np.frombuffer(gzip.decompress(open(f, "rb").read()), dtype=np.uint8)
    return _pages[pn]

def sprite(sid):
    pn = sid // PAGE; b = page(pn); cnt = min(PAGE, TOTAL - pn * PAGE)
    starts = np.zeros(cnt + 1, dtype=np.int64); starts[0] = cnt
    starts[1:] = cnt + np.cumsum(b[:cnt].astype(np.int64) * 2)
    off = sid - pn * PAGE
    ncol = int(b[off]); c0 = int(starts[off])
    cols = b[c0:c0 + ncol * 2].astype(np.uint16); tokens = cols[0::2] | (cols[1::2] << 8)
    i0 = int(starts[cnt]) + off * 256
    t = tokens[b[i0:i0 + 256]].astype(np.int64)
    rgba = np.zeros((256, 4), dtype=np.uint8); m = t != 0
    rgba[m, 0] = palette[t[m] * 3]; rgba[m, 1] = palette[t[m] * 3 + 1]; rgba[m, 2] = palette[t[m] * 3 + 2]; rgba[m, 3] = 255
    return rgba.tobytes()

for q in queries:
    ids = [int(x) for x in q[3:].split(",")] if q.startswith("id:") else search(q, n)
    slug = re.sub(r"[^a-z0-9]+", "_", q.lower())[:60]
    meta = [{"id": s, "subject": subjects[sprite_subject[s]], "caption": caption(s)} for s in ids]
    open(f"{out}/{slug}.json", "w").write(json.dumps({"query": q, "results": meta}))
    open(f"{out}/{slug}.rgba", "wb").write(b"".join(sprite(s) for s in ids))
    seen = list(dict.fromkeys(m["subject"] for m in meta))[:10]
    print(f"{q} -> {len(ids)}; {', '.join(seen)}")
