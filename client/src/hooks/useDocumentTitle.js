import { useEffect } from 'react';

const BASE = 'QUIET BATTLES™';
const DEFAULT_DESC = 'QUIET BATTLES™ is a premium fashion label told in chapters. Wear your battles.';

// Sets <title> and the meta description for the current page (good for SEO and the browser tab).
export default function useDocumentTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE}` : `${BASE} — Wear Your Battles.`;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = (description || DEFAULT_DESC).slice(0, 160);
  }, [title, description]);
}
