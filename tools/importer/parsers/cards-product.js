/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-product (base: cards)
 * Source: https://www.allianz.com.au
 * Structure: 3-column grid, each column has icon image, linked heading (h3),
 * link list, CTA button. CTA buttons that point to einsure.com.au get stripped
 * by cleanup, so we use known fallback CTAs.
 */

const KNOWN_CTAS = [
  { heading: 'Home Insurance', cta: 'Get a quote', href: '/home-insurance.html' },
  { heading: 'Car Insurance', cta: 'Get a quote', href: '/car-insurance.html' },
  { heading: 'CTP Insurance', cta: 'Select your state', href: '/ctp-insurance.html#select-state' },
];

export default function parse(element, { document }) {
  const cells = [];

  // Each column in the grid is a card
  const columns = element.querySelectorAll(':scope .l-grid__row > .column');

  columns.forEach((col) => {
    // Image cell: product icon (SVG)
    const img = col.querySelector('.cmp-image img, picture img, .c-image__img');
    let imageCell = '';
    if (img) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:image '));
      const p = document.createElement('p');
      const newImg = document.createElement('img');
      newImg.src = img.src || img.getAttribute('src');
      newImg.alt = img.alt || '';
      p.appendChild(newImg);
      frag.appendChild(p);
      imageCell = frag;
    }

    // Text content cell
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    let hasText = false;

    // Product heading with link
    const headingLink = col.querySelector('.c-link-list__headline a, h3 a');
    const headingText = headingLink ? headingLink.textContent.trim() : '';
    if (headingLink) {
      const h3 = document.createElement('h3');
      const a = document.createElement('a');
      a.href = headingLink.href || headingLink.getAttribute('href');
      a.textContent = headingText;
      h3.appendChild(a);
      textFrag.appendChild(h3);
      hasText = true;
    }

    // Sub-links list
    const subLinks = col.querySelectorAll('.c-link-list__list a.c-link');
    if (subLinks.length > 0) {
      const ul = document.createElement('ul');
      subLinks.forEach((link) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href || link.getAttribute('href');
        a.textContent = link.querySelector('.c-link__text')
          ? link.querySelector('.c-link__text').textContent.trim()
          : link.textContent.trim();
        li.appendChild(a);
        ul.appendChild(li);
      });
      textFrag.appendChild(ul);
      hasText = true;
    }

    // CTA button — try DOM first, then fallback to known CTAs
    let ctaFound = false;
    const cta = col.querySelector('a.c-button');
    if (cta) {
      const href = cta.href || cta.getAttribute('href') || '';
      if (!href.includes('einsure.com.au')) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = cta.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
        ctaFound = true;
        hasText = true;
      }
    }

    // Fallback CTA for stripped einsure links
    if (!ctaFound && headingText) {
      const known = KNOWN_CTAS.find(
        (kc) => headingText.toLowerCase().includes(kc.heading.toLowerCase()),
      );
      if (known) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = known.href;
        a.textContent = known.cta;
        p.appendChild(a);
        textFrag.appendChild(p);
        hasText = true;
      }
    }

    if (imageCell || hasText) {
      cells.push([imageCell || '', hasText ? textFrag : '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}
