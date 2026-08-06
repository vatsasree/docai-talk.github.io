/* ============================================================================
   bridge.js — chapter ⇄ master navigation

   Each chapter deck keeps its own engine, its own CSS and its own fragment
   logic. This file only handles the seam: when the chapter is asked to step
   past its last build-up (or back before its first), it hands control to the
   master deck instead of doing nothing.

   Contract — the host deck exposes window.__deckAPI:
     next(), prev()          advance / retreat one step (build-up or slide)
     goStart(), goEnd()      jump to the very first / very last step
     state()  -> {index, total, atStart, atEnd}
     clickDir(event) -> 'next' | 'prev' | null    what a click would do

   Opened directly (not in a frame) this is a no-op, so each chapter still
   presents standalone.
   ========================================================================= */
(function () {
  if (window.parent === window) return;
  var api = window.__deckAPI;
  if (!api) return;

  function send(msg) {
    msg.channel = 'docai';
    window.parent.postMessage(msg, '*');
  }
  function report() {
    var s = api.state();
    send({ type: 'state', index: s.index, total: s.total });
  }
  function atBoundary(dir) {
    var s = api.state();
    return dir === 'next' ? s.atEnd : s.atStart;
  }
  // Capture phase, so we get the event before the host deck's own listener and
  // can cancel it outright when we are handing off.
  function handoff(dir, e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    send({ type: 'exit', dir: dir });
  }

  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key, dir = null;
    if (k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'PageDown') dir = 'next';
    else if (k === 'ArrowLeft' || k === 'PageUp' || k === 'Backspace') dir = 'prev';
    if (!dir) return;
    if (atBoundary(dir)) handoff(dir, e);
    else setTimeout(report, 0);
  }, true);

  window.addEventListener('click', function (e) {
    var dir = api.clickDir ? api.clickDir(e) : null;
    if (!dir) return;
    if (atBoundary(dir)) handoff(dir, e);
    else setTimeout(report, 0);
  }, true);

  window.addEventListener('message', function (e) {
    if (e.source !== window.parent) return;
    var d = e.data || {};
    if (d.channel !== 'docai' || d.type !== 'cmd') return;
    if (d.action === 'enter') {
      d.from === 'prev' ? api.goEnd() : api.goStart();
    } else if (d.action === 'next' || d.action === 'prev') {
      // The master forwards keys pressed while *it* holds focus. Check the
      // boundary here too, or a step past the end would silently do nothing
      // and the talk would stall on the chapter's last slide.
      if (atBoundary(d.action)) { send({ type: 'exit', dir: d.action }); return; }
      d.action === 'next' ? api.next() : api.prev();
    }
    setTimeout(report, 0);
  });

  send({ type: 'ready' });
  report();
  window.addEventListener('load', function () { send({ type: 'ready' }); report(); });
})();
