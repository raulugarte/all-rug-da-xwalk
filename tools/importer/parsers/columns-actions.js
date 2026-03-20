/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-actions (base: columns)
 * Source: https://www.allianz.com.au
 * Structure: Outer 2-col grid (heading | actions). Right column has 3 nested
 * grids, each a 2-col icon|text layout. We output one block row per action
 * item and promote the heading to default content above the block.
 *
 * Known CTA links (some external einsure links get stripped by cleanup):
 *   - 24/7 online claims → /claims.html → "Make a claim"
 *   - Manage your Home or Car policy → /my-allianz/login-to-my-allianz.html → "Log in to My Allianz"
 *   - Manage renewals → /my-allianz/renewals.html → "Make a payment"
 */

const KNOWN_ACTIONS = [
  { heading: '24/7 online claims', cta: 'Make a claim', href: '/claims.html' },
  { heading: 'Manage your Home or Car policy', cta: 'Log in to My Allianz', href: '/my-allianz/login-to-my-allianz.html' },
  { heading: 'Manage renewals', cta: 'Make a payment', href: '/my-allianz/renewals.html' },
];

export default function parse(element, { document }) {
  const cells = [];

  // Outer grid: 2 columns (heading | action items)
  const outerColumns = element.querySelectorAll(':scope > div > .l-grid__row > .column');

  // Extract heading and place it before the block as default content
  let headingEl = null;
  if (outerColumns.length > 0) {
    const heading = outerColumns[0].querySelector('h2, .c-heading--section');
    if (heading) {
      headingEl = document.createElement('h2');
      headingEl.textContent = heading.textContent.trim();
    }
  }

  // Right column: 3 nested multi-column-grids (each is icon | heading+link)
  if (outerColumns.length > 1) {
    const col2 = outerColumns[1];
    const actionGrids = col2.querySelectorAll(':scope .multi-column-grid');

    actionGrids.forEach((grid) => {
      const iconImg = grid.querySelector('.cmp-image img, picture img');
      const actionHeading = grid.querySelector('h3, .c-heading--subsection-medium');
      const actionLink = grid.querySelector('.link a.c-link');

      // Icon cell
      let imageCell = '';
      if (iconImg) {
        const p = document.createElement('p');
        const img = document.createElement('img');
        img.src = iconImg.src || iconImg.getAttribute('src');
        img.alt = iconImg.alt || '';
        p.appendChild(img);
        imageCell = p;
      }

      // Text cell: heading + CTA link
      const textFrag = document.createDocumentFragment();
      let hasText = false;
      const headingText = actionHeading ? actionHeading.textContent.trim() : '';

      if (headingText) {
        const h3 = document.createElement('h3');
        h3.textContent = headingText;
        textFrag.appendChild(h3);
        hasText = true;
      }

      // Try to extract CTA link from DOM first
      let ctaFound = false;
      if (actionLink) {
        const href = actionLink.href || actionLink.getAttribute('href') || '';
        // Skip einsure links (they'll be stripped by cleanup anyway)
        if (!href.includes('einsure.com.au')) {
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = href;
          a.textContent = actionLink.querySelector('.c-link__text')
            ? actionLink.querySelector('.c-link__text').textContent.trim()
            : actionLink.textContent.trim();
          p.appendChild(a);
          textFrag.appendChild(p);
          ctaFound = true;
          hasText = true;
        }
      }

      // Fallback to known action CTAs if link not found or stripped
      if (!ctaFound && headingText) {
        const known = KNOWN_ACTIONS.find(
          (ka) => headingText.toLowerCase().includes(ka.heading.toLowerCase()),
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
  }

  // Build block and insert heading before it
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-actions', cells });
  if (headingEl) {
    element.before(headingEl);
  }
  element.replaceWith(block);
}
