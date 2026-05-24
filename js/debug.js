// Brennan's Soccer Showdown - Debug helpers
// Activated when URL has ?debug=1 or #debug. Always shows an on-screen
// overlay when a runtime error is caught, so silent freezes on mobile
// become visible without a desktop devtools connection.

(function () {
  const params = new URLSearchParams(window.location.search);
  const debugEnabled =
    params.get('debug') === '1' ||
    params.get('debug') === 'true' ||
    window.location.hash.toLowerCase().includes('debug');

  window.DEBUG_MODE = debugEnabled;

  // === Error overlay (always on) ===
  function ensureOverlay() {
    let el = document.getElementById('errorOverlay');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'errorOverlay';
    el.innerHTML =
      '<button class="close" type="button">CLOSE</button>' +
      '<div class="title">Runtime error</div>' +
      '<div class="body"></div>';
    document.body.appendChild(el);
    el.querySelector('.close').addEventListener('click', () => {
      el.classList.remove('visible');
      // If the same error keeps firing, don't immediately re-pop.
      if (typeof window.__suppressDebugError === 'function') {
        window.__suppressDebugError(5000);
      }
    });
    return el;
  }

  let lastSig = '';
  let lastCount = 0;
  let suppressedUntil = 0;

  function showError(label, err) {
    try {
      const msg = err && err.message ? err.message : String(err);
      const stack = err && err.stack ? '\n\n' + err.stack : '';
      const sig = label + '|' + msg;
      // If user dismissed and the same error keeps firing, stay quiet for a bit.
      if (Date.now() < suppressedUntil && sig === lastSig) return;

      const el = ensureOverlay();
      const body = el.querySelector('.body');

      if (sig === lastSig) {
        lastCount++;
        const head = body.querySelector('.count') || (() => {
          const s = document.createElement('div');
          s.className = 'count';
          body.insertBefore(s, body.firstChild);
          return s;
        })();
        head.textContent = '(repeated x' + lastCount + ')\n';
      } else {
        lastSig = sig;
        lastCount = 1;
        const time = new Date().toLocaleTimeString();
        body.textContent = '[' + time + '] ' + label + ': ' + msg + stack;
      }
      el.classList.add('visible');
    } catch (e) {
      try { console.error('overlay failed', e); } catch (_) {}
    }
  }

  window.__suppressDebugError = function (ms) {
    suppressedUntil = Date.now() + (ms || 5000);
  };

  window.__showDebugError = showError;

  window.addEventListener('error', (ev) => {
    showError('error', ev.error || ev.message);
  });
  window.addEventListener('unhandledrejection', (ev) => {
    showError('unhandledrejection', ev.reason);
  });

  // === Debug-only extras ===
  if (!debugEnabled) return;

  // Badge so you can tell debug mode is active
  const badge = document.createElement('div');
  badge.id = 'debugBadge';
  badge.textContent = 'DEBUG';
  document.body.appendChild(badge);

  // Load Eruda (mobile console). Use defer so it doesn't block.
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/eruda';
  script.onload = function () {
    try {
      window.eruda.init();
      // Expose engine handles for quick poking from Eruda console
      window.dbg = {
        engine: () => window.engine,
        app: () => window.app,
        goalAway: () => { window.engine.ball.lastKicker = window.engine.awayPlayers[4]; window.engine.goalScored('away'); },
        goalHome: () => { window.engine.ball.lastKicker = window.engine.homePlayers[4]; window.engine.goalScored('home'); },
        skipToFulltime: () => { window.engine.state = 'fulltime'; },
      };
      console.log('[debug] Eruda ready. Try dbg.goalAway() to force an away goal.');
    } catch (e) {
      showError('eruda init', e);
    }
  };
  script.onerror = function () {
    showError('eruda load', new Error('Failed to load Eruda from CDN — check network.'));
  };
  document.head.appendChild(script);
})();
