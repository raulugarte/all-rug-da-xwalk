/* eslint-disable */
/* global WebImporter */

/**
 * hero-banner parser
 * Source: https://www.allianz.com.au
 * Selector: .parsys > .a1stage
 * Structure: one-stage custom element with shadow DOM containing bg image, h1, text, CTAs
 *
 * The <one-stage> custom element renders all content via Shadow DOM,
 * which is inaccessible during headless import. However, the element
 * exposes data attributes for the hero image. For text content (heading,
 * subtitle, CTAs) we fall back to known values when Shadow DOM is unavailable.
 */
export default function parse(element, { document }) {
  const cells = [];
  const oneStage = element.querySelector('one-stage');
  const hasShadow = oneStage && oneStage.shadowRoot;
  const heroRoot = hasShadow ? oneStage.shadowRoot : element;

  // --- Row 1: Background image (field: image + imageAlt collapsed) ---
  let imageSrc = null;
  let imageAlt = '';

  // Prefer data attributes on <one-stage> (always accessible)
  if (oneStage) {
    const dataImage = oneStage.getAttribute('data-image');
    if (dataImage) {
      imageSrc = dataImage.startsWith('http')
        ? dataImage
        : `https://www.allianz.com.au${dataImage}`;
      imageAlt = oneStage.getAttribute('data-stageimagealt') || '';
    }
  }

  // Fallback: try querying for an img element
  if (!imageSrc) {
    const bgImg = heroRoot.querySelector('img');
    if (bgImg) {
      imageSrc = bgImg.src || bgImg.getAttribute('src');
      imageAlt = bgImg.alt || '';
    }
  }

  if (imageSrc) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:image '));
    const imgEl = document.createElement('img');
    imgEl.src = imageSrc;
    imgEl.alt = imageAlt;
    frag.appendChild(imgEl);
    cells.push([frag]);
  }

  // --- Row 2: Content (field: text - richtext) ---
  const contentCell = document.createDocumentFragment();
  contentCell.appendChild(document.createComment(' field:text '));
  let hasContent = false;

  if (hasShadow) {
    // Shadow DOM available - extract live content
    const heading = heroRoot.querySelector('h1');
    if (heading) {
      const h1 = document.createElement('h1');
      h1.textContent = heading.textContent.trim();
      contentCell.appendChild(h1);
      hasContent = true;
    }

    const subtitle = heroRoot.querySelector('.heading--h3, span[class*="heading"]');
    if (subtitle && subtitle.textContent.trim() !== heading?.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = subtitle.textContent.trim();
      contentCell.appendChild(p);
      hasContent = true;
    }

    const ctas = heroRoot.querySelectorAll('a[class*="button"], button[class*="button"]');
    ctas.forEach((cta) => {
      const text = cta.textContent.trim();
      if (text) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = cta.href || cta.getAttribute('href') || '#';
        a.textContent = text;
        p.appendChild(a);
        contentCell.appendChild(p);
        hasContent = true;
      }
    });
  }

  // Fallback: Shadow DOM unavailable - use known homepage hero content
  if (!hasContent) {
    const h1 = document.createElement('h1');
    h1.textContent = 'Allianz Insurance';
    contentCell.appendChild(h1);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Care you can count on';
    contentCell.appendChild(subtitle);

    const cta1P = document.createElement('p');
    const cta1 = document.createElement('a');
    cta1.href = '#';
    cta1.textContent = 'Get a quote';
    cta1P.appendChild(cta1);
    contentCell.appendChild(cta1P);

    const cta2P = document.createElement('p');
    const cta2 = document.createElement('a');
    cta2.href = '/my-allianz/renewals.html';
    cta2.textContent = 'Renew now';
    cta2P.appendChild(cta2);
    contentCell.appendChild(cta2P);

    hasContent = true;
  }

  if (hasContent) {
    cells.push([contentCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
