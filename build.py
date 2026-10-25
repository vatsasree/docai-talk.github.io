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

# ------------------------------------------------------------------ team ---
# One team slide after each paper. Photos are optional: drop <slug>.jpg (or
# .png) into team/ and it appears; until then the slide shows initials, so a
# missing photo never looks like a broken slide.
#   ('Display Name', 'photo file in team/', 'marker')
# marker: '*' / '†' / '' — matches the equal-contribution marks on the divider
TEAM = {
    'replica': ('REPLICA', 'var(--replica)', [
        ('Raghuveer R', 'Raghuveer.jpg', '*'),
        ('Anirudh Srinivasan', 'Anirudh.jpg', '*'),
        ('Venkata Kesav Venna', 'Kesav.jpg', '*'),
        ('Sreevatsa S', 'Sreevatsa.jpg', ''),
        ('Aryan Jain', 'Aryan.jpg', ''),
        ('Sahithi Kukkala', 'Sahithi.jpg', ''),
        ('Ravi Kiran Sarvadevabhatla', 'RaviKiran.jpg', ''),
    ]),
    'm3': ('M3Grounder', 'var(--m3)', [
        ('Venkata Kesav Venna', 'Kesav.jpg', '*'),
        ('Sai Madhusudan Gunda', 'SaiMadhu.jpg', '*'),
        ('Jyothi Swaroopa Jinka', 'Swaroopa.jpg', '†'),
        ('Hrithik Sagar Rachakonda', 'Hrithik.png', '†'),
        ('Anirudh Srinivasan', 'Anirudh.jpg', ''),
        ('Ravi Kiran Sarvadevabhatla', 'RaviKiran.jpg', ''),
    ]),
    'docog': ('DoCoG', 'var(--docog)', [
        ('Sai Madhusudan Gunda', 'SaiMadhu.jpg', '*'),
        ('Jyothi Swaroopa Jinka', 'Swaroopa.jpg', '*'),
        ('Hrithik Sagar Rachakonda', 'Hrithik.png', '*'),
        ('Aryan Jain', 'Aryan.jpg', '†'),
        ('Venkata Kesav Venna', 'Kesav.jpg', '†'),
        ('Anirudh Srinivasan', 'Anirudh.jpg', ''),
        ('Ravi Kiran Sarvadevabhatla', 'RaviKiran.jpg', ''),
    ]),
    'dlvl': ('DocLayout-VL', 'var(--dlvl)', [
        ('Venkata Kesav Venna', 'Kesav.jpg', '*'),
        ('Srihari Bandarupalli', 'Srihari.jpg', '*'),
        ('Anirudh Srinivasan', 'Anirudh.jpg', '*'),
        ('Raghuveer R', 'Raghuveer.jpg', ''),
        ('Sai Madhusudan Gunda', 'SaiMadhu.jpg', ''),
        ('Ravi Kiran Sarvadevabhatla', 'RaviKiran.jpg', ''),
    ]),
}


SITES = {'replica': 'replica-agents.github.io', 'm3': 'm3grounder.github.io',
         'docog': 'docog-eccv.github.io', 'dlvl': 'doclayoutvl.github.io'}
AFFIL = {'docog': 'IIIT Hyderabad · BharatGen'}


def team_people(key: str) -> tuple[str, str]:
    paper, accent, members = TEAM[key]
    people = []
    for name, slug, mark in members:
        initials = ''.join(w[0] for w in name.split()[:2]).upper()
        people.append(
            f'<figure class="person">'
            f'<span class="ph"><span class="ini">{initials}</span>'
            f'<img src="team/{slug}" alt="{name}" loading="lazy"'
            f' onerror="this.remove()"></span>'
            f'<figcaption>{name}<sup>{mark}</sup></figcaption></figure>')
    marks = [m for _, _, m in members if m]
    note = ' · '.join(f'{m} equal contribution' for m in sorted(set(marks)))
    return ''.join(people), note


def team_block(key: str) -> str:
    """The team grid that sits INSIDE each paper's title card (one slide per
    paper: card + photos together, so the credits never interrupt the talk)."""
    people, note = team_people(key)
    affil = AFFIL.get(key, 'BharatGen · IIIT Hyderabad')
    return (f'<div class="team">{people}</div>\n'
            f'  <div class="teamfoot">{note} &nbsp;·&nbsp; {affil} '
            f'&nbsp;·&nbsp; {SITES[key]}</div>')


def team_slide(key: str) -> str:
    paper, accent, members = TEAM[key]
    people = []
    for name, slug, mark in members:
        initials = ''.join(w[0] for w in name.split()[:2]).upper()
        # onerror hands over to the initials circle underneath
        people.append(
            f'<figure class="person">'
            f'<span class="ph"><span class="ini">{initials}</span>'
            f'<img src="team/{slug}" alt="{name}" loading="lazy"'
            f' onerror="this.remove()"></span>'
            f'<figcaption>{name}<sup>{mark}</sup></figcaption></figure>')
    marks = [m for _, _, m in members if m]
    note = ('<span class="tiny">' + ' · '.join(
        f'{m} equal contribution' for m in sorted(set(marks))) + '</span>') if marks else ''
    return (f'<!-- ====== TEAM · {paper} ====== -->\n'
            f'<section class="slide" style="--accent:{accent}">\n'
            f'  <div class="kicker">{paper} · the team</div>\n'
            f'  <h2>Built by</h2>\n'
            f'  <div class="team">{"".join(people)}</div>\n'
            f'  <div class="teamfoot">BharatGen · IIIT Hyderabad &nbsp; {note}</div>\n'
            f'</section>\n')


# The loop slide (what flows between REPLICA and the grounding models) goes
# right after the "one recipe" synthesis, before "What made this possible".
LOOP_ANCHOR = '<!-- ====== S1b · WHAT MADE IT POSSIBLE ====== -->'
INCLUDE_LOOP = False   # the loop slide (src/replica.closing.html) is out of the talk

# The paper-title cards sit at the END of each paper's run now (the talk is
# told as a story — the reveal is the punchline), so each team slide anchors
# right after its paper card, before the next section begins.
INSERTS = [
    ('m3 team',    '<!-- ====== ANCHOR · AFTER M3GROUNDER ====== -->', 'm3'),
    ('docog team', '<!-- ====== ANCHOR · AFTER DOCOG ====== -->',      'docog'),
    ('dlvl team',  '<!-- ====== ANCHOR · AFTER DLVL ====== -->',       'dlvl'),
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


def vendor_from_upstream() -> None:
    """Refresh src/grounding.* from Sai's repo. Only run deliberately (./sync.sh),
    never as part of an ordinary build — see the note in main()."""
    up_file = UPSTREAM / 'index.html'
    if not up_file.exists():
        die(f'{up_file} not found — clone it first')
    up = up_file.read_text(encoding='utf-8')
    for token, why in CONTRACT:
        if token not in up:
            die(f'upstream no longer contains {token!r} — {why}')
    for desc, find, repl, n in PATCHES:
        found = up.count(find)
        if n is None:
            if found == 0: die(f'patch {desc!r} matched nothing upstream')
        elif found != n:
            die(f'patch {desc!r} expected {n} match(es) upstream, found {found}')
        up = up.replace(find, repl)
    (SRC / 'grounding.head.html').write_text(
        slice_between(up, '<!DOCTYPE html>', '<style>', 'the document head'), encoding='utf-8')
    (SRC / 'grounding.css').write_text(
        slice_between(up, '<style>', '</style>', 'the upstream stylesheet').rstrip('\n') + '\n', encoding='utf-8')
    (SRC / 'grounding.slides.html').write_text(
        slice_between(up, '<div class="deck" id="deck">', '\n</div>\n', 'the upstream slides').strip('\n') + '\n',
        encoding='utf-8')
    (SRC / 'grounding.engine.js').write_text(
        slice_between(up, '<script>', '</script>', 'the upstream engine').rstrip('\n') + '\n', encoding='utf-8')
    for name in ('assets', 'interactive'):
        src, dst = UPSTREAM / name, ROOT / 'grounding' / name
        if not src.exists():
            die(f'upstream is missing {name}/')
        dst.mkdir(parents=True, exist_ok=True)
        for f in src.rglob('*'):
            if f.is_file() and f.name != '.DS_Store':
                t = dst / f.relative_to(src)
                t.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, t)          # copy in, never delete: files added
                                            # to this repo directly must survive
    print('re-vendored src/grounding.* from upstream')


def main() -> None:
    if '--sync-upstream' in sys.argv:
        vendor_from_upstream()

    # The grounding half is vendored in src/, not re-read from Sai's repo on
    # every build. It has to be: he commits changes straight into THIS repo
    # (new slides, new figures), and rebuilding from his repo would silently
    # throw all of that away. ./sync.sh --sync-upstream is the deliberate step
    # that pulls his repo in and overwrites the vendored copy.
    head       = (SRC / 'grounding.head.html').read_text(encoding='utf-8')
    up_css     = (SRC / 'grounding.css').read_text(encoding='utf-8')
    up_slides  = (SRC / 'grounding.slides.html').read_text(encoding='utf-8')
    up_engine  = (SRC / 'grounding.engine.js').read_text(encoding='utf-8')

    rep_css     = (SRC / 'replica.css').read_text(encoding='utf-8')
    rep_slides  = (SRC / 'replica.slides.html').read_text(encoding='utf-8')
    rep_closing = (SRC / 'replica.closing.html').read_text(encoding='utf-8')
    rep_js      = (SRC / 'replica.js').read_text(encoding='utf-8')

    clash = global_classes(up_css) & global_classes(rep_css)
    if clash:
        die('these class names are now defined by BOTH stylesheets and would '
            'fight each other: ' + ', '.join(sorted(clash)) +
            '\n  → rename them in src/replica.css')

    # team grids live inside the paper cards: one placeholder per paper
    for key in ('m3', 'docog', 'dlvl'):
        ph = f'<!-- TEAM:{key} -->'
        if up_slides.count(ph) != 1:
            die(f'team {key}: placeholder {ph!r} appears {up_slides.count(ph)}× '
                f'in src/grounding.slides.html (expected 1)')
        up_slides = up_slides.replace(ph, team_block(key))
    # the REPLICA half is the hosted ICDAR deck, which carries its own authors;
    # a team grid is injected only if a placeholder is present
    ph = '<!-- TEAM:replica -->'
    if rep_slides.count(ph) == 1:
        rep_slides = rep_slides.replace(ph, team_block('replica'))

    if up_slides.count(LOOP_ANCHOR) != 1:
        die(f'closing slide: anchor {LOOP_ANCHOR!r} appears '
            f'{up_slides.count(LOOP_ANCHOR)}× (expected 1)')
    if INCLUDE_LOOP:
        up_slides = up_slides.replace(
            LOOP_ANCHOR, rep_closing.rstrip('\n') + '\n\n' + LOOP_ANCHOR)

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

    live = lambda t: len(re.findall(r'<section class="slide',
                                    re.sub(r'<!--.*?-->', '', t, flags=re.S)))
    n_rep, n_up = live(rep_slides), live(up_slides)
    print(f'built {OUT.name}: {n_rep} REPLICA + {n_up} grounding '
          f'(team grids inside the paper cards; incl. the loop slide) = {n_rep + n_up} slides')


if __name__ == '__main__':
    main()
