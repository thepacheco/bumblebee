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
  const pairButton = document.getElementById('kitchen-pair');
  const pairStatus = document.getElementById('kitchen-pair-status');
  const pairLink = document.getElementById('kitchen-pair-link');
  const recoveryForm = document.getElementById('kitchen-recovery');
  const recoveryInput = document.getElementById('kitchen-recovery-key');
  const recoveryStatus = document.getElementById('kitchen-recovery-status');
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
    video.style.transform = '';
    setAudioLabel();
    setZoomLabel(false);
    delete dialog.dataset.live;
    pairLink.hidden = true;
    pairLink.value = '';
    pairStatus.hidden = true;
    recoveryForm.hidden = true;
    recoveryForm.reset();
    recoveryStatus.textContent = '';
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
    watchCameraStatus();
  });
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
      pairButton.disabled = true;
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
      if (response.status === 401) {
        delete dialog.dataset.authorized;
        stop('This browser needs one-time access to Kitchen.');
        recoveryForm.hidden = false;
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

  pairButton.addEventListener('click', async () => {
    pairButton.disabled = true;
    pairLink.hidden = true;
    pairLink.value = '';
    pairStatus.hidden = false;
    pairStatus.textContent = 'Creating a secure link…';
    try {
      const response = await fetch(pairEndpoint, { method: 'POST', credentials: 'same-origin' });
      if (response.status === 401) {
        pairStatus.textContent = 'Restore access on this browser before pairing another device.';
        recoveryForm.hidden = false;
        return;
      }
      if (!response.ok) throw new Error('Pairing unavailable');
      const { url } = await response.json();
      pairLink.value = url;
      pairLink.hidden = false;
      pairLink.select();
      pairStatus.textContent = 'Copy this one-time link and open it on your other device within 5 minutes.';
    } catch {
      pairStatus.textContent = 'Could not create a pairing link. Try again.';
    } finally {
      pairButton.disabled = false;
    }
  });

  recoveryForm.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = recoveryForm.querySelector('button');
    const recovery = recoveryInput.value;
    recoveryInput.value = '';
    submit.disabled = true;
    recoveryStatus.textContent = 'Checking access…';
    try {
      const response = await fetch(pairEndpoint, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recovery })
      });
      if (response.status === 409) {
        const { error } = await response.json();
        const messages = {
          no_ring_grant: 'Passphrase accepted. Beejan has no saved Ring grant for this camera.',
          ring_grant_unavailable: 'Passphrase accepted. Ring rejected the saved authorization.',
          ring_owner_mismatch: 'The Ring account email differs from the owner email configured for Beejan.',
          ring_device_permission: 'Ring did not grant access to the camera list.',
          ring_kitchen_missing: 'Ring did not return exactly one shared camera named Kitchen.',
          ring_link_pending: 'Ring has not confirmed the Kitchen integration.',
          multiple_links: 'Beejan found multiple linked accounts and could not select Kitchen safely.'
        };
        throw new Error(messages[error] || 'Beejan could not identify your Kitchen camera.');
      }
      if (response.status === 403) throw new Error('That recovery key did not match.');
      if (!response.ok) {
        const { error } = await response.json().catch(() => ({}));
        if (error === 'recovery_configuration') throw new Error('This deployment could not read the owner passphrase.');
        if (error === 'recovery_storage') throw new Error('Beejan could not save this browser’s access. Try again.');
        throw new Error('Could not unlock the camera. Try again.');
      }
      if (!dialog.open) return;
      recoveryForm.hidden = true;
      dialog.dataset.authorized = 'true';
      recoveryStatus.textContent = '';
      connect();
      watchCameraStatus();
    } catch (error) {
      recoveryStatus.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });

  if (window.location.origin === cameraSite && window.location.hash.startsWith('#camera-pair=')) {
    const code = window.location.hash.slice('#camera-pair='.length);
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    dialog.showModal();
    status.textContent = 'Authorizing this browser…';
    fetch(pairEndpoint, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code })
    }).then(response => {
      if (!response.ok) throw new Error('This pairing link expired or was already used.');
      if (dialog.open) {
        connect();
        watchCameraStatus();
      }
    }).catch(error => {
      status.textContent = error.message;
    });
  }

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
