/* ===================== REPLICA interactive components =====================
   The deck engine above reveals `.frag` elements one at a time. These four
   slides read that count and redraw themselves, so a build-up and a live
   component step together off the same key press. */
(function(){
  const $  = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* ---------- the fidelity ladder ---------- */
  const LADDER = [
    '<b>Level 0 · text only.</b> Every word is present and in order — but the heading, the table and the total are indistinguishable, and the output has <i>no page</i>: its shape does not match the original at all.',
    '<b>Level 1 · + logical structure.</b> Headings, table rows and columns are marked up. Machine-readable — but still no geometry, so the page shape still does not match.',
    '<b>Level 2 · + physical position.</b> The page now has the <b>same dimensions as the source</b>, the two-column body is back, and numbers align under their headers. You can finally tell which number belongs to which item.',
    '<b>Level 3 · + visual fidelity.</b> Typography, weight, colour — and the strikethrough and the OVERDUE stamp. The reconstruction is now <b>identical to the original</b>: only here does the cancelled line read as cancelled.'
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
      { m:'REPLICA', v:[0.88,0.93,0.20,0.73,0.86,0.93,0.86], ours:true } ]}
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
      '<tr><th class="gh m"></th>' +
      '<th class="gh b" colspan="2" data-ax="TE">Text extraction</th>' +
      '<th class="gh b" data-ax="LS">Logical structure</th>' +
      '<th class="gh b" colspan="2" data-ax="PS">Physical structure</th>' +
      '<th class="gh b" data-ax="VF">Visual fidelity</th>' +
      '<th class="gh b" data-ax="OS">Overall</th></tr>' +
      '<tr class="hd2"><th class="m">Method</th>' +
      ['WRR ↑','CRR ↑','NTED ↓','LPS ↑','GPS ↑','VFS ↑','OS ↑']
        .map((c,i)=>`<th data-c="${i+1}">${c}</th>`).join('') +
      '</tr></thead>';
    let body = '<tbody>';
    GROUPS.forEach((g,gi)=>{
      // rank within the category so the collapsed view shows its best system
      const order = [...g.rows].sort((a,b)=>b.v[6]-a.v[6]);
      const best = order[0];
      if(!g.ours){
        body += `<tr class="cat" data-g="${gi}"><td colspan="8">` +
                `<span class="car">▸</span>${g.name}` +
                `<span class="cn">${g.rows.length} systems — showing best</span></td></tr>`;
      }
      g.rows.forEach(r=>{
        const extra = (!g.ours && r !== best) ? ' xtra' : '';
        body += `<tr class="row${extra}${r.ours?' ours':''}" data-g="${gi}" data-m="${r.m}">` +
                `<td class="m" data-c="0">${r.m}${r.ours?' <b>(ours)</b>':''}</td>` +
                r.v.map((x,i)=>`<td data-c="${i+1}">${x.toFixed(2)}</td>`).join('') + '</tr>';
      });
    });
    t.innerHTML = head + body + '</tbody>';
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
    d.innerHTML = QUAL.map((_,i)=>`<span class="qdot${i?'':' on'}"></span>`).join('');
  })();
  // the rendered pages have their own page width; scale one to fit its box
  function fitQual(){
    const f = $('#qualFrame'); if(!f) return;
    const box = f.parentElement;
    // Every FID-HTML render has its own page dimensions — a receipt is not a
    // magazine spread. Measure the loaded page rather than assuming one size,
    // or the shorter documents render cropped or letterboxed.
    let W = 433, H = 774;
    try{
      const d = f.contentDocument;
      if(d && d.body){
        const w = Math.max(d.body.scrollWidth, d.documentElement.scrollWidth);
        const h = Math.max(d.body.scrollHeight, d.documentElement.scrollHeight);
        if(w > 40 && h > 40){ W = w; H = h; }
      }
    }catch(e){ /* not readable yet — fall back to the default page size */ }
    const sc = Math.min(box.clientWidth / W, box.clientHeight / H);
    f.style.width = W + 'px'; f.style.height = H + 'px';
    f.style.transform = `scale(${sc})`;
    f.style.left = Math.round((box.clientWidth  - W * sc) / 2) + 'px';
    f.style.top  = Math.round((box.clientHeight - H * sc) / 2) + 'px';
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
    // re-fit once the new page has actually parsed
    fr.addEventListener('load', fitQual, {once:true});
    [60, 260, 700].forEach(t=>setTimeout(fitQual, t));
  }

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
