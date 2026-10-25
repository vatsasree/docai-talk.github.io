# Rebuilding the Page — and Grounding It

A ~1-hour research talk (62 slides here, the REPLICA part hosted as one of them) (research-lab visits), in one
self-contained `index.html`. Told as a **story**: each paper's section opens from a question
and only names the paper at its end, where the title card carries the team.
Before that reveal, charts and tables label our systems **"Ours"**, never the
paper name.

The story runs **REPLICA first**: the page has to be *representable* before it
can be *queryable*. REPLICA produces FID-HTML, which is what two of the three
grounding models are trained on; slide 21 is the bridge that says so, and the loop slide (`src/replica.closing.html`, now left out of the build via `INCLUDE_LOOP`) draws what actually flows
between the four systems.

| Slides | Part | |
|---|---|---|
| 1 | Title — *Grounding, Reasoning, and Structure with Multimodal Foundation Models* |  |
| 2 | **REPLICA** title card with the team | ICDAR 2026 Oral |
| 3 | **REPLICA** — the ICDAR deck, hosted full-screen |  |
| 4 | Bridge — from rebuilding to grounding (Part 2 of 2) |  |
| 5–8 | The grounding problem |  |
| 9–26 | **M3Grounder** — chain-two-tools (OCR errors), losses, Fid-HTML recap and engines, benchmark, results, why not LISA | CVPR 2026 |
| 27–40 | **DoCoG** — the $27.50 bill, why GIM, training data, why preference training, building the pairs, drift + anchor, ablations, both pills | ECCV 2026 Spotlight |
| 41–55 | **DocLayout-VL** — three problems (carousels), what a layout model needs, SAM for documents, tasks, HGC examples, curriculum by data | ECCV 2026 |
| 56 | Three papers, one recipe (abstracted architectures) |  |
| 57–60 | What made this possible · design choices · the frontier · what we learned |  |
| 61 | Thank you |  |

**The REPLICA half** is `replica/slides.html`, the ICDAR deck, loaded in hosted
mode (`?host=1`): it hides its own counter, progress bar and controls and drops
its thank-you slide. While it is on screen, → / Space / ← step through its
slides and build-ups first; at its last (or first) step the key moves this deck.
Clicking inside it works too. Its live figures come from `replica/index.html`.
Open `replica/slides.html` on its own to present REPLICA standalone.

Each paper's title card carries its team (build.py injects the grid at a
`<!-- TEAM:key -->` placeholder). Photos go in `team/` — see
[`team/README.md`](team/README.md) for the filenames; anyone without a photo
shows their initials, so the card never looks unfinished.

One engine, one design system, one continuous slide count. The grounding half
carries a story motion layer (cascading entrances, highlighter wipes, SVG
draw-ons) ported from the DoCoG spotlight deck.

Several DoCoG slides are lifted from the DoCoG MS thesis (Rachakonda, IIIT
Hyderabad, 2026): the medical-bill example (§1.1.2, Fig 1.2 — the crop lives
in `grounding/assets/docog_bill*.png`), the Fig 3.1 worked output (§3.2.4), the DPO/anchor derivation (§3.3.2) and the
dense-page error analysis (§5.3.1) on the limits slide. Every number on those slides was checked
against the thesis and the live `.tex` of the papers.

The deck was rehearsed with two narrating agents and four cold-audience
note-takers (MS students who had never heard of document grounding). The
bridges on slides 3, 21 and 59, the on-slide definitions (grounding, GIM,
HGC, the reward metrics, the benchmark tracks), the hooks ($27.50, the River
Thames polygon, "hands up if you trust chain B") and the merged credit slides
all come from that pass.

## Presenting

Serve the folder (the live figures use iframes, so `file://` is unreliable):

```bash
python3 -m http.server 8000
```

| Key | Action |
|---|---|
| `→` / `Space` | next step — reveals build-ups first, then advances |
| `←` | back |
| `G` | slide overview grid (click to jump) |
| `F` | fullscreen |
| `Home` / `End` | first / last |

`index.html#17` jumps to a slide. `index.html?all` pre-reveals every build-up.

## The REPLICA half

Rebuilt from the ICDAR deck into this deck's engine and design language, with
the changes from the review:

- **Removed** — the ablation table, the agent/tool reliability table, the
  metric-vs-human-agreement slide, the downstream applications and the
  limitations, and all formal notation (agent/tool symbols, the objective
  equation, the per-stage maths). The agentic argument is carried in words.
  The removed slides are commented out in `src/replica.slides.html`, each with
  the reason — delete the comment wrapper to bring one back.
- **Ends on a handoff** — slide 17 shows a page becoming FID-HTML with all four
  axes ticked, and names that as the labelled data the grounding half trains on.
- **Added** — slide 14, *Which metric measures what*: one row per axis with the
  question it asks, its metric, and a one-line plain-language account of how it
  is computed. Two axes carry a **NEW** badge.
- **Rebuilt** — slide 15, the main results table. Collapsible by method
  category (each shows its best system until you click), column-grouped by
  axis, and it reveals **one axis group at a time**: the live group is
  highlighted, the rest recede, and the exact cells the takeaway quotes are
  outlined in the table — so the spoken claim and the table always agree. On the
  final step the whole table is graded weakest-to-strongest, so the collapse on
  position reads as a block of red with REPLICA the one gold row; that row stays
  pinned when a category is expanded.

Live and interactive throughout: the Fig. 1 comparison and radar, the FID-HTML
format table and anatomy, the running pipeline demo, and the qualitative
source-vs-render pairs. The fidelity ladder (slide 4) and the four-stage
pipeline (slide 11) are native to this deck and build up with the arrow keys.

**Every live figure is driven from the keyboard**, including after you have
clicked inside one: the figures relay arrow keys back to the deck. The six
FID-HTML dimensions (slide 9) and the pipeline demo (slide 12) step with
`←` / `→`, and the deck moves on by itself once the demo's last stage
finishes. Figures for the next slide are loaded in advance so transitions do
not flash.

## The grounding half — and keeping it in sync

Sai's 54 slides are **not edited in this repo**. `index.html` is generated: his
deck is pulled from his repo on every build and used verbatim, apart from a few
declared rewrites (asset paths, and adding REPLICA's link and venue to the
closing slide).

When he changes his deck:

```bash
./sync.sh
```

That pulls his latest commit, re-copies his figures into `grounding/`, and
recomposes `index.html`. Then `git diff --stat`, click through, commit.

**Never hand-edit `index.html`** — the next build overwrites it. The REPLICA
half lives in `src/`:

```
src/replica.css          styles for the REPLICA components
src/replica.slides.html  the REPLICA slides (some commented out — see below)
src/replica.closing.html the final loop slide, after the grounding half
src/replica.js           the ladder, stage accordion, results table, qual pairs
build.py                 composes the two halves
sync.sh                  pull upstream, then build
```

### The build fails loudly rather than quietly

Every rewrite and every assumption about Sai's deck is asserted, so a change on
his side that would silently break the merge stops the build with the reason:

- a rewrite no longer matches — e.g. he edits the closing slide, which would
  otherwise drop REPLICA's link without a trace
- his engine stops using `.slide` / `.frag` / `.show` / `#deck`, which the
  REPLICA interactive slides read to step themselves
- he defines a bare class this deck already defines (`.doc`, `.rtab`, …), which
  would restyle REPLICA slides from across the deck

Adding, removing or editing his slides needs no action — they flow straight
through and the slide count updates itself.

## Layout

```
index.html            the whole deck — markup, styles, engine
grounding/assets/     figures for slides 19–75
grounding/interactive/  5 interactive apps in the grounding half
team/                 team photos — see team/README.md
replica/index.html    REPLICA project site — the deck iframes it for live figures
replica/static/       REPLICA figures, demo frames, qualitative renders
```

Everything is bundled so the deck presents **offline**. That is why the repo is
large (~278 MB); six unreferenced REPLICA assets were dropped (PDF/SVG
duplicates of PNGs in use, plus a 24 MB unused figure).
