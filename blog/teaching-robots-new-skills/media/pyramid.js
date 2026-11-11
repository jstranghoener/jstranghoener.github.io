/* Shows a five-panel film (one row, from wsp.analysis.blog_media) as a pyramid: panels 1-2 above panels 3-5.
   A <video class="vpyr"> stays in the page as the source, so without JavaScript the plain film is shown. */
(function () {
  var style = document.createElement('style');
  style.textContent =
    'video.vpyr-src{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}' +
    'canvas.vpyr-c{width:100%;height:auto;display:block;border-radius:8px;background:var(--surface);cursor:pointer}' +
    '.vpyr-bar{display:flex;align-items:center;gap:.6rem;margin-top:.3rem;font:.78rem Inter,ui-sans-serif,system-ui,sans-serif;color:var(--ink-2)}' +
    '.vpyr-bar button{font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:6px;padding:.15rem .6rem;cursor:pointer}' +
    '.vpyr-bar input{flex:1;min-width:0;accent-color:var(--ink)}';
  document.head.appendChild(style);

  function clock(s) { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  Array.prototype.forEach.call(document.querySelectorAll('video.vpyr'), function (v) {
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    var off = document.createElement('canvas'), offCtx = off.getContext('2d');
    var bar = document.createElement('div'), button = document.createElement('button');
    var seek = document.createElement('input'), time = document.createElement('span');
    var poster = new Image(), layout = null, running = false;

    canvas.className = 'vpyr-c';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Film of one episode: two policies above, three below. Click to play or pause.');
    bar.className = 'vpyr-bar';
    button.type = 'button';
    seek.type = 'range'; seek.min = 0; seek.max = 1000; seek.value = 0; seek.setAttribute('aria-label', 'Position in the film');
    bar.appendChild(button); bar.appendChild(seek); bar.appendChild(time);
    v.parentNode.insertBefore(canvas, v);
    v.parentNode.insertBefore(bar, v);
    v.controls = false;
    v.classList.add('vpyr-src');

    function setLayout(fullW, fullH) {
      var g = Math.round(fullH / 60), w = (fullW - 4 * g) / 5, h = fullH;  // The film's gap: 6 px on a 360 px panel.
      var top = (w + g) / 2;
      var picked = (v.getAttribute('data-panels') || '').split(',').filter(Boolean).map(Number);  // data-panels="2,4": only these, in one row.
      var slots = picked.length ? picked.map(function (p, i) { return [p, i * (w + g), 0]; })
        : [[0, top, 0], [1, top + w + g, 0], [2, 0, h + g], [3, w + g, h + g], [4, 2 * (w + g), h + g]];
      layout = { w: w, h: h, g: g, slots: slots, width: picked.length ? picked.length * w + (picked.length - 1) * g : 3 * w + 2 * g,
                 height: picked.length ? h : 2 * h + g };
      canvas.width = layout.width;
      canvas.height = layout.height;
      off.width = fullW;
      off.height = fullH;
    }

    function draw(source) {
      offCtx.drawImage(source, 0, 0);  // One snapshot, so all five panels show the same film frame.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      layout.slots.forEach(function (s) {
        ctx.drawImage(off, s[0] * (layout.w + layout.g), 0, layout.w, layout.h, s[1], s[2], layout.w, layout.h);
      });
    }

    function drawVideo() {
      if (!v.videoWidth || v.readyState < 2) return;
      if (!layout) setLayout(v.videoWidth, v.videoHeight);
      draw(v);
    }

    function status() {
      button.textContent = v.paused ? 'Play' : 'Pause';
      if (v.duration) seek.value = Math.round(1000 * v.currentTime / v.duration);
      time.textContent = clock(v.currentTime) + ' / ' + clock(v.duration);
    }

    function frame() {
      if (v.paused || v.ended) { running = false; return; }
      drawVideo();
      requestAnimationFrame(frame);
    }

    function start() {
      status();
      if (!running) { running = true; requestAnimationFrame(frame); }
    }

    function toggle() {
      if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
    }

    poster.onload = function () {
      setLayout(poster.naturalWidth, poster.naturalHeight);
      if (v.readyState < 2) draw(poster); else drawVideo();
    };
    poster.src = v.poster;

    canvas.addEventListener('click', toggle);
    button.addEventListener('click', toggle);
    seek.addEventListener('input', function () { if (v.duration) v.currentTime = v.duration * seek.value / 1000; });
    v.addEventListener('play', start);
    v.addEventListener('pause', status);
    v.addEventListener('timeupdate', status);
    v.addEventListener('loadedmetadata', status);
    v.addEventListener('loadeddata', drawVideo);
    v.addEventListener('seeked', drawVideo);
    status();
    if (!v.paused) start();
  });
})();
