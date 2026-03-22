const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

//https://author-p130407-e1279066.adobeaemcloud.com/graphql/execute.json/securbank/ArticleByPath;path=;variation=

/**
 * Optional: if you use a persisted query instead of sending `query` in body,
 * change `buildGraphQLRequest` accordingly.
 */

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
 * Build the fetch options for a non‑persisted GraphQL query.
 * If you use a persisted query, change this to just send variables.
 */
function buildGraphQLRequest(path, variation) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: ARTICLE_BY_PATH_QUERY,
      variables: {
        path,
        variation,
      },
    }),
  };
}

async function fetchArticle(path, variation) {
  if (!path) {
    throw new Error('Missing content fragment path (reference).');
  }

  // Fallback: if variation is empty, use 'master' (adjust to your model behaviour).
  const safeVariation = (variation && variation.trim()) || 'master';

  const res = await fetch(GRAPHQL_ENDPOINT, buildGraphQLRequest(path, safeVariation));

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL error (${res.status}): ${text}`);
  }

  const json = await res.json();
  const data = json?.data?.articleByPath?.item;
  if (!data) {
    throw new Error('No article item returned from GraphQL for given path/variation.');
  }

  return data;
}

function createHeroImage(heroImage) {
  if (!heroImage) return null;

  const url = heroImage._dynamicUrl || heroImage._publishUrl || heroImage._authorUrl || heroImage._path;
  if (!url) return null;

  const picture = document.createElement('picture');
  const img = document.createElement('img');
  img.src = url;
  img.loading = 'lazy';
  img.alt = ''; // Optionally map metadata to alt text.
  picture.appendChild(img);

  return picture;
}

function applyStyleOptions(block, { displayStyle, alignment, ctaStyle }) {
  if (displayStyle) block.classList.add(displayStyle);
  if (alignment) block.classList.add(alignment);
  if (ctaStyle) block.classList.add(ctaStyle);
}

/**
 * Main decorate entrypoint required by Edge Delivery blocks.
 */
export default async function decorate(block) {
  // Read configuration from data attributes supplied by Universal Editor.
  const reference = block.dataset.reference || '';
  const variation = block.dataset.contentFragmentVariation || '';
  const displayStyle = block.dataset.displaystyle || '';
  const alignment = block.dataset.alignment || '';
  const ctaStyle = block.dataset.ctastyle || '';

  // Clean existing author-time placeholder content (if any).
  block.textContent = '';

  // Apply style classes from UE select fields.
  applyStyleOptions(block, { displayStyle, alignment, ctaStyle });

  // Basic loading state – you can style `.cf-loading` via CSS.
  const loadingEl = document.createElement('div');
  loadingEl.className = 'cf-loading';
  loadingEl.textContent = 'Loading content…';
  block.appendChild(loadingEl);

  try {
    const article = await fetchArticle(reference, variation);

    // Clear loading state.
    block.textContent = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'cf-inner';

    // Headline
    if (article.headline) {
      const h2 = document.createElement('h2');
      h2.className = 'cf-headline';
      h2.textContent = article.headline;
      wrapper.appendChild(h2);
    }

    // Hero image
    const heroImageNode = createHeroImage(article.heroImage);
    if (heroImageNode) {
      const heroWrapper = document.createElement('div');
      heroWrapper.className = 'cf-hero-image';
      heroWrapper.appendChild(heroImageNode);
      wrapper.appendChild(heroWrapper);
    }

    // Example: expose variations & metadata as data attributes for debugging / CSS hooks.
    if (Array.isArray(article._variations)) {
      wrapper.dataset.variations = article._variations.join(',');
    }

    if (article._metadata?.stringMetadata) {
      article._metadata.stringMetadata.forEach(({ name, value }) => {
        if (!name || typeof value === 'undefined') return;
        const safeName = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        wrapper.dataset[`meta-${safeName}`] = String(value);
      });
    }

    block.appendChild(wrapper);
  } catch (e) {
    // Basic error display – adjust for your UX.
    block.textContent = '';
    const errorEl = document.createElement('div');
    errorEl.className = 'cf-error';
    errorEl.textContent = `Failed to load content fragment: ${e.message}`;
    block.appendChild(errorEl);
    // Optionally: console.error for debugging
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
