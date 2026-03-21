/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-cover (base: cards)
 * Source: https://www.allianz.com.au/car-insurance.html
 * Selector: .parsys > .wrapper:nth-of-type(1) .multi-column-grid
 * Structure: 3-column grid, each column has product image, h3 heading,
 *   description, CTA button, feature checklist (check/cross icons), learn more link
 * Cards table: 2 columns per row (image | text content)
 * UE model: card { image (reference), text (richtext) }
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each column in the grid is a product cover card
  const columns = element.querySelectorAll(':scope .l-grid__row > .column');

  columns.forEach((col) => {
    // Image cell (field: image)
    const img = col.querySelector('.cmp-image img, picture img, .c-image__img');
    let imageCell = '';
    if (img) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:image '));
      const imgEl = document.createElement('img');
      imgEl.src = img.src || img.getAttribute('src');
      imgEl.alt = img.alt || '';
      frag.appendChild(imgEl);
      imageCell = frag;
    }

    // Text content cell (field: text)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    let hasText = false;

    // Heading (h3) with optional link
    const headingEl = col.querySelector('h3');
    if (headingEl) {
      const h3 = document.createElement('h3');
      const headingLink = headingEl.querySelector('a');
      if (headingLink) {
        const a = document.createElement('a');
        a.href = headingLink.href || headingLink.getAttribute('href');
        const linkText = headingLink.querySelector('.c-link__text');
        a.textContent = linkText
          ? linkText.textContent.trim()
          : headingLink.textContent.trim();
        h3.appendChild(a);
      } else {
        h3.textContent = headingEl.textContent.trim();
      }
      textFrag.appendChild(h3);
      hasText = true;
    }

    // Description paragraph (first .text .c-copy p, before the feature list)
    const textBlocks = col.querySelectorAll('.text .c-copy');
    if (textBlocks.length > 0) {
      const firstP = textBlocks[0].querySelector('p');
      if (firstP) {
        const p = document.createElement('p');
        p.textContent = firstP.textContent.trim();
        textFrag.appendChild(p);
        hasText = true;
      }
    }

    // Feature checklist (ul.c-list--icon with check/cross icons)
    const featureList = col.querySelector('ul.c-list--icon, ul.c-list');
    if (featureList) {
      const ul = document.createElement('ul');
      featureList.querySelectorAll('li.c-list__item').forEach((li) => {
        const newLi = document.createElement('li');
        const icon = li.querySelector('.c-icon');
        const isIncluded = icon && icon.classList.contains('c-icon--check');
        // Get text without icon text
        const text = li.textContent.trim();
        newLi.textContent = `${isIncluded ? '\u2713' : '\u2717'} ${text}`;
        ul.appendChild(newLi);
      });
      textFrag.appendChild(ul);
      hasText = true;
    }

    // Learn more link
    const learnMore = col.querySelector('.link a.c-link');
    if (learnMore) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = learnMore.href || learnMore.getAttribute('href');
      const linkText = learnMore.querySelector('.c-link__text');
      a.textContent = linkText
        ? linkText.textContent.trim()
        : learnMore.textContent.trim();
      p.appendChild(a);
      textFrag.appendChild(p);
      hasText = true;
    }

    if (imageCell || hasText) {
      cells.push([imageCell || '', hasText ? textFrag : '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-cover', cells });
  element.replaceWith(block);
}
