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
    const box = f.parentElement, W = 433, H = 774;
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
    setTimeout(fitQual, 60);
  }

  /* ---------- drive everything off the engine's fragment state ---------- */
  buildResults();
  function sync(){
    const s = document.querySelector('.slide.on'); if(!s) return;
    const n = s.querySelectorAll('.frag.show').length;
    if(s.id === 'ladderSlide') renderLadder(n);
    else if(s.id === 'stagesSlide') renderStages(n);
    else if(s.id === 'resSlide') renderResults(n);
    else if(s.id === 'qualSlide') renderQual(n);
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
  addEventListener('resize', fitQual);
  sync();
})();
