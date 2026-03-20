/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-partner (base: columns)
 * Source: https://www.allianz.com.au
 * Selector: .parsys > .experiencefragment:nth-of-type(2) .multi-column-grid
 * Structure: 2-column layout - left: Olympic/Paralympic logo image, right: partnership text
 * Columns table: N cells per row representing columns
 */
export default function parse(element, { document }) {
  const cells = [];

  // 2 columns in a 4+8 grid
  // Found in captured HTML: .column.l-grid__column-large-4 and .column.l-grid__column-large-8
  const columns = element.querySelectorAll(':scope > div > .l-grid__row > .column, :scope .multi-grid-columnLayout-sameHeights > .l-grid__row > .column');

  const row = [];

  // Column 1: Partnership logo image
  if (columns.length > 0) {
    const col1 = columns[0];
    const img = col1.querySelector('.cmp-image img, picture img, .c-image__img');
    row.push(img || '');
  }

  // Column 2: Partnership text
  if (columns.length > 1) {
    const col2 = columns[1];
    // Found in captured HTML: <div class="c-copy c-copy--large"><div><p>Allianz is proud to be...</p></div></div>
    const textEl = col2.querySelector('.c-copy p, .text p');
    if (textEl) {
      const p = document.createElement('p');
      p.textContent = textEl.textContent.trim();
      row.push(p);
    } else {
      row.push('');
    }
  }

  if (row.length > 0) {
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-partner', cells });
  element.replaceWith(block);
}
