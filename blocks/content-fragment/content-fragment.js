const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, required for GraphQL)
 * - displayStyle   (line 3, optional)
 * - alignment      (line 4, optional)
 * - ctaStyle       (line 5, optional – currently not used)
 *
 * Expected format:
 *
 * /content/dam/.../allianz-offer      ← line 1: path
 * testvar                             ← line 2: variation
 * image-left                          ← line 3: style
 * text-left                           ← line 4: alignment
 * cta-link                            ← line 5: CTA style (ignored in JS for now)
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
 * Call the persisted query using GET + matrix params:
 *
 * /graphql/execute.json/securbank/ArticleByPath;path=...;variation=...
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
      console.error('content-fragment: GraphQL request failed', resp.status, resp.statusText, url);
      return null;
    }

    const json = await resp.json();

    if (json.errors) {
      console.error('content-fragment: GraphQL errors', json.errors, 'for url', url);
      return null;
    }

    const item = json?.data?.articleByPath?.item;
    if (!item) {
      console.warn(`content-fragment: no article returned for ${path} (variation: ${variation})`);
      return null;
    }

    return item;
  } catch (e) {
    console.error('content-fragment: fetch failed', e);
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

  // Base class for CSS
  block.classList.add('content-fragment');

  // Apply Style + Alignment from UE as CSS classes
  if (displayStyle) {
    block.classList.add(displayStyle); // e.g. "image-left"
  }
  if (alignment) {
    block.classList.add(alignment); // e.g. "text-left"
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';

  const media = document.createElement('div');
  media.className = 'content-fragment-media';

  const body = document.createElement('div');
  body.className = 'content-fragment-body';

  // Hero image
  if (article.heroImage?._dynamicUrl || article.heroImage?._publishUrl) {
    const img = document.createElement('img');
    img.className = 'content-fragment-image';
    img.src = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    img.alt = article.headline || '';
    media.appendChild(img);
  }

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
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
    console.warn('content-fragment: no path found, skipping fetch');
    return;
  }

  if (!cfg.variation) {
    console.warn('content-fragment: no variation (second line) found, skipping fetch');
    return;
  }

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
