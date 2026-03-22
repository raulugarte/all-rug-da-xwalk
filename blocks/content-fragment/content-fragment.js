// GraphQL endpoint you provided
const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

// If ArticleByPath is NOT a persisted query, keep this query string.
// If it IS persisted, you can change buildGraphQLBody accordingly (see comment below).
const ARTICLE_BY_PATH_QUERY = `query ArticleByPath($path: String!, $variation: String!) {
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
}`;

/**
 * Build body for non-persisted query endpoint. If ArticleByPath is a persisted query,
 * you can change this to:
 *
 *   return { variables: { path, variation } };
 *
 * and keep GRAPHQL_ENDPOINT as-is.
 */
function buildGraphQLBody(path, variation) {
  return {
    query: ARTICLE_BY_PATH_QUERY,
    variables: { path, variation },
  };
}

async function fetchArticle(path, variation) {
  if (!path) {
    // Don't throw – just no-op if author hasn't selected a CF yet
    console.warn('contentfragment: no reference set, skipping fetch');
    return null;
  }

  const body = buildGraphQLBody(path, variation || 'master');

  const resp = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    // Surface enough info to debug without breaking the page
    const text = await resp.text().catch(() => '');
    console.error('contentfragment: GraphQL error', resp.status, text);
    return null;
  }

  const json = await resp.json().catch(() => null);
  return json?.data?.articleByPath?.item || null;
}

function render(block, article, options) {
  block.innerHTML = '';

  if (!article) {
    block.classList.add('contentfragment-empty');
    return;
  }

  const { headline, heroImage } = article;

  const wrapper = document.createElement('div');
  wrapper.classList.add('contentfragment-inner');

  if (headline) {
    const h2 = document.createElement('h2');
    h2.textContent = headline;
    wrapper.appendChild(h2);
  }

  if (heroImage && (heroImage._dynamicUrl || heroImage._publishUrl)) {
    const img = document.createElement('img');
    img.src = heroImage._dynamicUrl || heroImage._publishUrl;
    img.alt = headline || '';
    wrapper.appendChild(img);
  }

  block.appendChild(wrapper);

  // Apply authorable style classes
  if (options.displayStyle) block.classList.add(options.displayStyle);
  if (options.alignment) block.classList.add(options.alignment);
  if (options.ctaStyle) block.classList.add(options.ctaStyle);
}

export default async function decorate(block) {
  // These match the data-* attributes from the template.html above
  const path = block.dataset.reference;
  const variation = block.dataset.contentFragmentVariation || 'master';

  const options = {
    displayStyle: block.dataset.displaystyle || '',
    alignment: block.dataset.alignment || '',
    ctaStyle: block.dataset.ctastyle || '',
  };

  const article = await fetchArticle(path, variation);
  render(block, article, options);
}
