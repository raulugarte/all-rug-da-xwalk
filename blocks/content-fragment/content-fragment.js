const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

const ARTICLE_BY_PATH_QUERY = `
  query ArticleByPath($path: String!, $variation: String!) {
    articleByPath(_path: $path, variation: $variation) {
      item {
        headline
        heroImage {
          ... on ImageRef {
            _path
            _authorUrl
            _publishUrl
            _dynamicUrl
          }
        }
        _variations
        _metadata {
          stringMetadata {
            name
            value
          }
        }
      }
      _references {
        __typename
      }
    }
  }
`;

/**
 * Call AEM GraphQL to fetch a content fragment by path + variation.
 */
async function fetchArticle(path, variation) {
  const body = JSON.stringify({
    query: ARTICLE_BY_PATH_QUERY,
    variables: {
      path,
      variation: variation || 'master',
    },
  });

  const resp = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!resp.ok) {
    console.error('content-fragment: GraphQL HTTP error', resp.status, resp.statusText);
    return null;
  }

  const json = await resp.json();

  if (json.errors && json.errors.length) {
    console.error('content-fragment: GraphQL errors', json.errors);
    return null;
  }

  const article = json.data?.articleByPath?.item;
  if (!article) {
    console.warn('content-fragment: no article returned for path', path, 'variation', variation);
    return null;
  }

  return article;
}

/**
 * Extract configuration from the block.
 * Supports:
 *   1) data-* attributes (preferred, future-proof)
 *   2) Fallback: text lines inside the block, matching your current HTML:
 *      line 0: content fragment path
 *      line 1: displaystyle
 *      line 2: alignment
 *      line 3: ctastyle
 */
function extractConfig(block) {
  // 1) Preferred: data-* attributes
  let path = block.dataset.reference || '';
  let variation = block.dataset.contentFragmentVariation || '';
  let displaystyle = block.dataset.displaystyle || '';
  let alignment = block.dataset.alignment || '';
  let ctastyle = block.dataset.ctastyle || '';

  // 2) Fallback: parse plain text lines in the block (what you see in your first screenshot)
  if (!path) {
    const lines = block.textContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length > 0) {
      path = lines[0];
      if (!displaystyle && lines.length > 1) displaystyle = lines[1];
      if (!alignment && lines.length > 2) alignment = lines[2];
      if (!ctastyle && lines.length > 3) ctastyle = lines[3];
    }
  }

  // Default variation if nothing is set – adjust if your CF uses a different master name.
  if (!variation) {
    variation = 'master';
  }

  return {
    path,
    variation,
    displaystyle,
    alignment,
    ctastyle,
  };
}

/**
 * Render the article into the block.
 * Adjust markup/CSS classes as needed for your design.
 */
function renderArticle(block, article, cfg) {
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('content-fragment-inner');

  if (cfg.displaystyle) wrapper.classList.add(cfg.displaystyle);
  if (cfg.alignment) wrapper.classList.add(cfg.alignment);
  if (cfg.ctastyle) wrapper.classList.add(cfg.ctastyle);

  const textContainer = document.createElement('div');
  textContainer.classList.add('content-fragment-text');

  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.textContent = article.headline;
    textContainer.appendChild(h2);
  }

  const imgRef = article.heroImage;
  let imgUrl = null;

  if (imgRef) {
    imgUrl = imgRef._dynamicUrl || imgRef._publishUrl || imgRef._authorUrl;
  }

  let mediaContainer = null;
  if (imgUrl) {
    mediaContainer = document.createElement('div');
    mediaContainer.classList.add('content-fragment-media');

    const picture = document.createElement('picture');
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = article.headline || '';
    picture.appendChild(img);

    mediaContainer.appendChild(picture);
  }

  // Very simple layout: image + text
  wrapper.appendChild(textContainer);
  if (mediaContainer) {
    wrapper.appendChild(mediaContainer);
  }

  block.appendChild(wrapper);
}

export default async function decorate(block) {
  const cfg = extractConfig(block);

  if (!cfg.path) {
    console.warn('content-fragment: no reference set, skipping fetch');
    return;
  }

  try {
    const article = await fetchArticle(cfg.path, cfg.variation);
    if (!article) return;

    renderArticle(block, article, cfg);
  } catch (e) {
    console.error('content-fragment: unexpected error', e);
  }
}
