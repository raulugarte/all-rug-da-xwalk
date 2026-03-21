const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Reads CF config from the block.
 * Assumes a table like:
 *
 * | Path                                        | Variation |
 * | /content/dam/securbank/.../my-article      | main      |
 *
 * If Variation is empty, defaults to 'main'.
 */
function getFragmentConfigFromBlock(block) {
  const table = block.querySelector('table');
  if (!table) {
    return null;
  }

  const rows = table.rows;
  if (!rows || rows.length < 2) {
    return null;
  }

  const cells = rows[1].cells;
  if (!cells || cells.length === 0) {
    return null;
  }

  const path = cells[0]?.textContent?.trim() || '';
  // Default variation is 'main' (per your requirement)
  const variation = cells[1]?.textContent?.trim() || 'main';

  // Remove authoring table from the rendered content
  table.remove();

  return { path, variation };
}

/**
 * Calls the ArticleByPath persisted query.
 *
 * query ArticleByPath($path: String!, $variation: String!) {
 *   articleByPath(_path: $path, variation: $variation) {
 *     item {
 *       headline
 *       heroImage {
 *         ... on ImageRef {
 *           _path
 *           _authorUrl
 *           _publishUrl
 *           _dynamicUrl
 *         }
 *       }
 *       _variations
 *       _metadata {
 *         stringMetadata {
 *           name
 *           value
 *         }
 *       }
 *     }
 *     _references {
 *       __typename
 *     }
 *   }
 * }
 */
async function fetchArticle(path, variation) {
  if (!path) {
    throw new Error('Content Fragment path is required');
  }

  const url = new URL(GRAPHQL_ENDPOINT, window.location.origin);
  url.searchParams.set('path', path);
  url.searchParams.set('variation', variation || 'main');

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  const article = json?.data?.articleByPath?.item;

  if (!article) {
    throw new Error('No article item found in GraphQL response');
  }

  return article;
}

/**
 * Renders the article into the block.
 */
function renderArticle(block, article, cfg) {
  const { path, variation } = cfg;

  // Clear block contents
  block.innerHTML = '';

  const articleEl = document.createElement('article');
  articleEl.classList.add('content-fragment-article');

  // UE instrumentation for the CF itself
  articleEl.dataset.aueType = 'reference';
  articleEl.dataset.aueResource = path;
  articleEl.dataset.aueProp = 'article';
  articleEl.dataset.aueVariation = variation;

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.classList.add('content-fragment-headline');
    h2.textContent = article.headline;

    // UE instrumentation for the headline element
    h2.dataset.aueType = 'text';
    h2.dataset.aueProp = 'headline';
    articleEl.appendChild(h2);
  }

  // Hero image
  const hero = article.heroImage;
  if (hero) {
    const img = document.createElement('img');
    img.classList.add('content-fragment-hero-image');

    const src = hero._dynamicUrl || hero._publishUrl || hero._authorUrl;
    if (src) {
      img.src = src;
    }

    img.alt = article.headline || '';

    // UE instrumentation for the hero image asset
    img.dataset.aueType = 'asset';
    img.dataset.aueProp = 'heroImage';
    if (hero._path) {
      img.dataset.aueResource = hero._path;
    }

    articleEl.appendChild(img);
  }

  // You can also surface metadata if useful
  // Example: output all stringMetadata entries
  if (Array.isArray(article._metadata?.stringMetadata) && article._metadata.stringMetadata.length > 0) {
    const metaContainer = document.createElement('dl');
    metaContainer.classList.add('content-fragment-metadata');

    article._metadata.stringMetadata.forEach((m) => {
      const dt = document.createElement('dt');
      dt.textContent = m.name;
      const dd = document.createElement('dd');
      dd.textContent = m.value;
      metaContainer.append(dt, dd);
    });

    articleEl.appendChild(metaContainer);
  }

  block.appendChild(articleEl);
}

/**
 * Default block decorator.
 */
export default async function decorate(block) {
  const cfg = getFragmentConfigFromBlock(block);

  if (!cfg || !cfg.path) {
    console.warn('content-fragment: missing path/variation configuration');
    return;
  }

  try {
    const article = await fetchArticle(cfg.path, cfg.variation);
    renderArticle(block, article, cfg);
  } catch (e) {
    console.error('Failed to load content fragment article', e);
    block.innerHTML = '<p>Failed to load content.</p>';
  }
}
