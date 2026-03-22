const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse the block text into:
 * - path
 * - variation (optional)
 * - displayStyle (image-left/right/top/bottom or default)
 * - alignment (text-left/right/center)
 * - ctaStyle (cta-link/cta-button/...)
 *
 * Supported formats (from your screenshots):
 *
 * 1) Without variation:
 *    line 1: path
 *    line 2: style (image-left / image-right / image-top / image-bottom / default)
 *    line 3: alignment (text-left / text-right / text-center)
 *    line 4: cta style (cta-link / cta-button / cta-button-secondary / cta-button-dark)
 *
 * 2) With variation:
 *    line 1: path
 *    line 2: variation (e.g. testvar)
 *    line 3: style
 *    line 4: alignment
 *    line 5: cta style
 */
function getBlockConfig(block) {
  const lines = block.textContent
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {};
  }

  const path = lines[0];

  // Known style tokens
  const styleTokens = new Set([
    '', 'default',
    'image-left', 'image-right', 'image-top', 'image-bottom',
  ]);

  let variation = null;
  let displayStyle = null;
  let alignment = null;
  let ctaStyle = null;

  let idx = 1;

  // Decide if line 2 is variation or style
  if (lines[idx]) {
    const l2 = lines[idx].toLowerCase();
    if (!styleTokens.has(l2)) {
      // Not a known style => treat as variation
      variation = lines[idx];
      idx += 1;
    }
  }

  // Style (if present)
  if (lines[idx]) {
    displayStyle = lines[idx];
    idx += 1;
  }

  // Alignment (if present)
  if (lines[idx]) {
    alignment = lines[idx];
    idx += 1;
  }

  // CTA style (if present)
  if (lines[idx]) {
    ctaStyle = lines[idx];
    idx += 1;
  }

  return {
    path,
    variation,
    displayStyle,
    alignment,
    ctaStyle,
  };
}

/**
 * Call the persisted query with matrix params:
 * /graphql/execute.json/securbank/ArticleByPath;path=...;variation=...
 */
async function fetchArticle(path, variation) {
  try {
    let url = `${GRAPHQL_ENDPOINT};path=${encodeURIComponent(path)}`;
    if (variation) {
      url += `;variation=${encodeURIComponent(variation)}`;
    }

    const resp = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!resp.ok) {
      console.error('content-fragment: GraphQL request failed', resp.status, resp.statusText);
      return null;
    }

    const json = await resp.json();

    if (json.errors) {
      console.error('content-fragment: GraphQL errors', json.errors);
    }

    const item = json?.data?.articleByPath?.item;
    if (!item) {
      console.warn(
        `content-fragment: no article returned for ${path}${
          variation ? ` (variation: ${variation})` : ''
        }`,
      );
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

  // Clear original config lines
  block.innerHTML = '';

  // Ensure base class for CSS
  block.classList.add('content-fragment');

  // Apply style + alignment classes from config
  if (displayStyle) {
    block.classList.add(displayStyle);
  }
  if (alignment) {
    block.classList.add(alignment);
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

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
