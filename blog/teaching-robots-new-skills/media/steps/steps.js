/* Step cards: a number on a run chart, a step button or previous/next shows card <div class="step-slot" id="<exp>-<i>">
   in the box under the chart and hides the card shown before. */
(function () {
  function load(slot) {
    slot.querySelectorAll('video[data-src]').forEach(function (v) { if (!v.getAttribute('src')) v.src = v.dataset.src; });
  }
  function mark(exp, id) {
    document.querySelectorAll('[data-step^="' + exp + '-"]').forEach(function (b) {
      if (b.closest('.step-slot')) return;
      var on = b.dataset.step === id;
      b.classList.toggle('on', on);
      if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function show(id, play) {
    var slot = document.getElementById(id); if (!slot || !slot.classList.contains('step-slot')) return;
    var host = slot.parentNode;
    Array.prototype.forEach.call(host.children, function (s) {
      if (s === slot) return;
      s.hidden = true; s.querySelectorAll('video').forEach(function (v) { v.pause(); });
    });
    slot.hidden = false; load(slot);
    mark(host.dataset.exp, id);
    if (play) slot.querySelectorAll('video').forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    var r = host.getBoundingClientRect();
    if (play && (r.top < 0 || r.top > window.innerHeight * 0.8)) host.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  /* Hover card on a chart number: the step's label, its score change and a still of its clip. */
  var tip = document.createElement('div'); tip.className = 'mk-tip'; tip.hidden = true; tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  function tipShow(g) {
    var d = g.dataset, n = d.n === '\u2713' ? '\u2713' : d.n;
    tip.innerHTML = (d.poster ? '<img alt="" src="' + d.poster + '">' : '') +
      '<div class="mk-tip-b"><div class="mk-tip-h"><span class="step-n">' + n + '</span><b></b></div><div class="mk-tip-s"></div>' +
      '<div class="mk-tip-c">Click to show this step below</div></div>';
    tip.querySelector('b').textContent = d.label; tip.querySelector('.mk-tip-s').textContent = d.score;
    tip.hidden = false;
    var r = g.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), document.documentElement.clientWidth - w - 8);
    var y = r.top - h - 10; if (y < 8) y = r.bottom + 10;
    tip.style.left = (x + window.scrollX) + 'px'; tip.style.top = (y + window.scrollY) + 'px';
    requestAnimationFrame(function () { tip.classList.add('show'); });
  }
  function tipHide() { tip.classList.remove('show'); tip.hidden = true; }
  document.querySelectorAll('.runchart .mk').forEach(function (g) {
    g.addEventListener('mouseenter', function () { tipShow(g); });
    g.addEventListener('mouseleave', tipHide);
    g.addEventListener('focus', function () { tipShow(g); });
    g.addEventListener('blur', tipHide);
    g.addEventListener('click', tipHide);
  });
  document.querySelectorAll('.stephost').forEach(function (h) {
    var first = h.querySelector('.step-slot:not([hidden])'); if (first) { load(first); mark(h.dataset.exp, first.id); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-step]');
    if (t && !t.disabled) { e.preventDefault(); show(t.dataset.step, true); }
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('.mk[data-step]');
    if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); show(t.dataset.step, true); }
  });
})();

/* LLM switch: Fable 5.2 (default) or Opus 5.5. Every switch on the page moves together; videos of the hidden run pause. */
(function () {
  function set(llm, focusFrom) {
    document.querySelectorAll('.llm-sw').forEach(function (sw) {
      sw.dataset.llm = llm;
      sw.querySelectorAll('button').forEach(function (b) {
        var on = b.dataset.llm === llm;
        b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && sw === focusFrom) b.focus();
      });
    });
    document.querySelectorAll('.llm-pane').forEach(function (p) {
      var on = p.dataset.llm === llm;
      if (!on) p.querySelectorAll('video').forEach(function (v) { v.pause(); });
      p.hidden = !on;
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.llm-sw button'); if (!b) return;
    var host = b.closest('.llm-host'), y = host.getBoundingClientRect().top;
    set(b.dataset.llm);
    window.scrollBy(0, host.getBoundingClientRect().top - y);  /* keep the switch where it was */
  });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('.llm-sw button');
    if (!b || ['ArrowLeft', 'ArrowRight'].indexOf(e.key) < 0) return;
    e.preventDefault(); set(b.dataset.llm === 'opus' ? 'fable52' : 'opus', b.closest('.llm-sw'));
  });
})();
