/* eslint-disable */
/* global WebImporter */

// Polyfill process.cwd for browser context (helix-importer path resolution needs it)
if (typeof globalThis !== 'undefined') {
  if (!globalThis.process) globalThis.process = {};
  if (typeof globalThis.process.cwd !== 'function') {
    globalThis.process.cwd = () => '/';
  }
}

// PARSER IMPORTS - Import all parsers needed for homepage template
import heroBannerParser from './parsers/hero-banner.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsArticleParser from './parsers/cards-article.js';
import columnsActionsParser from './parsers/columns-actions.js';
import columnsAwardsParser from './parsers/columns-awards.js';
import columnsFeaturesParser from './parsers/columns-features.js';
import columnsPartnerParser from './parsers/columns-partner.js';

// TRANSFORMER IMPORTS - Import all transformers from tools/importer/transformers/
import allianzCleanupTransformer from './transformers/allianz-cleanup.js';
import allianzSectionsTransformer from './transformers/allianz-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-product': cardsProductParser,
  'cards-article': cardsArticleParser,
  'columns-actions': columnsActionsParser,
  'columns-awards': columnsAwardsParser,
  'columns-features': columnsFeaturesParser,
  'columns-partner': columnsPartnerParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Allianz Australia homepage with insurance product offerings, promotions, and quick links',
  urls: [
    'https://www.allianz.com.au'
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.parsys > .a1stage']
    },
    {
      name: 'cards-product',
      headingMatch: 'Insurance with Allianz',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-actions',
      headingMatch: 'Already an Allianz customer',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-awards',
      headingMatch: 'award-winning insurer',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-features',
      headingMatch: 'What care looks like',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'cards-article',
      headingMatch: 'Let us help you',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-partner',
      headingMatch: 'Olympic',
      gridSelector: '.multi-column-grid'
    }
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero Banner',
      selector: '.parsys > .a1stage',
      style: null,
      blocks: ['hero-banner'],
      defaultContent: []
    },
    {
      id: 'section-2-products',
      name: 'Insurance Products',
      headingMatch: 'Insurance with Allianz',
      style: null,
      blocks: ['cards-product'],
      defaultContent: ['h2.c-heading', 'div.text .c-copy']
    },
    {
      id: 'section-3-customer',
      name: 'Existing Customer Actions',
      headingMatch: 'Already an Allianz customer',
      style: 'dark-blue',
      blocks: ['columns-actions'],
      defaultContent: []
    },
    {
      id: 'section-4-awards',
      name: 'Awards Section',
      headingMatch: 'award-winning insurer',
      style: null,
      blocks: ['columns-awards'],
      defaultContent: []
    },
    {
      id: 'section-5-care',
      name: 'What Care Looks Like',
      headingMatch: 'What care looks like',
      style: 'light-grey',
      blocks: ['columns-features'],
      defaultContent: ['h2.c-heading']
    },
    {
      id: 'section-6-articles',
      name: 'Help Articles',
      headingMatch: 'Let us help you',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['h2.c-heading', 'div.text .c-copy', 'div.link']
    },
    {
      id: 'section-8-hardship',
      name: 'Financial Hardship Support',
      headingMatch: 'Financial hardship',
      style: 'light-blue',
      blocks: [],
      defaultContent: ['h2.c-heading', 'div.text .c-copy', 'div.link']
    }
  ]
};

// TRANSFORMER REGISTRY - Array of transformer functions
// Section transformer runs after cleanup (both use afterTransform hook)
const transformers = [
  allianzCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [allianzSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    document: payload.document,
    url: payload.url,
    html: payload.html,
    params: payload.params,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find the closest .wrapper ancestor containing a heading that matches text.
 * Searches h1-h3 headings within .wrapper elements under .parsys.
 */
function findWrapperByHeading(document, headingText) {
  const lowerText = headingText.toLowerCase();
  const wrappers = document.querySelectorAll('.parsys > .wrapper');
  for (const wrapper of wrappers) {
    const headings = wrapper.querySelectorAll('h1, h2, h3');
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes(lowerText)) {
        return wrapper;
      }
    }
  }
  return null;
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Supports both CSS selector-based matching (instances) and
 * content-based matching (headingMatch + gridSelector).
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    // Content-based matching: find wrapper by heading, then locate grid inside
    if (blockDef.headingMatch) {
      const wrapper = findWrapperByHeading(document, blockDef.headingMatch);
      if (wrapper) {
        const gridSel = blockDef.gridSelector || '.multi-column-grid';
        const grids = wrapper.querySelectorAll(gridSel);
        if (grids.length > 0) {
          // Use only the first grid to avoid duplicates from nested grids
          pageBlocks.push({
            name: blockDef.name,
            selector: `heading:"${blockDef.headingMatch}" ${gridSel}`,
            element: grids[0],
            section: blockDef.section || null,
          });
        } else {
          console.warn(`Block "${blockDef.name}": heading "${blockDef.headingMatch}" found but no "${gridSel}" inside`);
        }
      } else {
        console.warn(`Block "${blockDef.name}": no wrapper with heading "${blockDef.headingMatch}"`);
      }
      return;
    }

    // CSS selector-based matching (original approach)
    if (blockDef.instances) {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((el) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element: el,
            section: blockDef.section || null,
          });
        });
      });
    }
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (ensure non-empty for homepage)
    let pathname = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '');
    if (!pathname) pathname = '/index';
    const path = WebImporter.FileUtils.sanitizePath(pathname);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
