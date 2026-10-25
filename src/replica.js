/* ===================== REPLICA interactive components =====================
   The deck engine above reveals `.frag` elements one at a time. These four
   slides read that count and redraw themselves, so a build-up and a live
   component step together off the same key press. */
(function(){
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- the fidelity ladder ---------- */
  const LADDER = [
    '<b>Level 0 · text only.<\/b> Every word is present and in order — but the heading, the table and the total are indistinguishable, and the output has <i>no page<\/i>: its shape does not match the original at all.',
    '<b>Level 1 · + logical structure.<\/b> Headings, table rows and columns are marked up. Machine-readable — but still no geometry, so the page shape still does not match.',
    '<b>Level 2 · + physical position.<\/b> The page now has the <b>same dimensions as the source<\/b>, the two-column body is back, and numbers align under their headers. You can finally tell which number belongs to which item.',
    '<b>Level 3 · + visual fidelity.<\/b> Typography, weight, colour — and the strikethrough and the OVERDUE stamp. The reconstruction is now <b>identical to the original<\/b>: only here does the cancelled line read as cancelled.'
  ];
  (function buildLadder(){
    const src = $('#ladderSrc'), box = $('#ladderBox');
    if(!src || !box) return;
    const clone = src.cloneNode(true);
    clone.id = 'ladderDoc'; clone.className = 'doc';   // starts at level 0
    box.appendChild(clone);
  })();
  function renderLadder(n){
    const doc = $('#ladderDoc'); if(!doc) return;
    const lv = Math.max(0, Math.min(n, 3));
    $('#ladderBox').classList.toggle('sized', lv >= 2);   // geometry starts at L2
    // from L2 the reconstruction takes the source page's exact width and
    // aspect — outline both so the audience sees the dimensions agree
    document.querySelector('#ladderSlide .lad').classList.toggle('matched', lv >= 2);
    doc.classList.toggle('L1', lv >= 1);                  // cumulative
    doc.classList.toggle('L2', lv >= 2);
    doc.classList.toggle('L3', lv >= 3);
    $$('#ladderSlide .lvstep').forEach((s,i)=>{
      s.classList.toggle('on', i === lv);
      s.classList.toggle('done', i < lv);
    });
    $('#ladderWhat').innerHTML = LADDER[lv];
  }

  /* ---------- pipeline stages: one open at a time ---------- */
  function renderStages(n){
    const open = Math.min(n + 1, 4);
    $$('#stageRow .stagecard').forEach((c,i)=>{
      c.classList.toggle('seen', i + 1 <= open);
      c.classList.toggle('open', i + 1 === open);
    });
  }

  /* ---------- main results table (paper Table 2) ---------- */
  // v = [WRR, CRR, NTED, LPS, GPS, VFS, OS]
  const GROUPS = [
    { name:'Pipeline tools', rows:[
      { m:'Marker',  v:[0.68,0.82,0.61,0.19,0.34,0.74,0.53] },
      { m:'Docling', v:[0.40,0.49,0.62,0.17,0.26,0.55,0.38] } ]},
    { name:'Expert VLMs', rows:[
      { m:'GOT-OCR-2.0',     v:[0.36,0.39,0.93,0.15,0.25,0.70,0.32] },
      { m:'rolmOCR',         v:[0.54,0.67,0.95,0.15,0.07,0.56,0.34] },
      { m:'olmOCR',          v:[0.49,0.64,0.93,0.21,0.09,0.33,0.31] },
      { m:'smolDocling',     v:[0.37,0.54,0.89,0.16,0.23,0.54,0.28] },
      { m:'Nanonets-OCR-s',  v:[0.25,0.42,0.94,0.18,0.10,0.56,0.26] },
      { m:'ChatDoc-OCRFlux', v:[0.30,0.38,0.88,0.15,0.24,0.44,0.27] } ]},
    { name:'General VLMs', rows:[
      { m:'GPT-5',          v:[0.65,0.79,0.49,0.21,0.43,0.86,0.58] },
      { m:'Qwen3-VL',       v:[0.66,0.79,0.59,0.22,0.30,0.43,0.47] },
      { m:'Gemini-2.5-Pro', v:[0.67,0.42,0.56,0.14,0.31,0.82,0.47] },
      { m:'Gemma3',         v:[0.58,0.59,0.85,0.19,0.25,0.38,0.36] },
      { m:'InternVL3',      v:[0.06,0.30,0.82,0.19,0.29,0.31,0.22] } ]},
    { name:'Screenshot → HTML', rows:[
      { m:'Webcode2m',           v:[0.33,0.45,0.82,0.15,0.29,0.39,0.30] },
      { m:'Waffle VLM Websight', v:[0.14,0.42,0.84,0.11,0.29,0.19,0.22] } ]},
    { name:'Ours', ours:true, rows:[
      { m:'Ours', v:[0.88,0.93,0.20,0.73,0.86,0.93,0.86], ours:true } ]}
  ];
  // column 0 is the method name; 1..7 are the metrics above
  const AXES = [
    { ax:'TE', cols:[1,2] }, { ax:'LS', cols:[3] }, { ax:'PS', cols:[4,5] },
    { ax:'VF', cols:[6] },   { ax:'OS', cols:[1,2,3,4,5,6,7] }
  ];
  // cells the spoken takeaway names — outlined so the claim and the table agree
  const MARKS = { PS:[['Qwen3-VL',4],['GPT-5',5]], VF:[['GPT-5',6],['Gemini-2.5-Pro',6]], TE:[['Marker',1]] };

  function buildResults(){
    const t = $('#resTable'); if(!t) return;
    const head =
      '<thead>' +
      '<tr><th class="gh m"><\/th>' +
      '<th class="gh b" colspan="2" data-ax="TE">Text extraction<\/th>' +
      '<th class="gh b" data-ax="LS">Logical structure<\/th>' +
      '<th class="gh b" colspan="2" data-ax="PS">Physical structure<\/th>' +
      '<th class="gh b" data-ax="VF">Visual fidelity<\/th>' +
      '<th class="gh b" data-ax="OS">Overall<\/th><\/tr>' +
      '<tr class="hd2"><th class="m">Method<\/th>' +
      ['WRR ↑','CRR ↑','NTED ↓','LPS ↑','GPS ↑','VFS ↑','OS ↑']
        .map((c,i)=>`<th data-c="${i+1}">${c}<\/th>`).join('') +
      '<\/tr><\/thead>';
    let body = '<tbody>';
    GROUPS.forEach((g,gi)=>{
      // rank within the category so the collapsed view shows its best system
      const order = [...g.rows].sort((a,b)=>b.v[6]-a.v[6]);
      const best = order[0];
      if(!g.ours){
        body += `<tr class="cat" data-g="${gi}"><td colspan="8">` +
                `<span class="car">▸<\/span>${g.name}` +
                `<span class="cn">${g.rows.length} systems — showing best<\/span><\/td><\/tr>`;
      }
      g.rows.forEach(r=>{
        const extra = (!g.ours && r !== best) ? ' xtra' : '';
        body += `<tr class="row${extra}${r.ours?' ours':''}" data-g="${gi}" data-m="${r.m}">` +
                `<td class="m" data-c="0">${r.m}<\/td>` +
                r.v.map((x,i)=>`<td data-c="${i+1}">${x.toFixed(2)}<\/td>`).join('') + '<\/tr>';
      });
    });
    t.innerHTML = head + body + '<\/tbody>';
    t.querySelectorAll('tr.cat').forEach(tr=>{
      tr.addEventListener('click', e=>{
        e.stopPropagation();
        const g = tr.dataset.g, open = tr.classList.toggle('open');
        tr.querySelector('.car').textContent = open ? '▾' : '▸';
        tr.querySelector('.cn').textContent  = open
          ? t.querySelectorAll(`tr.row[data-g="${g}"]`).length + ' systems'
          : t.querySelectorAll(`tr.row[data-g="${g}"]`).length + ' systems — showing best';
        t.querySelectorAll(`tr.xtra[data-g="${g}"]`).forEach(r=>r.classList.toggle('open', open));
      });
    });
  }
  function expandFor(method){
    const t = $('#resTable');
    const row = t && t.querySelector(`tr.row[data-m="${method}"]`);
    if(!row || !row.classList.contains('xtra') || row.classList.contains('open')) return;
    const cat = t.querySelector(`tr.cat[data-g="${row.dataset.g}"]`);
    if(cat) cat.click();
  }
  function renderResults(n){
    const t = $('#resTable'); if(!t) return;
    t.querySelectorAll('td,th').forEach(c=>c.classList.remove('lit','q','mark','good'));
    t.classList.toggle('focus', n > 0);
    if(n <= 0) return;
    const step = AXES[Math.min(n,AXES.length) - 1];
    const live = new Set(step.cols);
    t.querySelectorAll('td[data-c],th[data-c]').forEach(c=>{
      const ci = +c.dataset.c;
      if(ci === 0) return;
      c.classList.add(live.has(ci) ? 'lit' : 'q');
    });
    t.querySelectorAll('th.gh[data-ax]').forEach(h=>{
      h.classList.add(h.dataset.ax === step.ax || step.ax === 'OS' ? 'lit' : 'q');
    });
    (MARKS[step.ax] || []).forEach(([m,ci])=>{
      expandFor(m);
      const row = t.querySelector(`tr.row[data-m="${m}"]`);
      const cell = row && row.querySelector(`td[data-c="${ci}"]`);
      if(cell) cell.classList.add('mark');
    });
    if(step.ax === 'OS'){
      t.querySelectorAll('tr.ours td[data-c]').forEach(c=>{
        if(+c.dataset.c > 0) c.classList.add('good');
      });
    }
    // Final beat: a flat table gives the audience nothing to scan while the
    // speaker talks. Grade every cell instead, so the collapse on position
    // reads as a block of red and REPLICA's row stays the one gold line.
    const graded = step.ax === 'OS';
    t.classList.toggle('graded', graded);
    const legend = document.getElementById('resLegend');
    if(legend) legend.classList.toggle('on', graded);
    if(!graded) return;
    t.querySelectorAll('td,th').forEach(c=>c.classList.remove('lit','q'));
    t.querySelectorAll('tbody tr.row').forEach(tr=>{
      tr.querySelectorAll('td[data-c]').forEach(c=>{
        const ci = +c.dataset.c;
        if(ci === 0) return;
        const v = parseFloat(c.textContent);
        if(isNaN(v)) return;
        // NTED is the one column where lower is better
        const good = (ci === 3) ? 1 - v : v;
        c.classList.add('g' + (good < 0.30 ? 0 : good < 0.55 ? 1 : good < 0.75 ? 2 : 3));
      });
    });
  }

  /* ---------- qualitative pairs ---------- */
  const QUAL = [
    { img:'IndicDLP_1',   cap:'government notice · Gujarati, tabular' },
    { img:'X51005621482', cap:'retail receipt · dense small type' },
    { img:'00000087',     cap:'multi-column magazine spread' },
    { img:'LoRaLay_1',    cap:'scientific paper · figures &amp; equations' }
  ];
  (function buildDots(){
    const d = $('#qualDots'); if(!d) return;
    d.innerHTML = QUAL.map((_,i)=>`<span class="qdot${i?'':' on'}"><\/span>`).join('');
  })();
  // The source scan and the FID-HTML render must occupy the *same rectangle* on
  // screen. A size difference between them reads as a layout error in the
  // reconstruction, which is the one thing this slide must not suggest. So:
  // measure the rendered page, then force both sides into one rect taken from
  // the source image's own aspect.
  const docSizes = {};
  function measureDoc(url){
    // only successful measurements are cached — caching a failure would pin the
    // wrong size for the rest of the talk
    if(docSizes[url]) return Promise.resolve(docSizes[url]);
    return new Promise(resolve => {
      const probe = document.createElement('iframe');
      // 20px, not the display size: scrollWidth/scrollHeight can never report
      // smaller than the frame itself, so measuring inside a full-size frame
      // just returns the frame — and then feeds that back as the next size.
      probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:20px;height:20px;border:0';
      probe.onload = () => {
        // These pages declare their page box on <body> (width:1654px;height:2339px).
        // Read that rather than scroll overflow, which collapses to the frame
        // whenever the page happens not to overflow it.
        const read = () => {
          const d = probe.contentDocument;
          if(!d || !d.body) return null;
          const w = Math.max(d.body.offsetWidth, d.body.scrollWidth, d.documentElement.scrollWidth);
          const h = Math.max(d.body.offsetHeight, d.body.scrollHeight, d.documentElement.scrollHeight);
          return (w > 40 && h > 40) ? [w, h] : null;
        };
        const finish = dim => {
          probe.remove();
          if(dim) docSizes[url] = dim;
          resolve(dim);
        };
        // a large page may not have laid out at load; give it a few chances
        let tries = 0;
        (function attempt(){
          const dim = read();
          if(dim || ++tries > 6) finish(dim);
          else setTimeout(attempt, 120);
        })();
      };
      probe.onerror = () => { probe.remove(); resolve(docSizes[url] = null); };
      document.body.appendChild(probe);
      probe.src = url;
    });
  }

  function fitQual(){
    const img = $('#qualImg'), f = $('#qualFrame');
    if(!img || !f || !img.naturalWidth) return;
    const box = f.parentElement;
    const bw = box.clientWidth, bh = box.clientHeight;
    if(!bw || !bh) return;

    // one shared rectangle, sized from the source page
    const ar = img.naturalWidth / img.naturalHeight;
    const rw = Math.min(bw, bh * ar), rh = rw / ar;
    Object.assign(img.style, {width:rw + 'px', height:rh + 'px', objectFit:'fill',
                             maxWidth:'none', maxHeight:'none'});

    // If the page could not be measured — opened over file://, or any context
    // where the frame counts as cross-origin — fall back to the scan's own
    // pixel size. The FID-HTML page is authored to the source page's
    // dimensions, so this is the right number, and it keeps the render from
    // collapsing to an iframe's default 300x150 and showing one corner.
    const [dw, dh] = docSizes[f.getAttribute('src')] || [img.naturalWidth, img.naturalHeight];
    // scale each axis onto that rect. Page and scan agree to within a couple of
    // pixels, so this is imperceptible — and it makes the two rectangles exactly
    // equal rather than nearly equal.
    Object.assign(f.style, {
      width: dw + 'px', height: dh + 'px', transformOrigin: 'top left',
      transform: 'scale(' + (rw / dw) + ',' + (rh / dh) + ')',
      left: Math.round((bw - rw) / 2) + 'px',
      top:  Math.round((bh - rh) / 2) + 'px'
    });
  }

  function renderQual(n){
    const q = QUAL[Math.max(0, Math.min(n, QUAL.length - 1))];
    const img = $('#qualImg'), fr = $('#qualFrame');
    if(!img || !fr) return;
    const isrc = 'replica/static/images/qual/' + q.img + '.png';
    const hsrc = 'replica/static/images/qual/' + q.img + '_corrected.html';
    if(!img.getAttribute('src').endsWith(isrc)) img.setAttribute('src', isrc);
    if(!fr.getAttribute('src').endsWith(hsrc)) fr.setAttribute('src', hsrc);
    $('#qualCap').innerHTML = q.cap;
    $$('#qualDots .qdot').forEach((d,i)=>d.classList.toggle('on', i === Math.min(n, QUAL.length-1)));
    if(img.decode) img.decode().then(fitQual).catch(()=>{});
    else img.addEventListener('load', fitQual, {once:true});
    measureDoc(hsrc).then(() => { fitQual(); setTimeout(fitQual, 120); });
    fr.addEventListener('load', fitQual, {once:true});
  }
  // measure every pair up front, so switching documents never shows a wrong size
  QUAL.forEach(q => measureDoc('replica/static/images/qual/' + q.img + '_corrected.html'));

  /* ---------- VFDR-Bench sample carousel ----------
     Thirty real pages from the benchmark, grouped by document type. The centre
     page is shown as large as the slide allows; the two either side sit behind
     it so the audience still reads it as a collection. It advances on its own
     so the speaker never has to drive it. */
  const VFDR = [
    ['Newspapers & periodicals', [
      [3,'National daily','English · dense multi-column'],
      [22,'Letters page','English · editorial columns'],
      [18,'Feature spread','English · dark art-directed layout'],
      [28,'Illustrated weekly','Chinese · full-bleed photography'],
      [8,'Photo essay','Chinese · image-led with captions'] ]],
    ['Government & official records', [
      [1,'Birth certificate','Hindi + English · seals, QR, barcode'],
      [11,'University tender notice','English · letterhead, stamp, signature'],
      [19,'Ministry memorandum','English · degraded carbon scan'],
      [9,'Regulatory report','English · statutory tables'],
      [15,'Application form','Japanese · boxed fields and flowchart'] ]],
    ['Textbooks & examination papers', [
      [4,'Primary worksheet','English · colour blocks, exercises'],
      [13,'Chemistry paper','Chinese · formulae and diagrams'],
      [16,'Medical examination','Hebrew · right-to-left script'],
      [17,'Clinical MCQs','English · numbered option lists'],
      [23,'School textbook','Hindi · highlighted passages'] ]],
    ['Business, finance & marketing', [
      [10,'Financial statement','English · wide dense spreadsheet'],
      [14,'Scanned invoice','English · handwriting and rubber stamps'],
      [24,'Corporate feature','Chinese · article plus full-page advert'],
      [29,'Industry report','English · pull-quotes and infographics'],
      [30,'Card benefits leaflet','Spanish · brand colour, bulleted offers'] ]],
    ['Indic & archival material', [
      [5,'Community bulletin','Kannada · decorative border, photo'],
      [20,'Archival record','Gujarati · aged paper'],
      [21,'Manuscript page','Tamil · aged paper, tight leading'],
      [25,'Health circular','Bengali · illustration with body text'],
      [27,'Isa Upanishad','Sanskrit + English · verse and commentary'] ]],
    ['Magazines & lifestyle', [
      [2,'Skills-mission feature','English · infographic panels'],
      [6,'Culture magazine','Malayalam · reversed-out dark page'],
      [7,'Food feature','English · illustrated dishes, tinted ground'],
      [12,'Wellness column','Chinese · pastel panels, sidebars'],
      [26,'Assembly manual','Danish · technical line drawings'] ]]
  ];
  const EXT = {16:'png'};                       // one sample came out of the PDF as PNG
  const flat = [];
  VFDR.forEach(([g, items], gi) => items.forEach(([n, t, d]) =>
    flat.push({gi, group:g, n, title:t, detail:d,
               src:'replica/static/images/vfdr/s' + String(n).padStart(2,'0') + '.' + (EXT[n] || 'jpeg')})));

  (function carousel(){
    const stage = document.getElementById('caroStage');
    if(!stage) return;
    const slide = document.getElementById('vfdrSlide');
    const tabs  = document.getElementById('caroTabs');
    const cap   = document.getElementById('caroCap');
    const dots  = document.getElementById('caroDots');
    const state = document.getElementById('caroState');
    const LAST  = flat.length - 1;
    let cur = 0, timer = null, userPaused = false, hoverPaused = false;

    VFDR.forEach(([g, items], gi) => {
      const b = document.createElement('button');
      b.className = 'carotab';
      b.innerHTML = g + '<span class="n">' + items.length + '<\/span>';
      b.addEventListener('click', e => { e.stopPropagation(); go(flat.findIndex(f => f.gi === gi)); });
      tabs.appendChild(b);
    });
    flat.forEach((f, i) => {
      const d = document.createElement('span');
      d.className = 'carodot';
      d.addEventListener('click', e => { e.stopPropagation(); go(i); });
      dots.appendChild(d);
      const el = document.createElement('div');
      el.className = 'caroitem off';
      // not lazy: off-stage items never enter the viewport, so a lazy image
      // would still be blank at the moment it slides into the centre
      el.innerHTML = '<img src="' + f.src + '" alt="' + f.title + ' — ' + f.detail + '">';
      el.addEventListener('click', e => { if(i === cur){ e.stopPropagation(); zoom(f); } });
      stage.appendChild(el);
      f.el = el;
    });

    // three pages side by side, all fully legible — the neighbours are only
    // slightly smaller, not faded, so the audience can read all three
    const SLOT = [{dx:-0.55, sc:0.80, op:1, z:2},
                  {dx: 0,    sc:1.00, op:1, z:5},
                  {dx: 0.55, sc:0.80, op:1, z:2}];
    function layout(){
      const H = stage.clientHeight, W = stage.clientWidth;
      if(!H) return;
      flat.forEach((f, i) => {
        const rel = i - cur;
        const el = f.el;
        // clear the inline opacity too — a class cannot override an inline style,
        // so an item leaving the stage would otherwise stay on screen
        if(Math.abs(rel) > 1){ el.classList.add('off'); el.style.opacity = '0'; return; }
        el.classList.remove('off');
        const s = SLOT[rel + 1];
        const im = el.querySelector('img');
        const ar = (im.naturalWidth && im.naturalHeight) ? im.naturalWidth / im.naturalHeight : 0.72;
        const h = H * 0.98, w = h * ar;
        el.style.height = h + 'px'; el.style.width = w + 'px';
        el.style.zIndex = s.z; el.style.opacity = s.op;
        el.classList.toggle('mid', rel === 0);
        el.style.transform = 'translate(-50%,-50%) translateX(' + (s.dx * W * 0.5) + 'px) scale(' + s.sc + ')';
      });
      const f = flat[cur];
      cap.innerHTML = '<span class="t">' + f.title + '<\/span><span class="d">' + f.detail +
                      '<\/span><span class="ix">' + (cur + 1) + ' / ' + flat.length + '<\/span>';
      [...tabs.children].forEach((t, gi) => t.classList.toggle('on', gi === f.gi));
      [...dots.children].forEach((d, i) => d.classList.toggle('on', i === cur));
    }

    // The set does not wrap. It plays from the first page to the last and stops
    // there; the speaker is walking a collection, not spinning a wheel.
    const running = () => !userPaused && !hoverPaused && cur < LAST;
    function paint(){
      if(!state) return;
      state.textContent = cur >= LAST ? '● end of set'
                        : running()   ? '▶ playing'
                                      : '❚❚ paused';
      state.className = 'carostate' + (running() ? ' on' : '');
    }
    function restart(){
      clearInterval(timer); timer = null;
      if(running()) timer = setInterval(() => step(1), 2600);
      paint();
    }
    function step(d){
      const n = Math.min(LAST, Math.max(0, cur + d));
      if(n === cur){ restart(); return; }      // already at an end — stay put
      cur = n; layout(); restart();
    }
    function go(i){ cur = Math.min(LAST, Math.max(0, i)); layout(); restart(); }

    function zoom(f){
      let z = document.getElementById('caroZoom');
      if(!z){
        z = document.createElement('div'); z.id = 'caroZoom';
        z.innerHTML = '<img><div class="z-cap"><\/div>';
        z.addEventListener('click', () => { z.classList.remove('on'); hoverPaused = false; restart(); });
        document.body.appendChild(z);
      }
      z.querySelector('img').src = f.src;
      z.querySelector('.z-cap').textContent = f.title + ' — ' + f.detail + '  ·  click to close';
      z.classList.add('on');
      hoverPaused = true; clearInterval(timer); timer = null; paint();
    }

    // Shift+← / Shift+→ walk the set and pause it; P toggles play/pause. Plain
    // arrows are left to the deck, so moving on is the same key as everywhere
    // else in the talk.
    addEventListener('keydown', e => {
      if(e.metaKey || e.ctrlKey || e.altKey) return;
      if(document.querySelector('.slide.on') !== slide) return;
      if(e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')){
        e.preventDefault(); e.stopImmediatePropagation();
        userPaused = true;
        step(e.key === 'ArrowRight' ? 1 : -1);
      } else if(e.key === 'p' || e.key === 'P'){
        e.preventDefault(); e.stopImmediatePropagation();
        userPaused = !userPaused;
        if(!userPaused && cur >= LAST){ cur = 0; layout(); }   // replay from the top
        restart();
      }
    }, true);

    stage.addEventListener('mouseenter', () => { hoverPaused = true; restart(); });
    stage.addEventListener('mouseleave', () => { hoverPaused = false; restart(); });
    addEventListener('resize', layout);
    // only run while the slide is on screen
    window.__vfdrSync = on => {
      if(on){ layout(); restart(); } else { clearInterval(timer); timer = null; }
    };
    // each page has its own aspect; re-lay out as they arrive
    flat.forEach(f => f.el.querySelector('img').addEventListener('load', layout));
  })();

  /* ---------- live figures: preload, fit, and keyboard control ----------
     Three separate complaints, one place:
       · transitions into a demo felt jerky — the iframe only started loading
         when the slide appeared, so the first frame was blank
       · the pipeline demo scrolled instead of fitting on screen
       · the figures could not be driven from the keyboard / presenter remote */

  // Load the next slide's figure while the current one is still on screen.
  function preloadNeighbours(){
    const all = [...document.querySelectorAll('.slide')];
    const i = all.findIndex(s => s.classList.contains('on'));
    [i + 1, i + 2, i - 1].forEach(j => {
      const s = all[j]; if(!s) return;
      const f = s.querySelector('iframe[data-src]');
      if(f && !f.src) f.src = f.dataset.src;
    });
  }

  // Figures declared with data-fit="W H" are scaled to fit whole, never scrolled.
  function fitFigures(){
    document.querySelectorAll('.slide.on iframe[data-fit]').forEach(f => {
      const [W, H] = f.dataset.fit.split(/\s+/).map(Number);
      const box = f.parentElement;
      const sc = Math.min(box.clientWidth / W, box.clientHeight / H);
      Object.assign(f.style, {
        width: W + 'px', height: H + 'px', position: 'absolute',
        transformOrigin: 'top left', transform: 'scale(' + sc + ')',
        left: Math.round((box.clientWidth  - W * sc) / 2) + 'px',
        top:  Math.round((box.clientHeight - H * sc) / 2) + 'px'
      });
      box.style.position = 'relative';
      box.style.overflow = 'hidden';
    });
  }

  const post = (f, msg) => { try{ f.contentWindow.postMessage(msg, '*'); }catch(e){} };

  // data-embednav="nav"  — the figure cycles through its own states, one per
  //                        build-up step, then the deck moves on as usual.
  // data-embednav="demo" — the pipeline walkthrough; it has no fixed number of
  //                        steps, so read its own progress counter to decide
  //                        when a further press should leave the slide.
  const navSeen = {};
  // Readiness has to come from the load event, not from contentDocument. An
  // iframe that has just been given a src still reports the initial about:blank
  // as readyState "complete", so anything posted then goes into a dead document
  // and the figure never moves. Flag every figure on its own load instead.
  document.querySelectorAll('.ifwrap iframe').forEach(f => {
    f.addEventListener('load', () => {
      f.dataset.ready = '1';
      fitFigures();
      (f._waiting || []).forEach(fn => fn());
      f._waiting = [];
    });
  });
  function whenReady(f, fn){
    if(f.dataset.ready) fn();
    else (f._waiting = f._waiting || []).push(fn);
  }

  // Once you click inside a figure, focus lives in that iframe and arrow keys
  // never reach the deck again — the figure looks frozen and so does the talk.
  // The figures are same-origin, so hand their arrow keys back to the deck and
  // let the normal path decide what the press means.
  const RELAY = ['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', ' ', 'Spacebar'];
  function relayKeys(f){
    whenReady(f, () => {
      try{
        f.contentWindow.addEventListener('keydown', e => {
          if(!RELAY.includes(e.key) || e.metaKey || e.ctrlKey || e.altKey) return;
          e.preventDefault();
          e.stopPropagation();   // don't let the figure act on it twice
          // dispatch on body, not window: window listeners fire in registration
          // order at the target phase, so a window-targeted event would reach the
          // deck engine before this file's capture handler could claim it.
          document.body.dispatchEvent(
            new KeyboardEvent('keydown', {key:e.key, bubbles:true, cancelable:true}));
        }, true);
      }catch(err){ /* cross-origin figure — the ‹ › buttons still work */ }
    });
  }
  document.querySelectorAll('.slide[data-embednav] iframe').forEach(relayKeys);
  function driveNav(slide, n){
    const f = slide.querySelector('iframe'); if(!f) return;
    const key = slide.dataset.k || (slide.dataset.k = 'n' + Math.random());
    whenReady(f, () => {
      const was = navSeen[key] || 0;
      const dir = n > was ? 1 : -1;
      for(let i = 0; i < Math.abs(n - was); i++) post(f, {type:'replica:nav', dir});
      navSeen[key] = n;
    });
  }
  function demoAt(f){
    try{
      const el = f.contentDocument.getElementById('pdemoStepCount');
      const m = (el.textContent || '').match(/Stage\s*(\d+).*?(\d+)\s*\/\s*(\d+)/);
      if(m) return {stage:+m[1], beat:+m[2], total:+m[3]};
    }catch(e){}
    return null;
  }
  addEventListener('keydown', e => {
    if(e.metaKey || e.ctrlKey || e.altKey) return;
    const s = document.querySelector('.slide.on');
    if(!s || s.dataset.embednav !== 'demo') return;
    const fwd = e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown';
    const back = e.key === 'ArrowLeft' || e.key === 'PageUp';
    if(!fwd && !back) return;
    const f = s.querySelector('iframe'); if(!f) return;
    // hold the key rather than skipping the slide while the demo is still loading
    if(!f.dataset.ready){ e.preventDefault(); e.stopImmediatePropagation(); return; }
    const at = demoAt(f);
    // let the deck have the key at the very end (forward) or very start (back)
    if(fwd && at && at.stage >= 4 && at.beat >= at.total) return;
    if(back && at && at.stage <= 1 && at.beat <= 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    post(f, {type:'replica:demo', action: fwd ? 'step' : 'back'});
  }, true);

  /* ---------- drive everything off the engine's fragment state ---------- */
  buildResults();
  function sync(){
    const s = document.querySelector('.slide.on'); if(!s) return;
    const n = s.querySelectorAll('.frag.show').length;
    if(s.id === 'ladderSlide') renderLadder(n);
    else if(s.id === 'stagesSlide') renderStages(n);
    else if(s.id === 'resSlide') renderResults(n);
    else if(s.id === 'qualSlide') renderQual(n);
    else if(s.dataset.embednav === 'nav') driveNav(s, n);
    if(window.__vfdrSync) window.__vfdrSync(s.id === 'vfdrSlide');
    preloadNeighbours();
    fitFigures();
  }
  // setTimeout, not requestAnimationFrame: rAF is paused whenever the page is
  // not being painted, which would leave `queued` stuck true and freeze every
  // later update.
  let queued = false;
  new MutationObserver(()=>{
    if(queued) return;
    queued = true;
    setTimeout(()=>{ queued = false; sync(); }, 0);
  }).observe(document.getElementById('deck'), {subtree:true, attributes:true, attributeFilter:['class']});
  addEventListener('resize', ()=>{ fitQual(); fitFigures(); });

  sync();
})();

/* ---------- the hosted REPLICA deck ----------
   One slide of this deck is the ICDAR REPLICA deck in an iframe. While it is on
   screen, the deck's keys step through it first; only when it is at its first or
   last step does the key move this deck. Entering it backwards opens it at its end. */
(function(){
  const sub = document.querySelector('.slide.subdeck'); if(!sub) return;
  const fr = sub.querySelector('iframe');
  const all = [...document.querySelectorAll('.slide')];
  const subIdx = all.indexOf(sub);
  let lastIdx = -1;
  const host = () => { try { return fr.contentWindow && fr.contentWindow.__replicaHost; } catch(e){ return null; } };
  const onIdx = () => all.findIndex(s => s.classList.contains('on'));
  window.addEventListener('keydown', e => {
    lastIdx = onIdx();
    if(!sub.classList.contains('on')) return;
    const k = e.key; let dir = 0;
    if(k==='ArrowRight'||k===' '||k==='Spacebar'||k==='PageDown') dir = 1;
    else if(k==='ArrowLeft'||k==='PageUp') dir = -1;
    else return;
    const h = host(); if(!h) return;
    if(dir > 0 ? h.next() : h.prev()){ e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  // a click or key inside the hosted deck reached its edge: move this deck on
  window.addEventListener('message', e => {
    const d = e.data; if(!d || d.type !== 'replica-host') return;
    window.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', {key: d.dir > 0 ? 'ArrowRight' : 'ArrowLeft', bubbles: true}));
  });
  // entering from a later slide opens the hosted deck at its last step
  new MutationObserver(() => {
    if(!sub.classList.contains('on')) return;
    const h = host(); if(!h) return;
    if(lastIdx > subIdx) h.end(); else if(lastIdx >= 0 && lastIdx < subIdx) h.start();
  }).observe(sub, {attributes: true, attributeFilter: ['class']});
})();

/* ---------- image carousels (.cyc): auto-rotate while their slide is on screen ---------- */
(function(){
  document.querySelectorAll('.cyc').forEach(box => {
    const figs = [...box.querySelectorAll('figure')];
    const dots = box.querySelector('.cycdots');
    if(dots) figs.forEach(() => dots.appendChild(document.createElement('i')));
    let k = 0, timer = null;
    const show = n => { k = (n + figs.length) % figs.length;
      figs.forEach((f,i) => f.classList.toggle('on', i === k));
      if(dots) [...dots.children].forEach((d,i) => d.classList.toggle('on', i === k)); };
    show(0);
    const slide = box.closest('.slide'), ms = +box.dataset.interval || 3600;
    const sync = () => { const on = slide.classList.contains('on');
      if(on && !timer) timer = setInterval(() => show(k + 1), ms);
      if(!on && timer){ clearInterval(timer); timer = null; show(0); } };
    new MutationObserver(sync).observe(slide, {attributes:true, attributeFilter:['class']});
    sync();
  });
})();
