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
  const endpoint = '/api/ring-stream';
  const cameraSite = 'https://www.beejan.co';
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
    video.style.transform = '';
    setAudioLabel();
    setZoomLabel(false);
    delete dialog.dataset.live;
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

  document.getElementById('kitchen-btn').addEventListener('click', () => {
    dialog.showModal();
    connect();
  });
  document.getElementById('kitchen-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => stop());
  window.addEventListener('pagehide', () => stop());

  start.addEventListener('click', connect);

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
        fullscreen.disabled = !(video.requestFullscreen || video.webkitEnterFullscreen);
        pip.disabled = !(document.pictureInPictureEnabled && video.requestPictureInPicture) &&
          !video.webkitSetPresentationMode;
        dialog.dataset.live = 'true';
        status.textContent = '● Live';
        video.play().catch(() => { video.controls = true; });
      }
    };
    peer.onconnectionstatechange = () => {
      if (active === connection && ['failed', 'closed', 'disconnected'].includes(peer.connectionState)) {
        stop('Live view ended.', true);
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
      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403
          ? 'Authorize this browser through Beejan Kitchen Viewer in the Ring Appstore.'
          : 'Kitchen live view is unavailable.');
      }
      const { answer, session } = await response.json();
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

  function setZoomLabel(enlarged) {
    const label = enlarged ? 'Reset zoom' : 'Zoom in';
    zoom.setAttribute('aria-label', label);
    zoom.setAttribute('aria-pressed', String(enlarged));
    zoom.title = label;
    zoom.lastElementChild.textContent = enlarged ? '1.75×' : '1×';
  }

  audio.addEventListener('click', () => {
    video.muted = !video.muted;
    setAudioLabel();
  });
  zoom.addEventListener('click', () => {
    const enlarged = Boolean(video.style.transform);
    video.style.transform = enlarged ? '' : 'scale(1.75)';
    setZoomLabel(!enlarged);
  });
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (video.requestFullscreen) await video.requestFullscreen();
      else video.webkitEnterFullscreen();
    } catch {
      status.textContent = 'Full screen is unavailable in this browser.';
    }
  });

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

  pip.addEventListener('click', async () => {
    try {
      if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled && video.requestPictureInPicture) await video.requestPictureInPicture();
      else if (video.webkitSetPresentationMode) {
        video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
      }
    } catch {
      status.textContent = 'Picture-in-Picture is unavailable in this browser.';
    }
  });
})();
