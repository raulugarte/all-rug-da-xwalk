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
 * Fetch article by content fragment path + variation.
 * Expects the block to have:
 *  - data-reference="/content/dam/...."
 *  - data-content-fragment-variation="master" (or other)
 */
async function fetchArticle(block) {
  const reference = (block.dataset.reference || '').trim();
  const variation =
    (block.dataset.contentFragmentVariation || '').trim() || 'master';

  // Gracefully do nothing when no reference is set (e.g. author has not picked a CF yet)
  if (!reference) {
    console.debug(
      'content-fragment: no content fragment reference on block; skipping fetch',
      block,
    );
    return null;
  }

  const body = JSON.stringify({
    query: ARTICLE_BY_PATH_QUERY,
    variables: {
      path: reference,
      variation,
    },
  });

  let response;
  try {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
  } catch (e) {
    console.error('content-fragment: network error while fetching article', e);
    return null;
  }

  if (!response.ok) {
    console.error(
      `content-fragment: GraphQL HTTP error ${response.status} ${response.statusText}`,
    );
    return null;
  }

  let json;
  try {
    json = await response.json();
  } catch (e) {
    console.error('content-fragment: failed to parse GraphQL JSON', e);
    return null;
  }

  if (json.errors && json.errors.length) {
    console.error('content-fragment: GraphQL errors', json.errors);
    return null;
  }

  const articleByPath = json.data && json.data.articleByPath;
  const item = articleByPath && articleByPath.item;

  if (!item) {
    console.debug(
      'content-fragment: no article item returned for',
      reference,
      variation,
    );
    return null;
  }

  return item;
}

/**
 * Build DOM for the article content fragment.
 */
function renderArticle(block, article) {
  const { headline, heroImage } = article;

  const displayStyle = block.dataset.displaystyle || '';
  const alignment = block.dataset.alignment || '';
  const ctaStyle = block.dataset.ctastyle || '';

  // Apply style classes from UE configuration
  if (displayStyle) block.classList.add(displayStyle);
  if (alignment) block.classList.add(alignment);
  if (ctaStyle) block.classList.add(ctaStyle);

  // Clear original content
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';

  // Resolve hero image as object or array
  let hero = heroImage;
  if (Array.isArray(heroImage)) {
    hero = heroImage[0] || null;
  }

  // Image
  if (hero) {
    const imageUrl = hero._dynamicUrl || hero._publishUrl || null;
    if (imageUrl) {
      const figure = document.createElement('figure');
      figure.className = 'content-fragment-hero';

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = headline || '';

      figure.appendChild(img);
      wrapper.appendChild(figure);
    }
  }

  // Text
  const text = document.createElement('div');
  text.className = 'content-fragment-text';

  if (headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = headline;
    text.appendChild(h2);
  }

  wrapper.appendChild(text);
  block.appendChild(wrapper);
}

/**
 * Default decorate entry point.
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // Expect Universal Editor to emit something like:
  // <div class="content-fragment"
  //      data-reference="/content/dam/...."
  //      data-content-fragment-variation="master"
  //      data-displaystyle="image-left"
  //      data-alignment="text-left"
  //      data-ctastyle="cta-button">
  // </div>

  const article = await fetchArticle(block);
  if (!article) {
    // nothing to render (no reference, no data, or error)
    return;
  }

  renderArticle(block, article);
}
