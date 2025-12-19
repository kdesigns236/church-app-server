/* Dedicated worker for JSON.parse to keep main thread responsive */
self.onmessage = (event) => {
  try {
    const { text } = event.data || {};
    if (typeof text !== 'string') {
      self.postMessage({ ok: false, error: 'No text provided to parse' });
      return;
    }
    const data = JSON.parse(text);
    self.postMessage({ ok: true, data });
  } catch (err) {
    try {
      const message = err && err.message ? err.message : String(err);
      self.postMessage({ ok: false, error: message });
    } catch (_) {
      // If postMessage itself fails, there is nothing we can do in the worker
    }
  }
};
