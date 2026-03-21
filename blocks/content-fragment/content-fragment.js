/**
 * GraphQL endpoint for the ArticleByPath persisted query.
 *
 * If you've persisted the query as:
 *   securbank/ArticleByPath
 * the default EDS/AEM URL is:
 *   /graphql/execute.json/securbank/ArticleByPath
 *
 * Keep this relative so it works on both author and publish.
 */
const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * GraphQL query name and variables:
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

/**
 * Try to extract fragment config (path + variation) from the block.
 *
 * Supported patterns:
 *  1. data-fragment-path / data-fragment-variation on the block
 *  2. <table> with first row: [path, variation]
 *  3. Simple children: first child text = path, second child text = variation
 *
 * Default variation: "main"
 *
 * @param {HTMLElement} block
 * @returns {{ path: string, variation: string } | null}
 */
function getFragmentConfigFromBlock(block) {
  // 1) Data attributes on the block itself (recommended)
  let path =
    block.dataset.fragmentPath?.trim() ||
    block.dataset.aueResource?.trim() || // fallback if UE puts path here
    '';

  let variation =
    block.dataset.fragmentVariation?.trim() ||
    'main'; // default variation

  // If we already have a path from data attributes, we're done
  if (path) {
    return { path, variation };
  }

  // 2) Table-based configuration (classic xwalk pattern)
  const table = block.querySelector('table');
  if (table) {
    const rows = table.rows;
    if (rows.length > 0) {
      const firstRow = rows[0];
      const pathCell = firstRow.cells[0];
      const variationCell = firstRow.cells[1];

      if (pathCell) {
        path = pathCell.textContent.trim();
      }
      if (variationCell && variationCell.textContent.trim()) {
        variation = variationCell.textContent.trim();
      }
    }

    if (path) {
      return { path, variation };
    }
  }

  // 3) Simple children: first child = path, second child = variation
  const directChildren = Array.from(block.children).filter(
    (el) => !el.matches('picture, img') && !el.matches('table'),
  );

  if (directChildren.length > 0) {
    const first = directChildren[0];
    const second = directChildren[1];

    if (!path && first) {
      path = first.textContent.trim();
    }
    if (second && second.textContent.trim()) {
      variation = second.textContent.trim();
    }
  }

  if (!path) {
    // Nothing found – log and skip
    console.warn('content-fragment: missing path/variation configuration', {
      block,
    });
    return null;
  }

  return { path, variation };
}

/**
 * Call the ArticleByPath persisted query for a given path + variation.
 *
 * @param {string} path
 * @param {string} variation
 * @returns {Promise<object|null>} article item or null
 */
async function fetchArticleByPath(path, variation) {
  // We assume "path" and "variation" can be passed as query parameters to the persisted query.
  const url = new URL(GRAPHQL_ENDPOINT, window.location.origin);
  url.searchParams.set('path', path);
  url.searchParams.set('variation', variation);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-store',
    },
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  const json = await response.json();

  if (!json.data || !json.data.articleByPath || !json.data.articleByPath.item) {
    console.warn('content-fragment: no item found in GraphQL response', json);
    return null;
  }

  return json.data.articleByPath.item;
}

/**
 * Create DOM for a single article item.
 *
 * @param {object} article
 * @returns {HTMLElement}
 */
function renderArticle(article) {
  const container = document.createElement('article');
  container.classList.add('cf-article');
  // UE instrumentation
  if (article._path) {
    container.dataset.aueType = 'reference';
    container.dataset.aueResource = article._path;
  }

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.classList.add('cf-headline');
    h2.textContent = article.headline;
    h2.dataset.aueProp = 'headline';
    h2.dataset.aueType = 'text';
    container.appendChild(h2);
  }

  // Hero image
  if (article.heroImage && article.heroImage._dynamicUrl) {
    const picture = document.createElement('picture');
    picture.classList.add('cf-hero');

    const img = document.createElement('img');
    img.src = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    img.alt = article.headline || '';
    img.loading = 'lazy';
    img.dataset.aueProp = 'heroImage';
    img.dataset.aueType = 'media';

    picture.appendChild(img);
    container.appendChild(picture);
  }

  // You can extend this to render metadata, variations, etc.
  return container;
}

/**
 * Decorate function called by the block loader.
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const cfg = getFragmentConfigFromBlock(block);

  if (!cfg) {
    // Configuration missing, nothing to render
    return;
  }

  try {
    const article = await fetchArticleByPath(cfg.path, cfg.variation);

    // Clear the original content (table/placeholder)
    block.textContent = '';

    if (!article) {
      const msg = document.createElement('p');
      msg.classList.add('cf-empty');
      msg.textContent = 'No article found for the given path/variation.';
      block.appendChild(msg);
      return;
    }

    const articleEl = renderArticle(article);
    block.appendChild(articleEl);
  } catch (e) {
    console.error('content-fragment: failed to load article', e);
    const errorMsg = document.createElement('p');
    errorMsg.classList.add('cf-error');
    errorMsg.textContent = 'There was a problem loading the article.';
    block.appendChild(errorMsg);
  }
}
