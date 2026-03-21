/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-info (base: columns)
 * Source: https://www.allianz.com.au/car-insurance.html
 * Selector: .parsys > .wrapper:nth-of-type(6) .multi-column-grid
 * Structure: 2-column grid (8/4 ratio). Left: h2, paragraph with inline links,
 *   check/cross feature list, CTA button. Right: linked product image.
 * Columns table: 1 row with 2 cells (text | image)
 * Note: Columns blocks do NOT require field hint comments per xwalk hinting rules
 */
export default function parse(element, { document }) {
  const cells = [];
  const columns = element.querySelectorAll(':scope .l-grid__row > .column');

  if (columns.length >= 2) {
    // --- Left column: text content (h2 + paragraph + feature list + CTA) ---
    const leftCol = columns[0];
    const textFrag = document.createDocumentFragment();
    let hasText = false;

    // Heading (h2)
    const heading = leftCol.querySelector('h2, .c-heading--section');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.trim();
      textFrag.appendChild(h2);
      hasText = true;
    }

    // Description paragraph (may contain inline links)
    const copyDiv = leftCol.querySelector('.text .c-copy');
    if (copyDiv) {
      const paragraph = copyDiv.querySelector('p');
      if (paragraph) {
        const p = document.createElement('p');
        // Preserve inline links
        paragraph.childNodes.forEach((node) => {
          if (node.nodeType === 3) {
            // Text node
            p.appendChild(document.createTextNode(node.textContent));
          } else if (node.nodeName === 'A') {
            const a = document.createElement('a');
            a.href = node.href || node.getAttribute('href');
            const linkText = node.querySelector('.c-link__text');
            a.textContent = linkText
              ? linkText.textContent.trim()
              : node.textContent.trim();
            p.appendChild(a);
          } else {
            p.appendChild(document.createTextNode(node.textContent));
          }
        });
        textFrag.appendChild(p);
        hasText = true;
      }

      // Feature checklist (check/cross icons)
      const featureList = copyDiv.querySelector('ul.c-list--icon, ul.c-list');
      if (featureList) {
        const ul = document.createElement('ul');
        featureList.querySelectorAll('li.c-list__item').forEach((li) => {
          const newLi = document.createElement('li');
          const icon = li.querySelector('.c-icon');
          const isIncluded = icon && icon.classList.contains('c-icon--check');
          const text = li.textContent.trim();
          newLi.textContent = `${isIncluded ? '\u2713' : '\u2717'} ${text}`;
          ul.appendChild(newLi);
        });
        textFrag.appendChild(ul);
        hasText = true;
      }
    }

    // CTA button
    const ctaLink = leftCol.querySelector('.button a.c-button, .button a');
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaLink.href || ctaLink.getAttribute('href');
      const btnText = ctaLink.querySelector('span');
      a.textContent = btnText
        ? btnText.textContent.trim()
        : ctaLink.textContent.trim();
      p.appendChild(a);
      textFrag.appendChild(p);
      hasText = true;
    }

    // --- Right column: image ---
    const rightCol = columns[1];
    const img = rightCol.querySelector('.cmp-image img, picture img, .c-image__img');
    let imageCell = '';
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.src || img.getAttribute('src');
      imgEl.alt = img.alt || '';
      imageCell = imgEl;
    }

    cells.push([hasText ? textFrag : '', imageCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-info', cells });
  element.replaceWith(block);
}
