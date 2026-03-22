const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Read configuration for this block from data-* attributes.
 *
 * Expected on the block root:
 *   data-reference                        → CF path (required)
 *   data-content-fragment-variation       → variation (optional, defaults to "main")
 *   data-displaystyle                     → style class (optional)
 *   data-alignment                        → style class (optional)
 *   data-ctastyle                         → style class (optional)
 */
function getFragmentConfigFromBlock(block) {
  // Try a few reasonable attribute names for the CF path
  const path =
    block.dataset.reference?.trim() ||
    block.dataset.cfPath?.trim() ||
    block.dataset.contentFragmentPath?.trim() ||
    '';

  // Default variation is "main" if nothing is configured
  const variation =
    block.dataset.contentFragmentVariation?.trim() ||
    block.dataset.variation?.trim() ||
    'main';

  const displayStyle = block.dataset.displaystyle?.trim() || '';
  const alignment = block.dataset.alignment?.trim() || '';
  const ctaStyle = block.dataset.ctastyle?.trim() || '';

  if (!path) {
    // If you see this in the console, make sure your block root has data-reference set.
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
 * Call the persisted query ArticleByPath on AEM.
 * Expects response shape:
 * {
 *   data: {
 *     articleByPath: {
 *       item: {
 *         headline,
 *         heroImage { _path, _authorUrl, _publishUrl, _dynamicUrl },
 *         _variations,
 *         _metadata { stringMetadata[] }
 *       },
 *       _references { ... }
 *     }
 *   }
 * }
 */
async function fetchArticle(config) {
  const { path, variation } = config;

  const params = new URLSearchParams({
    path,
    variation,
  });

  const url = `${GRAPHQL_ENDPOINT}?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include', // safe on author; ignored on anonymous publish
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  const articleByPath = json?.data?.articleByPath;
  const item = articleByPath?.item;

  if (!item) {
    console.warn('content-fragment: no item returned for path/variation', { path, variation, json });
    return null;
  }

  return item;
}

/**
 * Render a single article content fragment into the block.
 */
function renderArticle(block, article, config) {
  const { displayStyle, alignment, ctaStyle } = config;

  // Clear existing markup
  block.innerHTML = '';
  block.classList.add('content-fragment-initialized');

  if (displayStyle) {
    block.classList.add(`content-fragment--${displayStyle}`);
  }
  if (alignment) {
    block.classList.add(`content-fragment--${alignment}`);
  }
  if (ctaStyle) {
    block.classList.add(`content-fragment--${ctaStyle}`);
  }

  const articleEl = document.createElement('article');
  articleEl.className = 'content-fragment-article';

  // UE instrumentation: reference to the CF item
  if (article._path) {
    articleEl.dataset.aueResource = article._path;
    articleEl.dataset.aueType = 'reference';
    articleEl.dataset.aueLabel = article.headline || 'Content Fragment';
  }

  // Hero image (if present)
  if (article.heroImage) {
    const imgUrl =
      article.heroImage._dynamicUrl ||
      article.heroImage._publishUrl ||
      article.heroImage._authorUrl;

    if (imgUrl) {
      const figure = document.createElement('figure');
      figure.className = 'content-fragment-hero';
      figure.dataset.aueProp = 'heroImage';
      figure.dataset.aueType = 'content-reference';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = article.headline || '';

      figure.appendChild(img);
      articleEl.appendChild(figure);
    }
  }

  const body = document.createElement('div');
  body.className = 'content-fragment-body';

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;
    h2.dataset.aueProp = 'headline';
    h2.dataset.aueType = 'text';
    body.appendChild(h2);
  }

  // NOTE:
  // Your current ArticleByPath query doesn't include "main { plaintext }".
  // If you add that back, you can render it here, e.g.:
  //
  // if (article.main?.plaintext) {
  //   const p = document.createElement('p');
  //   p.className = 'content-fragment-main';
  //   p.textContent = article.main.plaintext;
  //   p.dataset.aueProp = 'main';
  //   p.dataset.aueType = 'richtext';
  //   body.appendChild(p);
  // }

  articleEl.appendChild(body);
  block.appendChild(articleEl);
}

/**
 * Default decorate entry point for the block.
 */
export default async function decorate(block) {
  const config = getFragmentConfigFromBlock(block);
  if (!config) {
    return;
  }

  block.classList.add('content-fragment-loading');

  try {
    const article = await fetchArticle(config);
    if (!article) {
      block.classList.remove('content-fragment-loading');
      block.classList.add('content-fragment-empty');
      return;
    }

    renderArticle(block, article, config);
  } catch (e) {
    console.error('content-fragment: failed to load content fragment', e);
    block.classList.remove('content-fragment-loading');
    block.classList.add('content-fragment-error');
  } finally {
    block.classList.remove('content-fragment-loading');
  }
}
