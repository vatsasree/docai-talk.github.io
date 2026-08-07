
(function(){
  const slides=[...document.querySelectorAll('.slide')];
  const deck=document.getElementById('deck');
  const bar=document.getElementById('bar'), count=document.getElementById('count');
  let i=Math.max(0,Math.min(slides.length-1,(parseInt(location.hash.slice(1),10)||1)-1));
  const ALL=location.search.includes('all');
  function frags(s){return [...s.querySelectorAll('.frag')]}
  function loadIframe(s){
    const f=s.querySelector('iframe[data-src]');
    if(f && !f.src){f.src=f.dataset.src}
  }
  function show(n,revealAll){
    slides.forEach((s,j)=>s.classList.toggle('on',j===n));
    frags(slides[n]).forEach(el=>el.classList.toggle('show',ALL||!!revealAll));
    loadIframe(slides[n]);
    // replaceState, not location.hash: one entry per slide would otherwise
    // fill the browser's back history for the whole talk.
    i=n; history.replaceState(null,'','#'+(n+1));
    bar.style.width=((n+1)/slides.length*100)+'%';
    count.textContent=(n+1)+' / '+slides.length;
  }
  function next(){
    const f=frags(slides[i]).filter(el=>!el.classList.contains('show'));
    if(f.length){f[0].classList.add('show');return}
    if(i<slides.length-1)show(i+1,false);
  }
  function prev(){
    const f=frags(slides[i]).filter(el=>el.classList.contains('show'));
    if(f.length){f[f.length-1].classList.remove('show');return}
    if(i>0)show(i-1,true);
  }
  window.deckNext=next; window.deckPrev=prev;
  document.querySelectorAll('.iframe-slide').forEach(s=>{
    const nb=document.createElement('div'); nb.className='navbtns';
    const b1=document.createElement('button'); b1.textContent='‹'; b1.onclick=e=>{e.stopPropagation();prev()};
    const b2=document.createElement('button'); b2.textContent='›'; b2.onclick=e=>{e.stopPropagation();next()};
    nb.append(b1,b2); s.appendChild(nb);
  });
  addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){e.preventDefault();next()}
    else if(e.key==='ArrowLeft'||e.key==='Backspace'||e.key==='PageUp'){e.preventDefault();prev()}
    else if(e.key==='Home')show(0,false);
    else if(e.key==='End')show(slides.length-1,true);
    else if(e.key==='f'||e.key==='F'){document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}
    else if(e.key==='g'||e.key==='G'){deck.classList.toggle('overview')}
  });
  deck.addEventListener('click',e=>{
    if(deck.classList.contains('overview')){
      const s=e.target.closest('.slide');
      if(s){deck.classList.remove('overview');show(slides.indexOf(s),false)}
      return;
    }
    if(e.target.closest('a'))return;
    if(e.target.closest('.iframe-slide'))return;
    (e.clientX>innerWidth*.35)?next():prev();
  });
  addEventListener('hashchange',()=>{
    const n=(parseInt(location.hash.slice(1),10)||1)-1;
    if(n!==i&&n>=0&&n<slides.length)show(n,false);
  });
  show(i,false);
})();
