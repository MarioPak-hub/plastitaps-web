import { useEffect } from 'react';

const SITE_URL = 'https://plastitaps.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo_plastitaps.png`;
const DEFAULT_TITLE = 'Plastitaps — Tapas Plásticas y Envases PET de Calidad Industrial';
const DEFAULT_DESCRIPTION =
  'Fabricante mexicano de tapas plásticas, envases PET y soluciones de empaque certificadas ISO 9001. Cotiza tapas para envases, botellas PET y empaques plásticos para tu empresa.';

function setMetaTag(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkTag(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Gestiona <title>, meta description, canonical, Open Graph y Twitter Card
 * por ruta. Sin react-helmet: el proyecto es un SPA con Vite (sin SSR), así
 * que actualiza el <head> en cada montaje de página.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  type = 'website',
  jsonLd,
}) {
  const fullTitle = title ? `${title} | Plastitaps` : DEFAULT_TITLE;

  useEffect(() => {
    document.title = fullTitle;

    setMetaTag('name', 'description', description);
    setLinkTag('canonical', `${SITE_URL}${path}`);

    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', `${SITE_URL}${path}`);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:locale', 'es_MX');
    setMetaTag('property', 'og:site_name', 'Plastitaps');

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);
  }, [fullTitle, description, path, image, type]);

  useEffect(() => {
    if (!jsonLd) return;
    const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    const scripts = items.map((data) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.textContent = JSON.stringify(data);
      document.head.appendChild(el);
      return el;
    });
    return () => scripts.forEach((el) => el.remove());
  }, [jsonLd]);

  return null;
}

export { SITE_URL };
