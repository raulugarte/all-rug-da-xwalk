import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * GraphQL endpoint from AEM:
 * /content/cq:graphql/securbank/endpoint
 * 
 * In most AEM setups it's recommended to use the .json extension for JSON output.
 * If your endpoint does not use .json, change GRAPHQL_ENDPOINT accordingly.
 */
const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleList';
                    

const ARTICLE_QUERY = `
  query ArticleList {
    articleList(
      limit: 3
      _assetTransform: {
        format: WEBP
        quality: 85
      }
    ) {
      items {
        _path
        headline
        main {
          plaintext
        }
        heroImage {
          ... on ImageRef {
            _publishUrl
            _dynamicUrl
          }
        }
      }
    }
  }
`;

/**
 * Fetch articles from AEM GraphQL.
 */
async function fetchArticles() {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: ARTICLE_QUERY }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors && json.errors.length) {
    // eslint-disable-next-line no-console
    console.error('GraphQL errors:', json.errors);
    throw new Error('GraphQL returned errors');
  }

  return json.data?.articleList?.items || [];
}

/**
 * Build a single article card DOM.
 */
function renderArticle(article) {
  const { _path, headline, main, heroImage } = article;

  const articleEl = document.createElement('article');
  articleEl.className = 'content-fragment__item';

  // Instrument the CF for Universal Editor:
  // - data-aue-resource points to the CF data node
  // - child elements use data-aue-prop for individual fields
  const cfDataPath = `${_path}/jcr:content/data/master`;
  articleEl.dataset.aueResource = `urn:aemconnection:${cfDataPath}`;
  articleEl.dataset.aueType = 'reference';

  // Image (heroImage)
  if (heroImage && (heroImage._dynamicUrl || heroImage._publishUrl)) {
    const heroUrl = heroImage._dynamicUrl || heroImage._publishUrl;
    const picture = createOptimizedPicture(heroUrl, headline || 'Article hero image', true);
    picture.classList.add('content-fragment__image');
    picture.dataset.aueProp = 'heroImage';
    picture.dataset.aueType = 'media';
    articleEl.appendChild(picture);
  }

  const body = document.createElement('div');
  body.className = 'content-fragment__body';

  // Headline
  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment__headline';
    h2.textContent = headline;
    h2.dataset.aueProp = 'headline';
    h2.dataset.aueType = 'text';
    body.appendChild(h2);
  }

  // Main text (plaintext)
  if (main?.plaintext) {
    const p = document.createElement('p');
    p.className = 'content-fragment__main';
    p.textContent = main.plaintext;
    p.dataset.aueProp = 'main';
    p.dataset.aueType = 'richtext';
    body.appendChild(p);
  }

  articleEl.appendChild(body);
  return articleEl;
}

/**
 * Default block decorator.
 * @param {Element} block
 */
export default async function decorate(block) {
  // Avoid double-initialization
  if (block.dataset.initialized) return;
  block.dataset.initialized = 'true';

  block.classList.add('content-fragment');

  // Optional: show a simple loading state
  const loading = document.createElement('div');
  loading.className = 'content-fragment__loading';
  loading.textContent = 'Loading articles…';
  block.innerHTML = '';
  block.appendChild(loading);

  try {
    const articles = await fetchArticles();

    block.innerHTML = '';
    if (!articles.length) {
      const empty = document.createElement('p');
      empty.className = 'content-fragment__empty';
      empty.textContent = 'No articles available.';
      block.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'content-fragment__list';

    articles.forEach((article) => {
      const item = renderArticle(article);
      list.appendChild(item);
    });

    block.appendChild(list);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load articles', e);
    block.innerHTML = '';
    const error = document.createElement('p');
    error.className = 'content-fragment__error';
    error.textContent = 'Unable to load articles.';
    block.appendChild(error);
  }
}
