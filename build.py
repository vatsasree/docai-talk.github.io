#!/usr/bin/env python3
"""Compose index.html from Sai's upstream grounding deck plus the REPLICA half.

Sai's 54 slides are not edited here — they are taken verbatim from his repo on
every build and only rewritten in the few well-defined ways listed in PATCHES.
That way "he changed his deck" is `./sync.sh`, not a manual re-merge.

Layout of the generated file:

    <style>   upstream CSS            + src/replica.css
    <body>    src/replica.slides.html + upstream slides
    <script>  upstream engine         + src/replica.js

Every extraction and patch below asserts. If Sai restructures his deck the
build fails loudly and names what moved, rather than quietly emitting a deck
with half the talk missing.
"""
from __future__ import annotations
import re, shutil, sys
from pathlib import Path

ROOT     = Path(__file__).parent
UPSTREAM = ROOT / '.upstream' / 'grounding'
SRC      = ROOT / 'src'
OUT      = ROOT / 'index.html'

TITLE = 'Rebuilding the Page — and Grounding It'

# ---------------------------------------------------------------- patches ---
# (description, find, replace, expected count | None = "at least one")
PATCHES = [
    ('deck title',
     '<title>From Boxes to Masks — Grounded Document Understanding</title>',
     f'<title>{TITLE}</title>', 1),

    # his assets live one directory down in this repo
    ('asset paths',        'src="assets/',           'src="grounding/assets/',           None),
    ('interactive src',    'data-src="interactive/', 'data-src="grounding/interactive/', None),
    ('interactive href',   'href="interactive/',     'href="grounding/interactive/',     None),

    # a 75-slide deck should not leave 75 entries in the browser's back history
    ('history handling',
     "    i=n; location.hash=String(n+1);",
     "    // replaceState, not location.hash: one entry per slide would otherwise\n"
     "    // fill the browser's back history for the whole talk.\n"
     "    i=n; history.replaceState(null,'','#'+(n+1));", 1),

    # the closing slide covers the whole talk now, not just the grounding half
    ('closing links',
     '<p class="sub" style="margin-top:1.8vh">m3grounder.github.io · docog-eccv.github.io · doclayoutvl.github.io</p>',
     '<p class="sub" style="margin-top:1.8vh">replica-agents.github.io · m3grounder.github.io<br>docog-eccv.github.io · doclayoutvl.github.io</p>', 1),
    ('closing venues',
     '<p class="sub" style="font-size:1.85vh;margin-top:2.6vh">M3Grounder (CVPR 2026)',
     '<p class="sub" style="font-size:1.85vh;margin-top:2.6vh">REPLICA (ICDAR 2026, Oral) · M3Grounder (CVPR 2026)', 1),
]

# What src/replica.js and src/replica.css rely on in Sai's engine and CSS.
# If any of these disappear the REPLICA interactive slides stop stepping.
CONTRACT = [
    ("querySelectorAll('.slide')", 'engine: collects slides by .slide'),
    ("querySelectorAll('.frag')",  'engine: collects build-ups by .frag'),
    ("classList.toggle('on'",      'engine: marks the current slide with .on'),
    ("'show'",                     'engine: marks revealed build-ups with .show'),
    ('id="deck"',                  'markup: the observer watches #deck'),
    ('.frag{',                     'CSS: .frag / .frag.show drive every build-up'),
    ('.iframe-slide',              'CSS+engine: the live-figure slides'),
]


def die(msg: str) -> None:
    sys.exit(f'build failed: {msg}')


def slice_between(text: str, start: str, end: str, what: str) -> str:
    if text.count(start) != 1 or text.count(end) < 1:
        die(f'could not locate {what} in the upstream deck '
            f'(marker {start!r} appears {text.count(start)}×)')
    a = text.index(start) + len(start)
    return text[a: text.index(end, a)]


def global_classes(css: str) -> set[str]:
    """Classes a stylesheet styles *unconditionally* — i.e. a rule whose whole
    selector is one bare class, like `.doc{...}`.

    Scoped selectors are excluded on purpose. `.slide.on` and `.qdot.on` both
    mention `on`, and `.hero .sub` and `.atcard .hd .sub` both mention `sub`,
    but neither pair can ever match the other's elements. Only a bare class can
    reach across from one half of the deck into the other.
    """
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    names = set()
    for block in re.findall(r'([^{}]+)\{', css):
        for sel in block.split(','):
            sel = re.sub(r'::?[\w-]+(\([^)]*\))?', '', sel).strip()
            m = re.fullmatch(r'\.([A-Za-z][\w-]*)', sel)
            if m:
                names.add(m.group(1))
    return names


def main() -> None:
    up_file = UPSTREAM / 'index.html'
    if not up_file.exists():
        die(f'{up_file} not found — run ./sync.sh first')

    up = up_file.read_text(encoding='utf-8')

    for token, why in CONTRACT:
        if token not in up:
            die(f'upstream no longer contains {token!r} — {why}')

    for desc, find, repl, n in PATCHES:
        found = up.count(find)
        if n is None:
            if found == 0:
                die(f'patch {desc!r} matched nothing upstream')
        elif found != n:
            die(f'patch {desc!r} expected {n} match(es) upstream, found {found}')
        up = up.replace(find, repl)

    head       = slice_between(up, '<!DOCTYPE html>', '<style>', 'the document head')
    up_css     = slice_between(up, '<style>', '</style>', 'the upstream stylesheet')
    up_slides  = slice_between(up, '<div class="deck" id="deck">', '\n</div>\n', 'the upstream slides')
    up_engine  = slice_between(up, '<script>', '</script>', 'the upstream engine')

    rep_css    = (SRC / 'replica.css').read_text(encoding='utf-8')
    rep_slides = (SRC / 'replica.slides.html').read_text(encoding='utf-8')
    rep_js     = (SRC / 'replica.js').read_text(encoding='utf-8')

    clash = global_classes(up_css) & global_classes(rep_css)
    if clash:
        die('these class names are now defined by BOTH stylesheets and would '
            'fight each other: ' + ', '.join(sorted(clash)) +
            '\n  → rename them in src/replica.css')

    out = ('<!DOCTYPE html>' + head + '<style>' + up_css.rstrip('\n') + '\n\n'
           + rep_css.rstrip('\n') + '\n</style>\n</head>\n<body>\n'
           + '<div class="deck" id="deck">\n\n'
           + rep_slides.rstrip('\n') + '\n\n'
           + up_slides.lstrip('\n').rstrip('\n') + '\n'
           + '\n</div>\n\n<div id="bar"></div><div id="count"></div>\n\n'
           + '<script>' + up_engine.rstrip('\n') + '\n</script>\n'
           + '<script>\n' + rep_js.rstrip('\n') + '\n</script>\n'
           + '</body>\n</html>\n')

    OUT.write_text(out, encoding='utf-8')

    # keep his figures and interactive apps in step with his markup
    for name in ('assets', 'interactive'):
        src, dst = UPSTREAM / name, ROOT / 'grounding' / name
        if not src.exists():
            die(f'upstream is missing {name}/')
        shutil.rmtree(dst, ignore_errors=True)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns('.DS_Store'))

    n_rep = rep_slides.count('<section class="slide')
    n_up  = up_slides.count('<section class="slide')
    print(f'built {OUT.name}: {n_rep} REPLICA + {n_up} grounding = {n_rep + n_up} slides')
    print(f'upstream figures synced to grounding/')


if __name__ == '__main__':
    main()
