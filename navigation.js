const allowed = new Set(['https:', 'http:']);
function resolveAddress(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(text) && !/^(localhost|[\w.-]+\.[a-z]{2,}):\d+([/?#]|$)/i.test(text)) {
    try { const url = new URL(text); return allowed.has(url.protocol) ? url.href : null; } catch { return null; }
  }
  if (!/\s/.test(text) && (/^[\w.-]+\.[a-z]{2,}([/:?#]|$)/i.test(text) || /^localhost([/:]|$)/i.test(text) || /^\d{1,3}(\.\d{1,3}){3}([/:]|$)/.test(text))) {
    try { return new URL((/^localhost|^127\./.test(text) ? 'http://' : 'https://') + text).href; } catch { return null; }
  }
  return 'https://www.google.com/search?q=' + encodeURIComponent(text);
}
module.exports = { resolveAddress };
