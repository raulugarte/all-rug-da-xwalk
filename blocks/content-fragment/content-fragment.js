/**
 * content-fragment.js
 *
 * Renders an article content fragment selected via the block model:
 * - reference: CF path
 * - contentFragmentVariation: variation name (default: "main")
 * - displaystyle, alignment, ctastyle: visual options
 *
 * Uses persisted GraphQL query:
 *   query ArticleByPath($path: String!, $variation: String!) { ... }
 * exposed at:
 *   /graphql/execute.json/securbank/ArticleByPath
 */

const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Read configuration from the block element.
 *
 * Expected attributes on the block root:
 *   data-reference="/content/dam/.../my-article"
 *   data-content-fragment-variation="main"
 *   data-displaystyle="image-left|image-right|image-top|image-bottom"
 *   data-alignment="text-left|text-right|text-center"
 *   data-ctastyle="cta-link|cta-button|cta-button-secondary|cta-button-dark"
 */
function getFragmentConfigFromBlock(block) {
  const path =
    block.dataset.reference?.trim() ||
    '';

  // default variation is "main" as requested
  const variationRaw =
    block.dataset.contentFragmentVariation?.trim() ||
    '';
  const variation = variationRaw || 'main';

  const displayStyle = block.dataset.displaystyle?.trim() || '';
  const alignment = block.dataset.alignment?.trim() || '';
  const ctaStyle = block.dataset.ctastyle?.trim() || '';

  if (!path) {
    // Soft-fail: log and let the block render nothing instead of crashing.
    // eslint-disable-next-line no-console
    console.warn('content-fragment: missing CF path; set data-reference on the block.');
    return null;
  }

  return {
    path,
    variation,
    displayStyle,
    alignment,
    ctaStyle,
  };
}

/**
 * Build the persisted query URL with path & variation parameters.
 */
function buildArticleByPathUrl(path, variation) {
  const url = new URL(GRAPHQL_ENDPOINT, window.location.origin);
  url.searchParams.set('path', path);
  url.searchParams.set('variation', variation || 'main');
  return url.toString();
}

/**
 * Fetch a single article via the ArticleByPath persisted query.
 *
 * Expected response shape:
 * {
 *   "data": {
 *     "articleByPath": {
 *       "item": {
 *         "headline": "...",
 *         "heroImage": {
 *           "_path": "...",
 *           "_authorUrl": "...",
 *           "_publishUrl": "...",
 *           "_dynamicUrl": "..."
 *         },
 *         "_variations": [...],
 *         "_metadata": { ... }
 *       },
 *       "_references": [...]
 *     }
 *   }
 * }
 */
async function fetchArticle(path, variation) {
  const url = buildArticleByPathUrl(path, variation);
  const res = await fetch(url, { method: 'GET' });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  const article =
    json?.data?.articleByPath?.item || null;

  return article;
}

/**
 * Helper to create an element with optional classes.
 */
function createElement(tag, classNames = []) {
  const el = document.createElement(tag);
  if (Array.isArray(classNames) && classNames.length) {
    el.classList.add(...classNames.filter(Boolean));
  } else if (typeof classNames === 'string' && classNames) {
    el.classList.add(classNames);
  }
  return el;
}

/**
 * Render the article CF into the block.
 * Uses minimal fields: headline + heroImage.
 * Extend here if you add e.g. main { plaintext } back to the query.
 */
function renderArticle(block, config, article) {
  block.textContent = '';

  // Root wrapper with UE instrumentation to open the CF
  const wrapper = createElement('article', ['content-fragment-wrapper']);
  wrapper.dataset.aueType = 'reference';
  wrapper.dataset.aueResource = config.path;

  // Headline
  if (article.headline) {
    const h = createElement('h2', ['content-fragment-headline']);
    h.textContent = article.headline;
    h.dataset.aueProp = 'headline';
    h.dataset.aueType = 'text';
    wrapper.appendChild(h);
  }

  // Hero image
  if (article.heroImage) {
    const imgRef = article.heroImage;
    const imgUrl = imgRef._dynamicUrl || imgRef._publishUrl || imgRef._authorUrl || '';

    if (imgUrl) {
      const figure = createElement('figure', ['content-fragment-hero']);
      figure.dataset.aueProp = 'heroImage';
      figure.dataset.aueType = 'reference';

      const img = createElement('img');
      img.src = imgUrl;
      img.alt = article.headline || '';
      img.loading = 'lazy';

      figure.appendChild(img);
      wrapper.appendChild(figure);
    }
  }

  // Optional: show variation or metadata if you like
  // Example: wrapper.dataset.variation = config.variation;

  block.appendChild(wrapper);

  // Apply visual style classes to the block itself
  if (config.displayStyle) {
    block.classList.add(config.displayStyle);
  }
  if (config.alignment) {
    block.classList.add(config.alignment);
  }
  if (config.ctaStyle) {
    block.classList.add(config.ctaStyle);
  }
}

/**
 * Block entry point.
 */
export default async function decorate(block) {
  try {
    const config = getFragmentConfigFromBlock(block);
    if (!config) {
      return;
    }

    const article = await fetchArticle(config.path, config.variation);

    if (!article) {
      // eslint-disable-next-line no-console
      console.warn('content-fragment: no article returned for path', config.path);
      return;
    }

    renderArticle(block, config, article);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load content fragment article', e);
  }
}
