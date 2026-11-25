(() => {
  const dialog = document.getElementById('kitchen-camera');
  const video = document.getElementById('kitchen-video');
  const status = document.getElementById('kitchen-status');
  const start = document.getElementById('kitchen-start');
  const audio = document.getElementById('kitchen-audio');
  const zoom = document.getElementById('kitchen-zoom');
  const pip = document.getElementById('kitchen-pip');
  const endpoint = '/api/ring-stream';
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

  function stop(message = 'Select Start live view to connect.') {
    const connection = active;
    active = undefined;
    release(connection);
    video.srcObject = null;
    video.muted = true;
    video.style.transform = '';
    audio.textContent = 'Listen';
    zoom.textContent = 'Zoom in';
    audio.disabled = zoom.disabled = pip.disabled = true;
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

  document.getElementById('kitchen-btn').addEventListener('click', () => dialog.showModal());
  document.getElementById('kitchen-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => stop());
  window.addEventListener('pagehide', () => stop());

  start.addEventListener('click', async () => {
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

    peer.addTransceiver('video', { direction: 'recvonly' });
    peer.addTransceiver('audio', { direction: 'recvonly' });
    peer.ontrack = ({ track }) => {
      if (active !== connection) return;
      media.addTrack(track);
      if (track.kind === 'audio') audio.disabled = false;
      if (track.kind === 'video') {
        zoom.disabled = false;
        pip.disabled = !(document.pictureInPictureEnabled && video.requestPictureInPicture) &&
          !video.webkitSetPresentationMode;
        status.textContent = 'Kitchen live view';
        video.play().catch(() => { video.controls = true; });
      }
    };
    peer.onconnectionstatechange = () => {
      if (active === connection && ['failed', 'closed', 'disconnected'].includes(peer.connectionState)) {
        stop('Live view ended. Select Start live view to reconnect.');
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
          ? 'This device is not authorized to view Kitchen.'
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
      if (active === connection) stop(error.message);
    }
  });

  audio.addEventListener('click', () => {
    video.muted = !video.muted;
    audio.textContent = video.muted ? 'Listen' : 'Mute';
  });
  zoom.addEventListener('click', () => {
    const enlarged = Boolean(video.style.transform);
    video.style.transform = enlarged ? '' : 'scale(1.75)';
    zoom.textContent = enlarged ? 'Zoom in' : 'Reset zoom';
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
