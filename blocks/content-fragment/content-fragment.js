const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Extract configuration from the block.
 *
 * Supports two patterns:
 * 1) Preferred: data attributes on the block element:
 *    - data-reference
 *    - data-content-fragment-variation
 *    - data-displaystyle
 *    - data-alignment
 *    - data-ctastyle
 *
 * 2) Current (fallback): plain text lines inside the block:
 *    line 1: path
 *    line 2: variation (optional)
 *    line 3: displaystyle (optional)
 *    line 4: alignment (optional)
 *    line 5: ctastyle (optional)
 *
 * @param {HTMLElement} block
 * @returns {{ path: string, variation: string, displaystyle: string, alignment: string, ctaStyle: string }}
 */
function getBlockConfig(block) {
  // 1. Try data-* attributes first (future-proof)
  const path = block.dataset.reference || '';
  const variation = block.dataset.contentFragmentVariation || '';
  const displaystyle = block.dataset.displaystyle || '';
  const alignment = block.dataset.alignment || '';
  const ctaStyle = block.dataset.ctastyle || '';

  if (path) {
    return { path, variation, displaystyle, alignment, ctaStyle };
  }

  // 2. Fallback: parse text content by lines (matches your current setup)
  const lines = (block.textContent || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return {
    path: lines[0] || '',
    variation: lines[1] || '',
    displaystyle: lines[2] || '',
    alignment: lines[3] || '',
    ctaStyle: lines[4] || '',
  };
}

/**
 * Build the persisted query URL using matrix params, e.g.:
 * /graphql/execute.json/securbank/ArticleByPath;path=/content/...;variation=testvar
 *
 * @param {string} path
 * @param {string} variation
 * @returns {string}
 */
function buildGraphqlUrl(path, variation) {
  let url = `${GRAPHQL_ENDPOINT};path=${path}`;
  if (variation) {
    url += `;variation=${variation}`;
  }
  return url;
}

/**
 * Fetch article data for a given path + variation.
 *
 * @param {string} path
 * @param {string} variation
 * @returns {Promise<import('./types').ArticleData|null>}  // informal type hint
 */
async function fetchArticle(path, variation) {
  const url = buildGraphqlUrl(path, variation);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.error('contentfragment: GraphQL request failed', response.status, response.statusText);
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    console.error('contentfragment: failed to parse GraphQL response as JSON', e);
    return null;
  }

  if (!data || !data.data || !data.data.articleByPath || !data.data.articleByPath.item) {
    console.warn('contentfragment: no article returned for', path, variation || '(no variation)');
    return null;
  }

  return data.data.articleByPath.item;
}

/**
 * Render the article data into the block.
 *
 * Currently renders:
 * - headline
 * - hero image (dynamicUrl, publishUrl, or path)
 *
 * @param {HTMLElement} block
 * @param {object} article
 * @param {string} displaystyle
 * @param {string} alignment
 * @param {string} ctaStyle
 */
function renderArticle(block, article, displaystyle, alignment, ctaStyle) {
  block.innerHTML = '';

  const classes = ['content-fragment'];
  if (displaystyle) classes.push(displaystyle);
  if (alignment) classes.push(alignment);
  if (ctaStyle) classes.push(ctaStyle);
  block.classList.add(...classes);

  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;
    wrapper.appendChild(h2);
  }

  // Hero image
  const hero = article.heroImage && article.heroImage[0];
  if (hero) {
    const imgUrl = hero._dynamicUrl || hero._publishUrl || hero._path;
    if (imgUrl) {
      const figure = document.createElement('figure');
      figure.className = 'content-fragment-hero';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = article.headline || '';
      figure.appendChild(img);

      wrapper.appendChild(figure);
    }
  }

  // TODO: extend with body text, metadata, CTAs, etc., if needed.

  block.appendChild(wrapper);
}

/**
 * Main decorate entrypoint for the block.
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const { path, variation, displaystyle, alignment, ctaStyle } = getBlockConfig(block);

  if (!path) {
    // Nothing configured; leave block as-is
    console.warn('contentfragment: no content fragment path found, skipping fetch');
    return;
  }

  try {
    const article = await fetchArticle(path, variation);
    if (!article) {
      return;
    }

    renderArticle(block, article, displaystyle, alignment, ctaStyle);
  } catch (e) {
    console.error('contentfragment: unexpected error while loading article', e);
  }
}
