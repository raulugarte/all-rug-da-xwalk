const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Normalize variation coming from:
 * - block second line
 * - article data (if you ever use it)
 *
 * Rules:
 * - null/undefined/empty → "master"
 * - "undefined" or "null" (string) → "master"
 */
function normalizeVariation(rawVariation) {
  if (rawVariation === undefined || rawVariation === null) {
    return 'master';
  }

  const v = String(rawVariation).trim();

  if (!v) {
    return 'master';
  }

  const lower = v.toLowerCase();
  if (lower === 'undefined' || lower === 'null') {
    return 'master';
  }

  return v;
}

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, required for GraphQL + UE; we normalize later)
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
  const normalizedVariation = normalizeVariation(variation); // NEW

  const body = {
    variables: {
      path,
      variation: normalizedVariation,
    },
  };

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
      console.warn(
        `content-fragment: no article returned for ${path} (variation: ${normalizedVariation})`,
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
  const normalizedVariation = normalizeVariation(cfg.variation); // NEW

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
   * - data-aue-variation is taken from normalizedVariation.
   *   This will never be the literal string "undefined".
   */

  const cfPath = article._path || cfg.path || null;
  if (cfPath) {
    wrapper.setAttribute('data-aue-resource', `urn:aemconnection:${cfPath}`);
    wrapper.setAttribute('data-aue-type', 'content-fragment');
    wrapper.setAttribute('data-aue-label', article.headline || cfPath);

    // Use normalized variation for UE and also on the block for extra safety
    wrapper.setAttribute('data-aue-variation', normalizedVariation);
    block.setAttribute('data-aue-variation', normalizedVariation); // NEW
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

  console.debug(
    'content-fragment: rendered article',
    { path: cfPath, variation: normalizedVariation },
  ); // NEW
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

  // Normalize variation early; this guarantees we never pass "undefined" through.
  cfg.variation = normalizeVariation(cfg.variation); // NEW

  console.debug(
    'content-fragment: using configuration',
    JSON.stringify({ ...cfg, variation: cfg.variation }),
  ); // NEW

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
