import { useEffect } from 'react';

/**
 * Keeps `<meta name="robots" content="noindex">` in the document head while
 * the calling page is mounted, and removes it on unmount. The public QR
 * Station pages are thin, gym-specific content that must not shape our SEO
 * before a deliberate decision (QR Stations spec).
 */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
