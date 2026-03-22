const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse the block text into:
 * - path         (line 1)
 * - variation    (line 2, required)
 * - displayStyle (line 3, optional)
 * - alignment    (line 4, optional)
 * - ctaStyle     (line 5, optional – currently unused)
 */
function getBlockConfig(block) {
  const lines = block.textContent
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {};
  }

  const path = lines[0] || null;
  const variation = lines.length > 1 ? lines[1] : null;
  const displayStyle = lines.length > 2 ? lines[2] : '';
  const alignment = lines.length > 3 ? lines[3] : '';
  const ctaStyle = lines.length > 4 ? lines[4] : '';

  return {
    path,
    variation,
    displayStyle,
    alignment,
    ctaStyle,
  };
}

/**
 * Call the persisted query exactly like your working GraphiQL URL:
 *   /graphql/execute.json/securbank/ArticleByPath;path=...;variation=...
 */
async function fetchArticle(path, variation) {
  const url = `${GRAPHQL_ENDPOINT};path=${encodeURIComponent(path)};variation=${encodeURIComponent(variation)}`;

  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      console.error('contentfragment: GraphQL request failed', resp.status, resp.statusText, url);
      return null;
    }

    const json = await resp.json();

    if (json.errors) {
      console.error('contentfragment: GraphQL errors', json.errors, 'for url', url);
      return null;
    }

    const item = json?.data?.articleByPath?.item;
    if (!item) {
      console.warn(`contentfragment: no article returned for ${path} (variation: ${variation})`);
      return null;
    }

    return item;
  } catch (e) {
    console.error('contentfragment: fetch failed', e);
    return null;
  }
}

/**
 * Render the article inside the block
 */
function renderArticle(block, article, cfg) {
  const { displayStyle, alignment } = cfg;

  // Clear original text lines
  block.innerHTML = '';

  // Ensure we can target the block in CSS:
  // <div class="block contentfragment contentfragment-block image-left text-left">
  block.classList.add('contentfragment-block');

  // Apply Style + Alignment as CSS classes on the block
  if (displayStyle) {
    block.classList.add(displayStyle); // e.g. "image-left"
  }
  if (alignment) {
    block.classList.add(alignment); // e.g. "text-left"
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'contentfragment-inner';

  const media = document.createElement('div');
  media.className = 'contentfragment-media';

  const body = document.createElement('div');
  body.className = 'contentfragment-body';

  // Hero image
  if (article.heroImage?._dynamicUrl || article.heroImage?._publishUrl) {
    const img = document.createElement('img');
    img.className = 'contentfragment-image';
    img.src = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    img.alt = article.headline || '';
    media.appendChild(img);
  }

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'contentfragment-headline';
    h2.textContent = article.headline;
    body.appendChild(h2);
  }

  wrapper.append(media, body);
  block.appendChild(wrapper);
}

/**
 * Block entry point
 */
export default async function decorate(block) {
  const cfg = getBlockConfig(block);

  if (!cfg.path) {
    console.warn('contentfragment: no path found, skipping fetch');
    return;
  }

  if (!cfg.variation) {
    console.warn('contentfragment: no variation (second line) found, skipping fetch');
    return;
  }

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
