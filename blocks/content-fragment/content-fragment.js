const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, required by current PQ, but we default to "master")
 * - displayStyle   (line 3, optional)
 * - alignment      (line 4, optional)
 * - ctaStyle       (line 5, optional – not used yet)
 *
 * Expected format:
 *
 * /content/dam/.../allianz-offer      ← line 1: path
 * testvar                             ← line 2: variation
 * image-left                          ← line 3: style
 * text-center                         ← line 4: alignment
 * cta-link                            ← line 5: CTA style
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
 * Normalize the variation coming from the block / code:
 * - null / undefined → null
 * - "" (empty)      → null
 * - "undefined"     → null
 * - "null"          → null
 * - otherwise       → trimmed original string
 */
function normalizeVariation(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }

  const trimmed = String(raw).trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (lower === 'undefined' || lower === 'null') {
    return null;
  }

  return trimmed;
}

/**
 * Fetch CSRF token on author (needed for POST).
 * On publish or if token endpoint is unavailable, we just return null.
 */
async function getCsrfToken() {
  try {
    const resp = await fetch('/libs/granite/csrf/token.json', {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!resp.ok) {
      return null;
    }
    const data = await resp.json();
    return data.token || null;
  } catch (e) {
    // Not fatal; we may be on publish or a non-AEM domain
    return null;
  }
}

/**
 * Call the persisted query using POST + JSON body:
 *
 * POST /graphql/execute.json/securbank/ArticleByPath
 * {
 *   "variables": {
 *     "path": "...",
 *     "variation": "..."
 *   }
 * }
 */
async function fetchArticle(path, variation) {
  const variables = {
    path,
    variation,
  };

  const body = { variables };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Try to get CSRF token (needed on author)
  const token = await getCsrfToken();
  if (token) {
    headers['CSRF-Token'] = token;
  }

  try {
    console.debug('content-fragment: fetching article with variables', variables);

    const resp = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin',
      cache: 'no-store',
    });

    if (!resp.ok) {
      console.error(
        'content-fragment: GraphQL request failed',
        resp.status,
        resp.statusText,
      );
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
  const { displayStyle, alignment, variation, path } = cfg;

  // Clear original text lines
  block.innerHTML = '';

  // Base class for CSS
  block.classList.add('content-fragment');

  // Apply Style + Alignment from UE as CSS classes
  if (displayStyle) {
    block.classList.add(displayStyle); // e.g. "image-left"
  }
  if (alignment) {
    block.classList.add(alignment); // e.g. "text-center"
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';

  /**
   * Universal Editor instrumentation
   *
   * IMPORTANT:
   * - data-aue-resource points to the CF asset path (no /jcr:content/data).
   * - data-aue-variation is taken from cfg.variation (normalized).
   *   This must be "master" or "testvar" etc. — never "undefined".
   */

  const cfPath = article._path || path || null;
  if (cfPath) {
    const safeResource = `urn:aemconnection:${cfPath}`;
    wrapper.setAttribute('data-aue-resource', safeResource);
    wrapper.setAttribute('data-aue-type', 'content-fragment');
    wrapper.setAttribute('data-aue-label', article.headline || cfPath);

    // normalize again defensively before writing UE attribute
    const normalizedForUE = normalizeVariation(variation) || 'master';

    // As an extra guard, never set "undefined" as a variation
    if (normalizedForUE && normalizedForUE.toLowerCase() !== 'undefined') {
      wrapper.setAttribute('data-aue-variation', normalizedForUE);
    } else {
      // If something went very wrong, omit the attribute entirely
      wrapper.removeAttribute('data-aue-variation');
    }

    console.debug(
      'content-fragment: UE instrumentation',
      {
        'data-aue-resource': safeResource,
        'data-aue-variation': wrapper.getAttribute('data-aue-variation') || '(none)',
      },
    );
  }

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

    // UE: make hero image editable as a media field on the CF
    img.setAttribute('data-aue-prop', 'heroImage');
    img.setAttribute('data-aue-type', 'media');

    media.appendChild(img);
  }

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;

    // UE: make headline in-place editable as simple text
    h2.setAttribute('data-aue-prop', 'headline');
    h2.setAttribute('data-aue-type', 'text');

    body.appendChild(h2);
  }

  // Main body (from Content Fragment "main" element)
  if (article.main) {
    const mainEl = document.createElement('div');
    mainEl.className = 'content-fragment-main';

    // UE: map to the CF field "main" as rich text
    mainEl.setAttribute('data-aue-prop', 'main');
    mainEl.setAttribute('data-aue-type', 'richtext');

    if (article.main.html) {
      // HTML authored in the CF – render as HTML
      mainEl.innerHTML = article.main.html;
    } else if (article.main.markdown) {
      // If you want markdown rendered as plain text for now
      mainEl.textContent = article.main.markdown;
    } else if (article.main.plaintext) {
      mainEl.textContent = article.main.plaintext;
    } else if (article.main.json) {
      // Fallback: show JSON string (mainly useful for debugging)
      mainEl.textContent = JSON.stringify(article.main.json);
    }

    body.appendChild(mainEl);
  }

  wrapper.append(media, body);
  block.appendChild(wrapper);

  console.debug('content-fragment: rendered article', {
    path: cfPath,
    variation: variation,
  });
}

/**
 * Block entry point
 */
export default async function decorate(block) {
  const rawCfg = getBlockConfig(block);
  console.debug('content-fragment: raw block config', rawCfg);

  if (!rawCfg.path) {
    console.warn('content-fragment: no path found, skipping fetch');
    return;
  }

  // Normalize variation and default to "master" if missing/invalid
  const normalizedVar = normalizeVariation(rawCfg.variation) || 'master';

  const cfg = {
    ...rawCfg,
    variation: normalizedVar,
  };

  console.debug('content-fragment: normalized config', cfg);

  // We no longer hard-fail if second line is missing: we default to "master"
  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
