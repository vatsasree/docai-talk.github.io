# Rebuilding the Page — and Grounding It

A single 75-slide talk for an industry / sponsor review, in one self-contained
`index.html`.

The story runs **REPLICA first**: the page has to be *representable* before it
can be *queryable*. REPLICA produces FID-HTML — layout, geometry and style at
scale, without hand labels — which is what the grounding models are then built
on; and those models in turn sharpen REPLICA's own segmentation, ordering and
grounding. Slide 2 is that loop, drawn.

| Slides | Part | |
|---|---|---|
| 1–2 | Title and the enablement loop | |
| 3–21 | **REPLICA** | ICDAR 2026 Oral |
| 22–75 | **Grounding** — M3Grounder → DoCoG → DocLayout-VL | CVPR 2026 · ECCV 2026 Oral · ECCV 2026 |

One engine, one design system, one continuous slide count. No bridge or
interlude slides between the parts.

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

- **Removed** — the ablation table, the agent/tool reliability table, and the
  formal notation (agent/tool symbols, the objective equation, the per-stage
  maths). The agentic argument is now carried in words.
- **Added** — slide 15, *Which metric measures what*: one row per axis with the
  question it asks, its metric, and a one-line plain-language account of how it
  is computed. Two axes carry a **NEW** badge. Slide 16 validates those metrics
  against seven expert annotators (Pearson r, all > 0.8).
- **Rebuilt** — slide 17, the main results table. Collapsible by method
  category (each shows its best system until you click), column-grouped by
  axis, and it reveals **one axis group at a time**: the live group is
  highlighted, the rest recede, and the exact cells the takeaway quotes are
  outlined in the table — so the spoken claim and the table always agree.

Live and interactive throughout: the Fig. 1 comparison and radar, the FID-HTML
format table and anatomy, the running pipeline demo, the qualitative
source-vs-render pairs, and the downstream applications. The fidelity ladder
(slide 5) and the four-stage pipeline (slide 12) are native to this deck and
build up with the arrow keys.

## The grounding half

Sai Madhusudan's 54 slides, unchanged. Two additions only: `replica-agents.github.io`
and REPLICA's venue on the closing slide.

## Layout

```
index.html            the whole deck — markup, styles, engine
grounding/assets/     figures for slides 22–75
grounding/interactive/  5 interactive apps (slides 33, 43, 49, 58, 66)
replica/index.html    REPLICA project site — the deck iframes it for live figures
replica/static/       REPLICA figures, demo frames, qualitative renders
```

Everything is bundled so the deck presents **offline**. That is why the repo is
large (~278 MB); six unreferenced REPLICA assets were dropped (PDF/SVG
duplicates of PNGs in use, plus a 24 MB unused figure).
