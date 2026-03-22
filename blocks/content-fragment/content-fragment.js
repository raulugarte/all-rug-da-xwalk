const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Fetch article content fragment by path + variation.
 * Assumes ArticleByPath is a persisted query:
 *   POST /graphql/execute.json/securbank/ArticleByPath
 *   { "variables": { "path": "...", "variation": "..." } }
 */
async function fetchArticle(path, variation) {
  if (!path) {
    console.warn('contentfragment: no reference set, skipping fetch');
    return null;
  }

  try {
    const body = {
      variables: {
        path,
        // If your "master" is represented by an empty string, don't override it:
        variation: variation ?? '',
      },
    };

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(
        `contentfragment: GraphQL HTTP error ${response.status}`,
        await response.text(),
      );
      return null;
    }

    const json = await response.json();

    if (!json?.data?.articleByPath?.item) {
      console.warn('contentfragment: no item in GraphQL response', json);
      return null;
    }

    return json.data.articleByPath;
  } catch (e) {
    console.error('contentfragment: error fetching article', e);
    return null;
  }
}

/**
 * Render headline + hero image into the block.
 * You can extend this to render more fields from the item.
 */
function renderArticle(block, articleByPath) {
  const { item } = articleByPath;
  const { headline, heroImage } = item || {};

  // Make sure the block is empty before rendering.
  block.innerHTML = '';

  // Apply style classes coming from UE (if present).
  const { displaystyle, alignment, ctastyle } = block.dataset;
  if (displaystyle) block.classList.add(displaystyle);
  if (alignment) block.classList.add(alignment);
  if (ctastyle) block.classList.add(ctastyle);

  const container = document.createElement('div');
  container.className = 'content-fragment-wrapper';

  // Headline
  if (headline) {
    const h = document.createElement('h2');
    h.className = 'content-fragment-headline';
    h.textContent = headline;
    container.appendChild(h);
  }

  // Hero image (supports single object or array)
  let hero = null;
  if (Array.isArray(heroImage)) {
    hero = heroImage[0] || null;
  } else if (heroImage && typeof heroImage === 'object') {
    hero = heroImage;
  }

  if (hero) {
    const imgUrl = hero._dynamicUrl || hero._publishUrl || null;

    if (imgUrl) {
      const figure = document.createElement('figure');
      figure.className = 'content-fragment-hero';

      const img = document.createElement('img');
      img.src = imgUrl;
      img.alt = headline || '';
      figure.appendChild(img);

      container.appendChild(figure);
    }
  }

  block.appendChild(container);
}

export default async function decorate(block) {
  // These values must be provided via data-* attributes in the HTML
  // (from your Universal Editor / component definition template).
  const path = (block.dataset.reference || '').trim();
  const variation = block.dataset.contentFragmentVariation || '';

  if (!path) {
    console.warn('contentfragment: no reference set, skipping fetch');
    return;
  }

  const articleByPath = await fetchArticle(path, variation);
  if (!articleByPath) {
    return;
  }

  renderArticle(block, articleByPath);
}
