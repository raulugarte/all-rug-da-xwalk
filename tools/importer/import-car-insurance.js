/* eslint-disable */
/* global WebImporter */

// Polyfill process.cwd for browser context (helix-importer path resolution needs it)
if (typeof globalThis !== 'undefined') {
  if (!globalThis.process) globalThis.process = {};
  if (typeof globalThis.process.cwd !== 'function') {
    globalThis.process.cwd = () => '/';
  }
}

// PARSER IMPORTS - Import all parsers needed for car-insurance template
import heroBannerParser from './parsers/hero-banner.js';
import cardsCoverParser from './parsers/cards-cover.js';
import tableParser from './parsers/table.js';
import columnsActionsParser from './parsers/columns-actions.js';
import columnsInfoParser from './parsers/columns-info.js';
import columnsFeaturesParser from './parsers/columns-features.js';
import cardsArticleParser from './parsers/cards-article.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS - Import all transformers from tools/importer/transformers/
import allianzCleanupTransformer from './transformers/allianz-cleanup.js';
import allianzSectionsTransformer from './transformers/allianz-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-cover': cardsCoverParser,
  'table': tableParser,
  'columns-actions': columnsActionsParser,
  'columns-info': columnsInfoParser,
  'columns-features': columnsFeaturesParser,
  'cards-article': cardsArticleParser,
  'accordion': accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'car-insurance',
  description: 'Allianz Australia car insurance product page with hero banner, cover options, comparison table, customer actions, CTP info, roadside assistance, trust signals, related content, FAQs, and conditions',
  urls: [
    'https://www.allianz.com.au/car-insurance.html'
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.parsys > .a1stage']
    },
    {
      name: 'cards-cover',
      headingMatch: 'Find the right Car Insurance',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'table',
      instances: ['.product-comparison-table-new']
    },
    {
      name: 'columns-actions',
      headingMatch: 'Already an Allianz',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-info',
      headingMatch: 'Compulsory Third Party',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'columns-features',
      headingMatch: 'Why choose Allianz',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'cards-article',
      headingMatch: 'Related content',
      gridSelector: '.multi-column-grid'
    },
    {
      name: 'accordion',
      headingMatch: 'Frequently asked questions',
      gridSelector: '.c-accordion'
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
      id: 'section-2-disclaimer',
      name: 'Policy Disclaimer',
      selector: '.parsys > .experiencefragment:nth-of-type(1)',
      style: null,
      blocks: [],
      defaultContent: ['p']
    },
    {
      id: 'section-2b-rating',
      name: 'Customer Rating',
      selector: '.parsys > .experiencefragment:nth-of-type(2)',
      style: 'dark-blue',
      blocks: [],
      defaultContent: ['img', 'p']
    },
    {
      id: 'section-3-covers',
      name: 'Cover Options',
      selector: '.parsys > .wrapper:nth-of-type(1)',
      style: null,
      blocks: ['cards-cover'],
      defaultContent: ['h2.headline']
    },
    {
      id: 'section-4-comparison',
      name: 'Comparison Table',
      headingMatch: 'Compare our Car Insurance',
      selector: ['.parsys > .wrapper:nth-of-type(2)', '.parsys > .product-comparison-table-new', '.parsys > .wrapper:nth-of-type(3)'],
      style: null,
      blocks: ['table'],
      defaultContent: ['h2.headline', 'div.text']
    },
    {
      id: 'section-5-states',
      name: 'State-Based Links',
      selector: '.parsys > .wrapper:nth-of-type(4)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', '.state-link-list']
    },
    {
      id: 'section-6-customer',
      name: 'Existing Customer Actions',
      headingMatch: 'Already an Allianz',
      selector: '.parsys > .wrapper:nth-of-type(5)',
      style: 'dark-blue',
      blocks: ['columns-actions'],
      defaultContent: ['h2.headline', 'p']
    },
    {
      id: 'section-7-ctp',
      name: 'CTP Information',
      selector: '.parsys > .wrapper:nth-of-type(6)',
      style: null,
      blocks: ['columns-info'],
      defaultContent: []
    },
    {
      id: 'section-8-roadside',
      name: 'Roadside Assistance',
      selector: '.parsys > .wrapper:nth-of-type(7)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', 'p', 'a.cta']
    },
    {
      id: 'section-9-why-choose',
      name: 'Why Choose Allianz',
      headingMatch: 'Why choose Allianz',
      selector: '.parsys > .wrapper:nth-of-type(9)',
      style: null,
      blocks: ['columns-features'],
      defaultContent: ['h2.headline']
    },
    {
      id: 'section-10-related',
      name: 'Related Content',
      selector: '.parsys > .wrapper:nth-of-type(10)',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['h2.headline']
    },
    {
      id: 'section-11-cta',
      name: 'Get Started CTA',
      selector: '.parsys > .experiencefragment:nth-of-type(3)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', 'a.cta']
    },
    {
      id: 'section-12-faq',
      name: 'FAQs',
      headingMatch: 'Frequently asked questions',
      selector: '.parsys > .wrapper:nth-of-type(11)',
      style: 'light-grey',
      blocks: ['accordion'],
      defaultContent: ['h2.headline']
    },
    {
      id: 'section-13-raa',
      name: 'RAA Insurance Info',
      selector: '.parsys > .wrapper:nth-of-type(12)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', 'p']
    },
    {
      id: 'section-14-help',
      name: 'Help Section',
      selector: '.parsys > .experiencefragment:nth-of-type(4)',
      style: 'light-blue',
      blocks: [],
      defaultContent: ['h2.headline', 'p', 'a.cta']
    },
    {
      id: 'section-15-social',
      name: 'Social Media Links',
      selector: '.parsys > .experiencefragment:nth-of-type(5)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', '.c-social-icon']
    },
    {
      id: 'section-16-conditions',
      name: 'Conditions/Footnotes',
      selector: '.parsys > .wrapper:nth-of-type(13)',
      style: null,
      blocks: [],
      defaultContent: ['h2.headline', '.c-list--ordered']
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
          grids.forEach((grid) => {
            pageBlocks.push({
              name: blockDef.name,
              selector: `heading:"${blockDef.headingMatch}" ${gridSel}`,
              element: grid,
              section: blockDef.section || null,
            });
          });
        } else {
          console.warn(`Block "${blockDef.name}": heading "${blockDef.headingMatch}" found but no "${gridSel}" inside`);
        }
      } else {
        console.warn(`Block "${blockDef.name}": no wrapper with heading "${blockDef.headingMatch}"`);
      }
      return;
    }

    // CSS selector-based matching
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

    // 6. Generate sanitized path
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
