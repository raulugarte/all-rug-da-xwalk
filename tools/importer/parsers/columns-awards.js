/* eslint-disable */
/* global WebImporter */

/**
 * Parser: columns-awards (base: columns)
 * Source: https://www.allianz.com.au
 * Selector: .parsys > .wrapper:nth-of-type(3) .multi-column-grid
 * Structure: 2-column layout - left: h2 + paragraph + link, right: awards image
 * Columns table: N cells per row representing columns
 */
export default function parse(element, { document }) {
  const cells = [];

  // 2 columns in a 6+6 grid
  // Found in captured HTML: .column.l-grid__column-large-6
  const columns = element.querySelectorAll(':scope > div > .l-grid__row > .column');

  const row = [];

  // Column 1: Text content (heading, paragraph, link)
  if (columns.length > 0) {
    const col1 = columns[0];
    const col1Content = [];

    // Heading
    // Found in captured HTML: <h2 class="c-heading c-heading--section">An <span>award-winning</span> insurer</h2>
    const heading = col1.querySelector('h2, .c-heading--section');
    if (heading) {
      const h2 = document.createElement('h2');
      h2.textContent = heading.textContent.trim();
      col1Content.push(h2);
    }

    // Description paragraph
    // Found in captured HTML: <div class="c-copy"><p>Recognised for Outstanding Value...</p></div>
    const desc = col1.querySelector('.c-copy p, .text p');
    if (desc) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      col1Content.push(p);
    }

    // Awards link
    // Found in captured HTML: <a class="c-link c-link--block" href="/about-us/who-we-are/awards.html">
    const link = col1.querySelector('.link a.c-link');
    if (link) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.href || link.getAttribute('href');
      a.textContent = link.querySelector('.c-link__text')
        ? link.querySelector('.c-link__text').textContent.trim()
        : link.textContent.trim();
      p.appendChild(a);
      col1Content.push(p);
    }

    row.push(col1Content.length > 0 ? col1Content : '');
  }

  // Column 2: Awards image
  if (columns.length > 1) {
    const col2 = columns[1];
    const img = col2.querySelector('.cmp-image img, picture img, .c-image__img');
    row.push(img || '');
  }

  if (row.length > 0) {
    cells.push(row);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-awards', cells });
  element.replaceWith(block);
}
