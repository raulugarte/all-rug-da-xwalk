/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-features (base: columns)
 * Source: https://www.allianz.com.au
 * Selector: .parsys > .wrapper:nth-of-type(4) .multi-column-grid
 * Structure: 4-column grid, each column has icon image + descriptive text (span heading)
 * Columns table: N cells per row representing columns
 */
export default function parse(element, { document }) {
  const cells = [];

  // 4 columns in a 3+3+3+3 grid
  // Found in captured HTML: .column.l-grid__column-large-3
  const columns = element.querySelectorAll(':scope > div > .l-grid__row > .column');

  const row = [];

  columns.forEach((col) => {
    const colContent = [];

    // Icon image
    // Found in captured HTML: <picture class="cmp-image c-image"><img src="...icon-blu-4col-team.svg">
    const img = col.querySelector('.cmp-image img, picture img, .c-image__img');
    if (img) {
      const imgEl = document.createElement('img');
      imgEl.src = img.src || img.getAttribute('src');
      imgEl.alt = img.alt || '';
      colContent.push(imgEl);
    }

    // Descriptive text (uses span.c-heading instead of h-tag)
    // Found in captured HTML: <span class="c-heading c-heading--subsection-medium">Support built on over 110 years...</span>
    const text = col.querySelector('.headline span.c-heading, .headline .c-heading');
    if (text) {
      const p = document.createElement('p');
      p.textContent = text.textContent.trim();
      colContent.push(p);
    }

    row.push(colContent.length > 0 ? colContent : '');
  });

  if (row.length > 0) {
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-features', cells });
  element.replaceWith(block);
}
