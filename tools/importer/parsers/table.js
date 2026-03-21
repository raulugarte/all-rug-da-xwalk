/* eslint-disable */
/* global WebImporter */

/**
 * Parser: table
 * Source: https://www.allianz.com.au/car-insurance.html
 * Selector: .parsys > .product-comparison-table-new
 * Structure: Product comparison table with 3 product columns + 1 feature column = 4 columns
 *   - Column headers: empty (feature label) + 3 product names (h3)
 *   - 7 feature rows, each a separate <table> in .service-sub-list
 *   - Check/cross icons indicate inclusion
 * UE model: table-col-4 { column1text, column2text, column3text, column4text }
 */
export default function parse(element, { document }) {
  const cells = [];

  // --- Header row: extract product column names ---
  const headerTable = element.querySelector('table.c-product-comparison__table-main-head');
  const headerRow = [];

  if (headerTable) {
    // First column header (Feature label)
    // md2jcr requires every cell to map to a model field, so provide content + hint
    const col1Frag = document.createDocumentFragment();
    col1Frag.appendChild(document.createComment(' field:column1text '));
    col1Frag.appendChild(document.createTextNode('Features'));
    headerRow.push(col1Frag);

    // Product column headers (3 products)
    const colHeaders = headerTable.querySelectorAll('td.c-product-comparison__col-header');
    const colFields = ['column2text', 'column3text', 'column4text'];

    colHeaders.forEach((col, i) => {
      const heading = col.querySelector('h3, .c-heading--comparison-table-col-headline');
      const frag = document.createDocumentFragment();
      if (i < colFields.length) {
        frag.appendChild(document.createComment(` field:${colFields[i]} `));
      }
      if (heading) {
        const strong = document.createElement('strong');
        strong.textContent = heading.textContent.trim();
        frag.appendChild(strong);
      }
      headerRow.push(frag);
    });
  }

  if (headerRow.length > 0) {
    cells.push(headerRow);
  }

  // --- Feature rows: each row is a separate table inside .service-list ---
  const featureTables = element.querySelectorAll('.service-list table.c-product-comparison__table');

  featureTables.forEach((table) => {
    const row = table.querySelector('tr.c-product-comparison__row, tr');
    if (!row) return;

    const rowCells = [];

    // Feature name (th row header)
    const rowHeader = row.querySelector('th.c-product-comparison__row-header');
    const featureFrag = document.createDocumentFragment();
    featureFrag.appendChild(document.createComment(' field:column1text '));
    if (rowHeader) {
      const featureContent = rowHeader.querySelector('.c-product-comparison__row-header-content');
      const text = featureContent
        ? featureContent.textContent.trim()
        : rowHeader.textContent.trim();
      featureFrag.appendChild(document.createTextNode(text));
    }
    rowCells.push(featureFrag);

    // Product cells (check/cross icons)
    const dataCells = row.querySelectorAll('td.c-product-comparison__cell');
    const colFields = ['column2text', 'column3text', 'column4text'];

    dataCells.forEach((cell, i) => {
      const frag = document.createDocumentFragment();
      if (i < colFields.length) {
        frag.appendChild(document.createComment(` field:${colFields[i]} `));
      }
      const icon = cell.querySelector('.c-icon');
      if (icon) {
        const isIncluded = icon.classList.contains('c-icon--check');
        const ariaLabel = icon.getAttribute('aria-label') || '';
        frag.appendChild(document.createTextNode(
          isIncluded ? `\u2713 ${ariaLabel || 'Included'}` : `\u2717 ${ariaLabel || 'Not included'}`,
        ));
      }
      rowCells.push(frag);
    });

    if (rowCells.length > 1) {
      cells.push(rowCells);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });
  element.replaceWith(block);
}
