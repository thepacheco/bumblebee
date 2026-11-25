(() => {
  const dialog = document.getElementById('kitchen-camera');
  const video = document.getElementById('kitchen-video');
  const status = document.getElementById('kitchen-status');
  const start = document.getElementById('kitchen-start');
  const audio = document.getElementById('kitchen-audio');
  const zoom = document.getElementById('kitchen-zoom');
  const pip = document.getElementById('kitchen-pip');
  const fullscreen = document.getElementById('kitchen-fullscreen');
  const historyToggle = document.getElementById('kitchen-history-toggle');
  const history = document.getElementById('kitchen-history');
  const historyStatus = document.getElementById('kitchen-history-status');
  const historyList = document.getElementById('kitchen-history-list');
  const unpaired = document.getElementById('kitchen-unpaired');
  const pairEndpoint = '/api/ring-pair';
  const endpoint = '/api/ring-stream';
  const cameraSite = 'https://www.beejan.co';
  const health = document.getElementById('kitchen-health');
  const healthState = document.getElementById('kitchen-health-state');
  const lastOffline = document.getElementById('kitchen-last-offline');
  let statusInterval;
  let active;

  function release(connection) {
    if (!connection) return;
    connection.abort.abort();
    connection.peer.close();
    if (connection.session) {
      fetch(endpoint, {
        method: 'DELETE', credentials: 'same-origin', keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: connection.session })
      }).catch(() => {});
    }
  }

  function stop(message = 'Connecting to Kitchen…', retry = false) {
    const connection = active;
    active = undefined;
    release(connection);
    video.srcObject = null;
    video.muted = true;
    resetZoom();
    setAudioLabel();
    delete dialog.dataset.live;
    unpaired.hidden = true;
    audio.disabled = zoom.disabled = pip.disabled = fullscreen.disabled = true;
    start.hidden = !retry;
    start.disabled = false;
    status.textContent = message;
  }

  function gatherIce(peer, signal) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => finish(new Error('Connection timed out')), 8000);
      const changed = () => {
        if (peer.iceGatheringState === 'complete') finish();
      };
      const aborted = () => finish(new Error('Connection cancelled'));
      function finish(error) {
        clearTimeout(timeout);
        peer.removeEventListener('icegatheringstatechange', changed);
        signal.removeEventListener('abort', aborted);
        error ? reject(error) : resolve();
      }
      peer.addEventListener('icegatheringstatechange', changed);
      signal.addEventListener('abort', aborted, { once: true });
      if (signal.aborted) aborted();
      else changed();
    });
  }

  // The panel lives in the check-in markup, which is hidden on the homepage.
  // Move it to <body> so the rose shortcut can show it from anywhere.
  document.body.append(dialog);

  let roseJoin = false;
  function openKitchen(options) {
    roseJoin = options?.rose === true;
    if (!dialog.open) dialog.showModal();
    connect();
    watchCameraStatus();
  }
  window.openKitchen = openKitchen;
  document.getElementById('kitchen-btn').addEventListener('click', openKitchen);
  document.getElementById('kitchen-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    clearInterval(statusInterval);
    delete dialog.dataset.authorized;
    health.hidden = true;
    stop();
  });
  window.addEventListener('pagehide', () => stop());

  start.addEventListener('click', connect);

  function watchCameraStatus() {
    if (window.location.origin !== cameraSite) return;
    clearInterval(statusInterval);
    async function update() {
      try {
        const response = await fetch(endpoint + '?status=1', { credentials: 'same-origin' });
        if (!response.ok || !dialog.open) return;
        const { online, lastOffline: offlineAt } = await response.json();
        if (!dialog.open) return;
        dialog.dataset.authorized = 'true';
        health.hidden = false;
        health.dataset.state = online === true ? 'online' : online === false ? 'offline' : 'unknown';
        healthState.textContent = online === true ? 'Online' : online === false ? 'Offline' : 'Status unavailable';
        lastOffline.textContent = offlineAt
          ? 'Last offline ' + new Date(offlineAt).toLocaleString()
          : online === false ? 'Offline time unavailable' : '';
      } catch {
        if (dialog.open && !health.hidden) healthState.textContent = 'Status unavailable';
      }
    }
    update();
    statusInterval = setInterval(update, 20000);
  }

  async function connect() {
    if (active) return;
    start.hidden = true;
    if (window.location.origin !== cameraSite) {
      const link = document.createElement('a');
      link.className = 'camera-control';
      link.href = cameraSite;
      link.textContent = 'Open Beejan';
      status.replaceChildren('Camera access is available on www.beejan.co. ', link);
      historyToggle.disabled = true;
      return;
    }
    if (!window.RTCPeerConnection) {
      status.textContent = 'This browser does not support live view.';
      return;
    }
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const abort = new AbortController();
    const connection = { peer, abort };
    active = connection;
    const media = new MediaStream();
    video.srcObject = media;
    start.disabled = true;
    status.textContent = 'Connecting to Kitchen…';
    status.hidden = false;

    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.addTransceiver('audio', { direction: 'recvonly' });
    peer.ontrack = ({ track }) => {
      if (active !== connection) return;
      media.addTrack(track);
      if (track.kind === 'audio') audio.disabled = false;
      if (track.kind === 'video') {
        zoom.disabled = false;
        fullscreen.disabled = false;
        pip.disabled = !('documentPictureInPicture' in window) &&
          !(document.pictureInPictureEnabled && video.requestPictureInPicture) &&
          !video.webkitSetPresentationMode;
        dialog.dataset.live = 'true';
        status.textContent = '● Live';
        video.play().catch(() => { video.controls = true; });
      }
    };
    // 'disconnected' is often a brief network blip that recovers on its own,
    // so give it a few seconds before treating the stream as ended.
    let dropTimer;
    peer.onconnectionstatechange = () => {
      if (active !== connection) return;
      clearTimeout(dropTimer);
      if (['failed', 'closed'].includes(peer.connectionState)) {
        stop('Live view ended.', true);
      } else if (peer.connectionState === 'disconnected') {
        dropTimer = setTimeout(() => {
          if (active === connection && peer.connectionState !== 'connected') stop('Live view ended.', true);
        }, 6000);
      }
    };

    try {
      await peer.setLocalDescription(await peer.createOffer());
      await gatherIce(peer, abort.signal);
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'same-origin', signal: abort.signal,
        headers: { 'Content-Type': 'application/sdp' },
        body: peer.localDescription.sdp
      });
      if (response.status === 401 && roseJoin) {
        roseJoin = false;
        stop('Setting up this device…');
        const joined = await fetch(pairEndpoint, {
          method: 'POST', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rose: true })
        }).then(r => r.ok, () => false);
        if (joined && dialog.open) {
          connect();
          watchCameraStatus();
          return;
        }
      }
      if (response.status === 401) {
        delete dialog.dataset.authorized;
        stop('');
        unpaired.hidden = false;
        return;
      }
      if (!response.ok) throw new Error('Kitchen live view is unavailable.');
      const { answer, session } = await response.json();
      if (dialog.open) dialog.dataset.authorized = 'true';
      connection.session = session;
      if (active !== connection) {
        release(connection);
        return;
      }
      await peer.setRemoteDescription({ type: 'answer', sdp: answer });
    } catch (error) {
      if (active === connection) stop(error.message, true);
    }
  }

  function setAudioLabel() {
    const label = video.muted ? 'Unmute camera audio' : 'Mute camera audio';
    audio.setAttribute('aria-label', label);
    audio.title = label;
    audio.firstElementChild.textContent = video.muted ? '🔇' : '🔊';
    audio.lastElementChild.textContent = video.muted ? 'Listen' : 'Mute';
  }

  /* ---------- zoom: pinch, double-tap/double-click, wheel/trackpad, drag ---------- */
  const stage = video.parentElement;
  const MAX_ZOOM = 5;
  const view = { scale: 1, x: 0, y: 0 };
  const pointers = new Map();
  let gesture = null;
  let lastTap = 0;

  function clampView() {
    view.scale = Math.min(MAX_ZOOM, Math.max(1, view.scale));
    const width = stage.clientWidth, height = stage.clientHeight;
    view.x = Math.min(0, Math.max(width - width * view.scale, view.x));
    view.y = Math.min(0, Math.max(height - height * view.scale, view.y));
  }

  let onZoomChange = () => {};
  function applyZoom() {
    clampView();
    video.style.transformOrigin = '0 0';
    video.style.transform = view.scale === 1 ? '' : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    const zoomed = view.scale > 1.01;
    stage.dataset.zoomed = String(zoomed);
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.setAttribute('aria-label', zoomed ? 'Reset zoom' : 'Zoom in');
    zoom.title = zoomed ? 'Reset zoom' : 'Zoom in (or pinch, double-tap, scroll)';
    zoom.lastElementChild.textContent = (Math.round(view.scale * 10) / 10) + '×';
    onZoomChange(zoomed);
  }

  function zoomAt(scale, px, py) {
    const next = Math.min(MAX_ZOOM, Math.max(1, scale));
    view.x = px - (px - view.x) * (next / view.scale);
    view.y = py - (py - view.y) * (next / view.scale);
    view.scale = next;
    applyZoom();
  }

  function resetZoom() {
    view.scale = 1; view.x = 0; view.y = 0;
    pointers.clear();
    gesture = null;
    applyZoom();
  }

  function stagePoint(event) {
    const box = stage.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function live() { return dialog.dataset.live === 'true'; }

  function beginGesture() {
    const points = [...pointers.values()];
    if (points.length >= 2) {
      const [a, b] = points;
      gesture = {
        type: 'pinch', scale: view.scale,
        distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, x: view.x, y: view.y
      };
    } else if (points.length === 1) {
      gesture = { type: 'pan', start: points[0], x: view.x, y: view.y };
    } else {
      gesture = null;
    }
  }

  stage.addEventListener('pointerdown', event => {
    if (!live() || event.target.closest('button')) return;
    stage.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, stagePoint(event));
    beginGesture();
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    pointers.set(event.pointerId, stagePoint(event));
    const points = [...pointers.values()];
    if (gesture.type === 'pinch' && points.length >= 2) {
      const [a, b] = points;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const next = Math.min(MAX_ZOOM, Math.max(1, gesture.scale * distance / gesture.distance));
      view.scale = next;
      view.x = mid.x - (gesture.mid.x - gesture.x) * (next / gesture.scale);
      view.y = mid.y - (gesture.mid.y - gesture.y) * (next / gesture.scale);
      applyZoom();
    } else if (gesture.type === 'pan' && view.scale > 1) {
      const point = points[0];
      view.x = gesture.x + point.x - gesture.start.x;
      view.y = gesture.y + point.y - gesture.start.y;
      applyZoom();
    }
  });
  function endPointer(event) {
    if (!pointers.has(event.pointerId)) return;
    const wasTap = gesture?.type === 'pan' && pointers.size === 1 &&
      Math.hypot(stagePoint(event).x - gesture.start.x, stagePoint(event).y - gesture.start.y) < 10;
    pointers.delete(event.pointerId);
    beginGesture();
    if (!wasTap) return;
    const now = Date.now();
    if (now - lastTap < 320) {
      lastTap = 0;
      if (view.scale > 1.01) resetZoom();
      else { const p = stagePoint(event); zoomAt(2.5, p.x, p.y); }
    } else {
      lastTap = now;
    }
  }
  stage.addEventListener('pointerup', endPointer);
  stage.addEventListener('pointercancel', endPointer);
  stage.addEventListener('wheel', event => {
    if (!live()) return;
    event.preventDefault();
    const p = stagePoint(event);
    const speed = event.ctrlKey ? 0.01 : 0.002; // ctrlKey = trackpad pinch
    zoomAt(view.scale * Math.exp(-event.deltaY * speed), p.x, p.y);
  }, { passive: false });
  // Safari trackpad pinch
  let safariScale = 1;
  stage.addEventListener('gesturestart', event => { event.preventDefault(); safariScale = view.scale; });
  stage.addEventListener('gesturechange', event => {
    event.preventDefault();
    zoomAt(safariScale * event.scale, stage.clientWidth / 2, stage.clientHeight / 2);
  });
  new ResizeObserver(() => applyZoom()).observe(stage);
  window.addEventListener('resize', () => applyZoom());

  audio.addEventListener('click', () => {
    video.muted = !video.muted;
    setAudioLabel();
  });
  zoom.addEventListener('click', () => {
    const steps = [1, 2, 3];
    const next = steps.find(step => step > view.scale + 0.05) ?? 1;
    if (next === 1) resetZoom();
    else zoomAt(next, stage.clientWidth / 2, stage.clientHeight / 2);
  });

  /* ---------- full screen: the whole panel, so zoom and controls keep working ---------- */
  function isFullscreen() { return dialog.classList.contains('is-fullscreen'); }
  function setFullscreenLabel() {
    const on = isFullscreen();
    fullscreen.setAttribute('aria-pressed', String(on));
    fullscreen.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
    fullscreen.lastElementChild.textContent = on ? 'Exit full screen' : 'Full screen';
  }
  function leaveFullscreen() {
    dialog.classList.remove('is-fullscreen');
    const element = document.fullscreenElement || document.webkitFullscreenElement;
    if (element) Promise.resolve((document.exitFullscreen || document.webkitExitFullscreen).call(document)).catch(() => {});
    setFullscreenLabel();
  }
  fullscreen.addEventListener('click', async () => {
    if (isFullscreen()) return leaveFullscreen();
    dialog.classList.add('is-fullscreen'); // fills the window even where the browser has no full-screen API (iPhone)
    setFullscreenLabel();
    const request = dialog.requestFullscreen || dialog.webkitRequestFullscreen;
    if (request) {
      try { await request.call(dialog, { navigationUI: 'hide' }); } catch { /* the in-page full window still applies */ }
    }
  });
  const fullscreenChanged = () => {
    if (!(document.fullscreenElement || document.webkitFullscreenElement) && isFullscreen() && dialog.dataset.nativeFullscreen) {
      dialog.classList.remove('is-fullscreen');
      setFullscreenLabel();
    }
    if (document.fullscreenElement || document.webkitFullscreenElement) dialog.dataset.nativeFullscreen = 'true';
    else delete dialog.dataset.nativeFullscreen;
  };
  document.addEventListener('fullscreenchange', fullscreenChanged);
  document.addEventListener('webkitfullscreenchange', fullscreenChanged);
  dialog.addEventListener('close', leaveFullscreen);

  historyToggle.addEventListener('click', async () => {
    history.hidden = !history.hidden;
    historyToggle.setAttribute('aria-expanded', String(!history.hidden));
    if (history.hidden) return;
    historyList.replaceChildren();
    historyStatus.textContent = 'Loading viewing history…';
    try {
      const response = await fetch(endpoint, { credentials: 'same-origin' });
      if (!response.ok) throw new Error('History unavailable');
      const { views } = await response.json();
      for (const view of views) {
        const item = document.createElement('li');
        item.textContent = new Date(view.started_at).toLocaleString();
        historyList.append(item);
      }
      historyStatus.textContent = views.length ? 'Last 30 days' : 'No live-view sessions recorded.';
    } catch {
      historyStatus.textContent = 'Viewing history is unavailable on this device.';
    }
  });

  if (window.location.hash.startsWith('#kitchen=')) {
    const family = window.location.hash.slice('#kitchen='.length);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (window.location.origin !== cameraSite) {
      window.location.replace(cameraSite + '/#kitchen=' + family);
    } else {
      dialog.showModal();
      status.textContent = 'Setting up this device…';
      fetch(pairEndpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ family })
      }).then(response => {
        if (!response.ok) throw new Error('This family link no longer works. Ask for the new one.');
        if (dialog.open) openKitchen();
      }).catch(error => {
        status.textContent = error.message;
      });
    }
  }

  /* ---------- pop out ----------
     1. Chrome/Edge on computers: a real pop-out window holding the live view,
        so the current zoom carries over and it can be zoomed inside the window.
     2. Elsewhere, when zoomed in: the zoomed area is drawn into its own video,
        and that video pops out. It follows zoom changes made on the page.
     3. Otherwise: the normal video pop-out. */
  let pipWindow = null;
  let mirror = null;

  function stagePlaceholder() {
    let note = dialog.querySelector('.camera-popped');
    if (!note) {
      note = document.createElement('div');
      note.className = 'camera-popped';
      note.textContent = 'Kitchen is playing in the pop-out window.';
      note.hidden = true;
      stageHome.parent.insertBefore(note, stageHome.next);
    }
    return note;
  }
  const stageHome = { parent: stage.parentElement, next: stage.nextSibling };

  async function openWindowPip() {
    const win = await window.documentPictureInPicture.requestWindow({ width: 560, height: 315 });
    pipWindow = win;
    const css = win.document.createElement('style');
    css.textContent = `
      html, body { margin: 0; height: 100%; background: #000; overflow: hidden; font-family: system-ui, sans-serif; }
      .camera-stage { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: #000;
        touch-action: none; cursor: zoom-in; user-select: none; -webkit-user-select: none; aspect-ratio: auto; }
      .camera-stage[data-zoomed="true"] { cursor: grab; }
      .camera-stage video { display: block; width: 100%; height: 100%; object-fit: contain; }
      .camera-state { display: none; }
      .pip-zoom { position: fixed; right: 8px; bottom: 8px; display: flex; gap: 4px; opacity: .25; transition: opacity .2s; }
      body:hover .pip-zoom { opacity: 1; }
      .pip-zoom button { min-width: 34px; height: 30px; border: 0; border-radius: 6px; background: #000000b3; color: #fff;
        font: 600 15px system-ui, sans-serif; cursor: pointer; }
      .pip-zoom button:hover { background: #000; }`;
    win.document.head.append(css);
    win.document.title = 'Kitchen';
    const controls = win.document.createElement('div');
    controls.className = 'pip-zoom';
    const button = (label, title, action) => {
      const el = win.document.createElement('button');
      el.type = 'button'; el.textContent = label; el.title = title;
      el.addEventListener('click', action);
      return el;
    };
    const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];
    controls.append(
      button('−', 'Zoom out', () => zoomAt(view.scale / 1.4, ...center())),
      button('+', 'Zoom in', () => zoomAt(view.scale * 1.4, ...center())),
      button('1×', 'Reset zoom', resetZoom));
    // Keep the zoom framing: remember the visible spot as a fraction of the view.
    const before = { w: stage.clientWidth, h: stage.clientHeight };
    win.document.body.append(stage, controls);
    stagePlaceholder().hidden = false;
    video.play().catch(() => {});
    const ratio = stage.clientWidth / (before.w || stage.clientWidth);
    view.x *= ratio; view.y *= stage.clientHeight / (before.h || stage.clientHeight);
    applyZoom();
    win.addEventListener('resize', () => applyZoom());
    win.addEventListener('pagehide', () => {
      if (pipWindow !== win) return;
      pipWindow = null;
      const w = stage.clientWidth, h = stage.clientHeight;
      stageHome.parent.insertBefore(stage, stageHome.next);
      stagePlaceholder().hidden = true;
      video.play().catch(() => {});
      if (w) { view.x *= stage.clientWidth / w; view.y *= stage.clientHeight / (h || 1); }
      applyZoom();
    });
  }

  // Which part of the camera image is visible on the page right now.
  function visibleSource() {
    const vw = video.videoWidth, vh = video.videoHeight;
    const W = stage.clientWidth, H = stage.clientHeight;
    if (!vw || !vh || !W || !H) return null;
    const k = Math.min(W / vw, H / vh);
    const ox = (W - vw * k) / 2, oy = (H - vh * k) / 2;
    let sx = (-view.x / view.scale - ox) / k, sy = (-view.y / view.scale - oy) / k;
    let sw = W / view.scale / k, sh = H / view.scale / k;
    const x0 = Math.max(0, sx), y0 = Math.max(0, sy);
    const x1 = Math.min(vw, sx + sw), y1 = Math.min(vh, sy + sh);
    return { sx: x0, sy: y0, sw: Math.max(1, x1 - x0), sh: Math.max(1, y1 - y0) };
  }

  // Phones and Safari only allow a pop-out to start right inside the tap, so the
  // zoomed-area video is prepared (and kept playing) whenever the view is zoomed.
  const canMirror = !('documentPictureInPicture' in window) &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    ('webkitSetPresentationMode' in HTMLVideoElement.prototype ||
     (document.pictureInPictureEnabled && 'requestPictureInPicture' in HTMLVideoElement.prototype));

  function mirrorInPip() {
    return !!mirror && (document.pictureInPictureElement === mirror.out ||
      mirror.out.webkitPresentationMode === 'picture-in-picture');
  }

  function startMirror() {
    if (mirror || !canMirror) return mirror;
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const context = canvas.getContext('2d');
    const out = document.createElement('video');
    out.muted = true; out.playsInline = true; out.autoplay = true;
    out.setAttribute('playsinline', ''); out.setAttribute('muted', '');
    out.setAttribute('aria-hidden', 'true');
    out.className = 'camera-mirror';
    out.srcObject = canvas.captureStream(30);
    const state = { canvas, out };
    const draw = () => {
      const src = visibleSource();
      if (!src) return;
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const fit = Math.min(canvas.width / src.sw, canvas.height / src.sh);
      const dw = src.sw * fit, dh = src.sh * fit;
      context.drawImage(video, src.sx, src.sy, src.sw, src.sh,
        (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
    };
    // Timers keep drawing while the page is in the background (rAF would stop).
    state.timer = setInterval(draw, 1000 / 24);
    draw();
    const ended = () => { if (view.scale <= 1.01 || !live()) stopMirror(); };
    out.addEventListener('leavepictureinpicture', ended);
    out.addEventListener('webkitpresentationmodechanged', () => {
      if (out.webkitPresentationMode !== 'picture-in-picture') ended();
    });
    stageHome.parent.append(out);
    out.play().catch(() => {});
    mirror = state;
    return state;
  }

  function stopMirror() {
    const state = mirror;
    if (!state) return;
    mirror = null;
    clearInterval(state.timer);
    if (document.pictureInPictureElement === state.out) document.exitPictureInPicture().catch(() => {});
    state.out.srcObject?.getTracks().forEach(track => track.stop());
    state.out.remove();
  }

  onZoomChange = zoomed => {
    if (zoomed && live()) startMirror();
    else if (!zoomed && mirror && !mirrorInPip()) stopMirror();
  };

  // Starts picture-in-picture for one video without waiting on anything first.
  function popOut(el) {
    if (el.webkitSupportsPresentationMode?.('picture-in-picture') && el.webkitSetPresentationMode) {
      el.webkitSetPresentationMode('picture-in-picture');
      return Promise.resolve();
    }
    if (document.pictureInPictureEnabled && el.requestPictureInPicture) return el.requestPictureInPicture();
    return Promise.reject(new Error('unsupported'));
  }

  function closePip() {
    if (pipWindow) { pipWindow.close(); return true; }
    if (document.pictureInPictureElement) { document.exitPictureInPicture().catch(() => {}); return true; }
    for (const el of [mirror?.out, video]) {
      if (el?.webkitPresentationMode === 'picture-in-picture') { el.webkitSetPresentationMode('inline'); return true; }
    }
    return false;
  }

  let mirrorRefused = false;
  function popOutFailed() {
    status.textContent = 'Pop out is unavailable in this browser.';
  }

  pip.addEventListener('click', () => {
    if (closePip()) return;
    if ('documentPictureInPicture' in window) {
      openWindowPip().catch(popOutFailed);
      return;
    }
    const zoomed = view.scale > 1.01;
    const source = zoomed && !mirrorRefused ? startMirror() : null;
    if (source && source.out.readyState >= 2) {
      popOut(source.out).catch(() => {
        mirrorRefused = true;
        popOut(video).catch(() => { status.textContent = 'Tap Pop out again to pop out the full view.'; });
      });
      // Some phones ignore the request without an error; remember that and use the full view next time.
      setTimeout(() => {
        if (!mirrorInPip() && video.webkitPresentationMode !== 'picture-in-picture' && !document.pictureInPictureElement) {
          mirrorRefused = true;
          status.textContent = 'This phone can only pop out the full view. Tap Pop out again.';
        }
      }, 1500);
    } else {
      popOut(video).catch(popOutFailed);
    }
  });
  dialog.addEventListener('close', () => { closePip(); stopMirror(); });
})();
