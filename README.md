# Understanding the Page — and Rebuilding It

An integrated talk that runs two existing decks as one presentation:

| | Chapter | Source | Slides |
|---|---|---|---|
| **Part I** | Grounding the page — M3Grounder (CVPR 2026) → DoCoG (ECCV 2026 Oral) → DocLayout-VL (ECCV 2026) | [`documentgrounding.github.io`](https://github.com/SaiMadhusudan/documentgrounding.github.io) | 54 |
| **Part II** | Rebuilding the page — REPLICA (ICDAR 2026 Oral) | `replica-agents.github.io` | 25 |

`index.html` is the master deck. It owns the title, the through-line, the roadmap,
both part dividers, the interlude between the parts, the synthesis and the close —
**8 wrapper slides around 79 original ones, 87 in total.**

## Why it is built this way

The two source decks use incompatible engines: the grounding deck is a fluid
`vh`-based layout, REPLICA is a fixed 1920×1080 stage that scales to fit, with its
own custom renderers (fidelity ladder, stage cards, live embeds that iframe the
project website). Merging them into one stylesheet would have meant rewriting
REPLICA's interactive machinery.

Instead each chapter keeps its own engine, CSS and assets, and runs full-bleed
inside the master deck. [`chapters/bridge.js`](chapters/bridge.js) handles the only
part that has to be shared — navigation. When a chapter is stepped past its last
build-up (or back before its first), it hands control to the master deck instead of
doing nothing. Nothing about either original deck's behaviour or fidelity changes.

## Presenting

Open `index.html` in a browser — or, because the chapters use iframes and local
`fetch`, serve the folder to be safe:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

| Key | Action |
|---|---|
| `→` / `space` | next step — reveals build-ups first, then advances |
| `←` | back |
| `M` | jump menu (all ten sections) |
| `F` | fullscreen |
| `Home` / `End` | first / last |
| `Esc` | close the menu |

Navigation is continuous: arrow keys carry you from the wrapper slides into a
chapter, all the way through it, and out the far side. Inside a chapter the
original deck's own keys still work — `G` (grounding overview), `O` (REPLICA
overview), `N` notes, `V` source, `B` blank.

`index.html#4` jumps straight to a section by its position in the jump menu.

## Layout

```
index.html                  master deck — wrapper slides + navigation
chapters/
  bridge.js                 chapter ⇄ master navigation seam
  grounding/
    deck.html               the 54-slide grounding deck (patched: exposes __deckAPI)
    assets/                 figures
    interactive/            4 interactive apps (slides 12, 22, 28, 44)
  replica/
    deck.html               the 25-slide REPLICA deck (patched: exposes __deckAPI)
    index.html              REPLICA project site — the deck iframes it for live figures
    static/                 figures, demo frames, qualitative renders
```

### Changes made to the source decks

Only three, all additive:

1. Each deck exposes `window.__deckAPI` (`next`, `prev`, `goStart`, `goEnd`,
   `state`, `clickDir`) and loads `../bridge.js`.
2. The grounding deck's `‹ ›` buttons carry `data-dir`, so the bridge can tell
   which direction a click means.
3. The grounding deck now uses `history.replaceState` instead of assigning
   `location.hash` — inside a frame, every hash assignment was piling up in the
   browser's back history.

Opened directly, both chapter decks still present standalone: `bridge.js` is a
no-op when the page is not in a frame.

### Assets

REPLICA's `static/` was copied minus six unreferenced files (PDF/SVG duplicates of
PNGs already in use, and a 24 MB unused figure) — about 47 MB saved. The repo is
still large (~278 MB) because both talks are image-heavy and everything is bundled
so the deck presents **offline**, which is the point.
