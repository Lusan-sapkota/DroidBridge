// @ts-check
(function () {
  // @ts-ignore - acquireVsCodeApi is provided by the webview runtime and may only be called once
  const vscode = window.__droidbridgeApi || (window.__droidbridgeApi = acquireVsCodeApi());
  const root = document.getElementById('mirror');
  const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('mirror-canvas'));
  const message = document.getElementById('mirror-message');
  if (!root || !canvas || !message) {
    return;
  }
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

  const KEY = { home: 3, recents: 187, enter: 66, backspace: 67, del: 112, tab: 61, up: 19, down: 20, left: 21, right: 22, moveHome: 122, moveEnd: 123, pageUp: 92, pageDown: 93 };
  const KEYMAP = /** @type {Record<string, number>} */ ({
    Enter: KEY.enter, Backspace: KEY.backspace, Delete: KEY.del, Tab: KEY.tab,
    ArrowUp: KEY.up, ArrowDown: KEY.down, ArrowLeft: KEY.left, ArrowRight: KEY.right,
    Home: KEY.moveHome, End: KEY.moveEnd, PageUp: KEY.pageUp, PageDown: KEY.pageDown,
  });

  /** @type {any} */ let decoder = null;
  let lastSps = '';
  let waitingKey = true;
  let reported = false;
  /** @type {number[]} */ let decodeErrors = [];
  let failure = '';

  /** @param {any} msg */
  const post = msg => vscode.postMessage(msg);

  /** @param {string} state @param {string} [text] */
  function setState(state, text) {
    if (state !== 'running') {
      releaseAll();
    }
    root.dataset.state = state;
    message.textContent = text || '';
  }

  function resetDecoder() {
    if (decoder && decoder.state !== 'closed') {
      decoder.close();
    }
    decoder = null;
    lastSps = '';
    waitingKey = true;
    reported = false;
  }

  /** Returns the SPS NAL payload of an Annex B access unit, if present. @param {Uint8Array} d */
  function findSps(d) {
    for (let i = 0; i + 4 < d.length; i++) {
      if (d[i] === 0 && d[i + 1] === 0 && d[i + 2] === 1 && (d[i + 3] & 0x1f) === 7) {
        let end = i + 4;
        while (end + 2 < d.length && !(d[end] === 0 && d[end + 1] === 0 && (d[end + 2] === 1 || d[end + 2] === 0))) {
          end++;
        }
        return d.subarray(i + 4, end);
      }
    }
    return null;
  }

  /** @param {Uint8Array} sps */
  function codecFor(sps) {
    const hex = (/** @type {number} */ n) => n.toString(16).padStart(2, '0');
    return 'avc1.' + hex(sps[0]) + hex(sps[1]) + hex(sps[2]);
  }

  /** @param {Uint8Array} sps */
  function configure(sps) {
    resetDecoder();
    // @ts-ignore - WebCodecs types are not in the default lib for this project
    decoder = new VideoDecoder({
      /** @param {any} frame */
      output: frame => {
        if (canvas.width !== frame.displayWidth || canvas.height !== frame.displayHeight || !reported) {
          canvas.width = frame.displayWidth;
          canvas.height = frame.displayHeight;
          reported = true;
          post({ type: 'mirrorDecoded', width: frame.displayWidth, height: frame.displayHeight });
        }
        ctx.drawImage(frame, 0, 0);
        frame.close();
        if (root.dataset.state !== 'running') {
          setState('running');
        }
      },
      /** @param {Error} e */
      error: e => {
        console.error('DroidBridge mirror decoder error', e);
        resetDecoder();
        const now = Date.now();
        decodeErrors = decodeErrors.filter(t => now - t < 10000).concat(now);
        if (decodeErrors.length >= 3) {
          // A persistent failure would otherwise reset the device encoder forever.
          failure = 'The video from this device could not be decoded. Try a lower droidbridge.scrcpy.maxSize, or use the native window.';
          decodeErrors = [];
          post({ type: 'mirrorAction', action: 'stop' });
        } else {
          post({ type: 'mirrorResync' });
        }
      },
    });
    decoder.configure({ codec: codecFor(sps), optimizeForLatency: true });
    lastSps = Array.from(sps).join(',');
  }

  /** @param {{key: boolean, pts: number, data: Uint8Array}} msg */
  function onFrame(msg) {
    const data = msg.data instanceof Uint8Array ? msg.data : new Uint8Array(msg.data);
    if (msg.key) {
      const sps = findSps(data);
      if (sps && (!decoder || Array.from(sps).join(',') !== lastSps)) {
        configure(sps);
      }
      waitingKey = !decoder;
    }
    if (!decoder || waitingKey) {
      return;
    }
    if (!msg.key && decoder.decodeQueueSize > 6) {
      waitingKey = true;
      post({ type: 'mirrorResync' });
      return;
    }
    // @ts-ignore - WebCodecs
    decoder.decode(new EncodedVideoChunk({ type: msg.key ? 'key' : 'delta', timestamp: msg.pts, data }));
  }

  /** @param {MouseEvent} e */
  function position(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * canvas.width;
    const y = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1) * canvas.height;
    return { x, y, w: canvas.width, h: canvas.height };
  }

  /** @param {any} input */
  const send = input => post({ type: 'mirrorInput', input });

  /** Pointers currently held down, with their last device position. @type {Map<number, any>} */
  const active = new Map();
  /** @param {number} action @param {PointerEvent} e */
  function touch(action, e) {
    const pointerId = e.pointerType === 'mouse' ? -2 : e.pointerId;
    const input = { kind: 'touch', action, pointerId, pressure: e.pressure || 1, ...position(e) };
    if (action === 1) {
      active.delete(e.pointerId);
    } else {
      active.set(e.pointerId, input);
    }
    send(input);
  }

  /** Lift every held pointer, so a finger is never left down on the device. */
  function releaseAll() {
    for (const input of active.values()) {
      send({ ...input, action: 1 });
    }
    active.clear();
  }

  canvas.addEventListener('pointerdown', e => {
    canvas.focus();
    if (e.button === 2) { send({ kind: 'back' }); return; }
    if (e.button === 1) { send({ kind: 'key', keycode: KEY.home }); return; }
    if (e.button !== 0) { return; }
    canvas.setPointerCapture(e.pointerId);
    touch(0, e);
  });
  canvas.addEventListener('pointermove', e => {
    if (active.has(e.pointerId)) {
      touch(2, e);
    }
  });
  const release = (/** @type {PointerEvent} */ e) => {
    if (active.has(e.pointerId)) {
      touch(1, e);
    }
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const scale = e.deltaMode === 1 ? 1 : 1 / 100;
    send({ kind: 'scroll', hscroll: -e.deltaX * scale, vscroll: -e.deltaY * scale, ...position(e) });
  }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key === 'Escape') {
      send({ kind: 'back' });
    } else if (KEYMAP[e.key]) {
      send({ kind: 'key', keycode: KEYMAP[e.key] });
    } else if (e.key.length === 1) {
      send({ kind: 'text', text: e.key });
    } else {
      return;
    }
    e.preventDefault();
  });

  root.addEventListener('click', e => {
    const button = /** @type {HTMLElement} */ (e.target).closest('[data-mirror-action]');
    if (!button) {
      return;
    }
    const action = button.getAttribute('data-mirror-action');
    if (action === 'home' || action === 'recents') {
      send({ kind: 'key', keycode: KEY[action] });
    } else if (action === 'back' || action === 'rotate') {
      send({ kind: action });
    } else {
      post({ type: 'mirrorAction', action });
    }
  });

  window.addEventListener('message', event => {
    const msg = event.data;
    if (root.dataset.state === 'unsupported') {
      return;
    }
    switch (msg.type) {
      case 'mirrorFrame':
        onFrame(msg);
        break;
      case 'mirrorStarted':
        resetDecoder();
        canvas.width = msg.width;
        canvas.height = msg.height;
        setState('starting', 'Waiting for video...');
        break;
      case 'mirrorStopped':
        resetDecoder();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setState('idle', msg.reason || failure);
        failure = '';
        break;
      case 'mirrorState':
        if (root.dataset.state === 'unsupported') {
          break;
        }
        if (msg.state !== 'running' || root.dataset.state === 'idle') {
          setState(msg.state, msg.text);
        }
        break;
    }
  });

  // @ts-ignore - WebCodecs
  if (typeof VideoDecoder === 'undefined') {
    setState('unsupported', 'This VS Code build cannot decode video. Use the native window instead.');
  }
  post({ type: 'mirrorReady' });
})();
