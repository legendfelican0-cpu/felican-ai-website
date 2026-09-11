// Picks the smallest image format this browser can actually decode, for the images
// whose src is assigned at runtime by the <x-dc> templates (the product, agent and
// app covers on /products/, and the Starter Pack covers).
//
// Why this exists instead of server-side Accept negotiation: Cloudflare honours only
// `Vary: Accept-Encoding` and ignores `Vary: Accept`, so a negotiated response is
// cached once and handed to every client. A browser without AVIF support then receives
// AVIF and renders a broken image. One URL per format avoids the problem entirely,
// because each variant is a distinct cache entry.
//
// The static markup on the generated pages uses <picture>, which the browser resolves
// natively. This file covers only the runtime case.
//
// It sets window.felicanImageUrl(src) -> the best variant URL. Until detection
// resolves, calls fall back to the original path, so an image never fails to load
// because the probe was slow.

(() => {
  'use strict';

  // 1x1 test images. If the browser decodes one, it supports the format.
  const PROBES = {
    avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=',
    webp: 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  };

  // Start with the original path; upgrade as each probe resolves.
  let best = '';

  const probe = (format, dataUri) => new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve(image.width > 0 && image.height > 0);
    image.onerror = () => resolve(false);
    image.src = dataUri;
  });

  // AVIF is materially smaller than WebP on these screenshots, so prefer it.
  const ready = (async () => {
    try {
      if (await probe('avif', PROBES.avif)) { best = '.avif'; return; }
      if (await probe('webp', PROBES.webp)) { best = '.webp'; return; }
    } catch {
      // Any failure leaves `best` empty and the original file is used.
    }
  })();

  // Returns the best variant URL for a PNG/JPEG path, or the path unchanged.
  function felicanImageUrl(src) {
    if (!src || !best) return src || '';
    return src.replace(/\.(png|jpe?g)(\?.*)?$/i, (_match, _ext, query) => best + (query || ''));
  }

  window.felicanImageUrl = felicanImageUrl;
  window.felicanImageFormatReady = ready;
})();
