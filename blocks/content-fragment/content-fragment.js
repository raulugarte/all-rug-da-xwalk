const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleList';

/**
 * Fetch articles via persisted GraphQL query.
 * Assumes response:
 * {
 *   data: {
 *     articleList: {
 *       items: [
 *         {
 *           _path,
 *           headline,
 *           main: { plaintext },
 *           heroImage: { _dynamicUrl, _publishUrl }
 *         }
 *       ]
 *     }
 *   }
 * }
 */
async function fetchArticles(limit = 3) {
  const url = new URL(GRAPHQL_ENDPOINT, window.location.origin);
  // If your persisted query defines a $limit variable, this will be used.
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  const items = json?.data?.articleList?.items;

  if (!Array.isArray(items)) {
    console.warn('Unexpected GraphQL response shape:', json);
    return [];
  }

  return items;
}

/**
 * Build a single article DOM element with UE-friendly attributes.
 */
function buildArticleElement(article) {
  const { _path, headline, main, heroImage } = article;

  const articleEl = document.createElement('article');
  articleEl.classList.add('content-fragment');
  // UE instrumentation – allows UE to open the CF referenced by this block item
  articleEl.dataset.aueType = 'reference';
  articleEl.dataset.aueResource = _path;

  // Hero image (if present)
  if (heroImage) {
    const pictureWrapper = document.createElement('div');
    pictureWrapper.classList.add('content-fragment-hero');

    const img = document.createElement('img');
    const imgUrl = heroImage._dynamicUrl || heroImage._publishUrl || '';
    img.src = imgUrl;
    img.alt = headline || '';

    img.loading = 'lazy';

    // UE instrumentation – maps to the heroImage element of the CF
    img.dataset.aueProp = 'heroImage';
    img.dataset.aueType = 'media';

    pictureWrapper.appendChild(img);
    articleEl.appendChild(pictureWrapper);
  }

  // Text content wrapper
  const bodyWrapper = document.createElement('div');
  bodyWrapper.classList.add('content-fragment-body');

  // Headline
  if (headline) {
    const h2 = document.createElement('h2');
    h2.classList.add('content-fragment-headline');
    h2.textContent = headline;

    // UE instrumentation – headline field in the model
    h2.dataset.aueProp = 'headline';
    h2.dataset.aueType = 'text';

    bodyWrapper.appendChild(h2);
  }

  // Main text
  const mainText = main?.plaintext;
  if (mainText) {
    const p = document.createElement('p');
    p.classList.add('content-fragment-main');

    // Basic newline handling
    p.textContent = mainText;

    // UE instrumentation – main field in the model
    p.dataset.aueProp = 'main';
    p.dataset.aueType = 'richtext';

    bodyWrapper.appendChild(p);
  }

  articleEl.appendChild(bodyWrapper);
  return articleEl;
}

/**
 * Block decorate function.
 * Renders up to 3 articles from the persisted query.
 */
export default async function decorate(block) {
  block.classList.add('content-fragment-block');

  try {
    const articles = await fetchArticles(3);

    if (!articles.length) {
      block.textContent = 'No articles available.';
      return;
    }

    // Clear any authoring placeholder content
    block.innerHTML = '';

    const listEl = document.createElement('div');
    listEl.classList.add('content-fragment-list');

    articles.forEach((article) => {
      const articleEl = buildArticleElement(article);
      listEl.appendChild(articleEl);
    });

    block.appendChild(listEl);
  } catch (e) {
    /* eslint-disable no-console */
    console.error('Failed to load articles', e);
    /* eslint-enable no-console */

    block.textContent = 'Unable to load articles at this time.';
  }
}
