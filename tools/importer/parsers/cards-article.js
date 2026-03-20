/* eslint-disable */
/* global WebImporter */

/**
 * Parser: cards-article (base: cards)
 * Source: https://www.allianz.com.au
 * Selector: .parsys > .wrapper:nth-of-type(5) .multi-column-grid
 * Structure: 3-column grid, each column has article image, linked heading (h3), description, read-more link
 * Cards table: 2 columns per row (image | text content)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each column in the grid is an article card
  // Found in captured HTML: .column.l-grid__column-large-4.multi-grid-columnLayout-margin
  const columns = element.querySelectorAll(':scope .l-grid__row > .column');

  columns.forEach((col) => {
    // Image cell: article image (JPEG) (field: image)
    // Found in captured HTML: <picture class="cmp-image c-image"><img ... class="c-image__img">
    const img = col.querySelector('.cmp-image img, picture img, .c-image__img');
    let imageCell = '';
    if (img) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:image '));
      frag.appendChild(img);
      imageCell = frag;
    }

    // Text content cell (field: text)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    let hasText = false;

    // Article heading with link
    // Found in captured HTML: <h3 class="c-heading ..."><a href="..." class="c-link">
    const headingEl = col.querySelector('h3');
    if (headingEl) {
      const headingLink = headingEl.querySelector('a');
      const h3 = document.createElement('h3');
      if (headingLink) {
        const a = document.createElement('a');
        a.href = headingLink.href || headingLink.getAttribute('href');
        a.textContent = headingLink.querySelector('.c-link__text')
          ? headingLink.querySelector('.c-link__text').textContent.trim()
          : headingLink.textContent.trim();
        h3.appendChild(a);
      } else {
        h3.textContent = headingEl.textContent.trim();
      }
      textFrag.appendChild(h3);
      hasText = true;
    }

    // Description paragraph
    // Found in captured HTML: <div class="c-copy ..."><p>...</p></div>
    const desc = col.querySelector('.c-copy p, .text p');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      textFrag.appendChild(p);
      hasText = true;
    }

    // Read more link
    // Found in captured HTML: <div class="link"><a class="c-link c-link--block" href="...">
    const readMore = col.querySelector('.link a.c-link');
    if (readMore) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = readMore.href || readMore.getAttribute('href');
      a.textContent = readMore.querySelector('.c-link__text')
        ? readMore.querySelector('.c-link__text').textContent.trim()
        : readMore.textContent.trim();
      p.appendChild(a);
      textFrag.appendChild(p);
      hasText = true;
    }

    if (imageCell || hasText) {
      cells.push([imageCell || '', hasText ? textFrag : '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
