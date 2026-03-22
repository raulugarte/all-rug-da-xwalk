const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, required for GraphQL)
 * - displayStyle   (line 3, optional)
 * - alignment      (line 4, optional)
 * - ctaStyle       (line 5, optional)
 *
 * Expected formats:
 *
 * WITH variation:
 *   line 1: /content/dam/... (CF path)
 *   line 2: variation (e.g. testvar, !main!, main)
 *   line 3: style (image-left / image-right / image-top / image-bottom / default)
 *   line 4: alignment (text-left / text-right / text-center)
 *   line 5: cta style (cta-link / cta-button / cta-button-secondary / cta-button-dark)
 *
 * WITHOUT variation:
 *   line 1: path
 *   line 2: style
 *   line 3: alignment
 *   line 4: cta style
 *   -> in this case, we SKIP the fetch, because $variation is String!
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

  // If we have at least 5 lines, treat line 2 as variation
  // If we have 2 lines and the second is NOT a style token, also treat it as variation.
  let variation = null;
  let displayStyle = '';
  let alignment = '';
  let ctaStyle = '';

  const styleTokens = new Set([
    '', 'default',
    'image-left', 'image-right', 'image-top', 'image-bottom',
  ]);

  if (lines.length >= 5) {
    variation = lines[1];
    displayStyle = lines[2] || '';
    alignment = lines[3] || '';
    ctaStyle = lines[4] || '';
  } else if (lines.length >= 2) {
    const maybeStyle = lines[1].toLowerCase();
    if (!styleTokens.has(maybeStyle)) {
      // line 2 is not a known style -> treat as variation
      variation = lines[1];
      displayStyle = lines[2] || '';
      alignment = lines[3] || '';
      ctaStyle = lines[4] || '';
    } else {
      // line 2 is a style, no variation line -> we will not call GraphQL
      displayStyle = lines[1] || '';
      alignment = lines[2] || '';
      ctaStyle = lines[3] || '';
    }
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
 * Call the persisted query using POST + JSON body:
 *
 * POST /graphql/execute.json/securbank/ArticleByPath
 * {
 *   "path": "...",
 *   "variation": "..."
 * }
 */
async function fetchArticle(path, variation) {
  const body = {
    path,
    variation,
  };

  try {
    const resp = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!resp.ok) {
      console.error('content-fragment: GraphQL request failed', resp.status, resp.statusText);
      return null;
    }

    const json = await resp.json();

    if (json.errors) {
      console.error('content-fragment: GraphQL errors', json.errors, 'for body', body);
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

  // Apply style + alignment classes coming from UE
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

  if (!cfg.variation) {
    console.warn(
      'content-fragment: no variation (second line) found, skipping fetch because $variation is String!',
    );
    return;
  }

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
