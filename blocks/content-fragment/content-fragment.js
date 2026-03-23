const HOSTNAME = window.location.hostname;

// Umgebung erkennen
const IS_AEM_CLOUD = HOSTNAME.endsWith('.adobeaemcloud.com'); // author/publish
const IS_EDS = HOSTNAME.endsWith('.aem.page') || HOSTNAME.endsWith('.aem.live');

// Fester Publish-Host für dieses Projekt (für EDS)
const PUBLISH_HOST = 'https://publish-p130407-e1279066.adobeaemcloud.com';

// Gemeinsamer GraphQL-Pfad
const GRAPHQL_PATH = '/graphql/execute.json/securbank/ArticleByPath';

// Endpoint je nach Umgebung:
// - AEM (Author/Publish): same-origin, relativer Pfad
// - EDS (.aem.page/.aem.live): absoluter Publish-Host
const GRAPHQL_ENDPOINT = IS_EDS ? `${PUBLISH_HOST}${GRAPHQL_PATH}` : GRAPHQL_PATH;

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, optional – falls das Query ein $variation hat)
 * - displayStyle   (line 3, optional)
 * - alignment      (line 4, optional)
 * - ctaStyle       (line 5, optional – z.B. "cta-link", "cta-primary")
 *
 * Expected format:
 *
 * /content/dam/.../allianz-offer      ← line 1: path
 * default                             ← line 2: variation (optional)
 * image-left                          ← line 3: style
 * text-left                           ← line 4: alignment
 * cta-primary                         ← line 5: CTA style
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
 * Fetch CSRF token auf Author (für POST erforderlich).
 * Auf Publish oder Nicht-AEM-Domains wird einfach null zurückgegeben.
 */
async function getCsrfToken() {
  if (!IS_AEM_CLOUD) {
    // Auf EDS / anderen Hosts kein CSRF-Token nötig / verfügbar
    return null;
  }

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
    // Nicht fatal; z.B. auf Publish ohne CSRF-Setup
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
 *     "variation": "..."  // optional
 *   }
 * }
 */
async function fetchArticle(path, variation) {
  const variables = { path };

  // Nur setzen, wenn tatsächlich vorhanden (damit Default aus dem Query greifen kann)
  if (variation) {
    variables.variation = variation;
  }

  const body = { variables };

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // CSRF nur auf AEM-Hosts versuchen
  const token = await getCsrfToken();
  if (token) {
    headers['CSRF-Token'] = token;
  }

  const fetchOptions = {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  };

  // Auf AEM same-origin, auf EDS keine Credentials nötig
  if (IS_AEM_CLOUD) {
    fetchOptions.credentials = 'same-origin';
  } else {
    fetchOptions.credentials = 'omit';
  }

  try {
    const resp = await fetch(GRAPHQL_ENDPOINT, fetchOptions);

    if (!resp.ok) {
      console.error(
        'content-fragment: GraphQL request failed',
        resp.status,
        resp.statusText,
        'endpoint:',
        GRAPHQL_ENDPOINT,
        'body:',
        body,
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
      console.warn(`content-fragment: no article returned for ${path} (variation: ${variation || 'default'})`);
      return null;
    }

    return item;
  } catch (e) {
    console.error('content-fragment: fetch failed', e, 'endpoint:', GRAPHQL_ENDPOINT);
    return null;
  }
}

/**
 * Render the article inside the block
 */
function renderArticle(block, article, cfg) {
  const { displayStyle, alignment, ctaStyle } = cfg;

  // Clear original text lines
  block.innerHTML = '';

  // Base class for CSS
  block.classList.add('content-fragment');

  // Apply Style + Alignment from UE as CSS classes
  // e.g. "image-left", "image-right", "image-top"
  if (displayStyle) {
    block.classList.add(displayStyle);
  }
  // e.g. "text-left", "text-center", "text-right"
  if (alignment) {
    block.classList.add(alignment);
  }

  const wrapper = document.createElement('article');
  wrapper.className = 'content-fragment-inner';

  /**
   * Universal Editor instrumentation
   *
   * Für Content Fragments muss der Resource-Pfad immer auf
   * /jcr:content/data/master zeigen – Variationen werden von den CF-APIs gehandhabt.
   */
  const cfPath = article._path || cfg.path || null;
  if (cfPath) {
    wrapper.setAttribute(
      'data-aue-resource',
      `urn:aemconnection:${cfPath}/jcr:content/data/master`,
    );
    wrapper.setAttribute('data-aue-type', 'reference');
    wrapper.setAttribute('data-aue-label', article.headline || cfPath);
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
      mainEl.innerHTML = article.main.html;
    } else if (article.main.markdown) {
      mainEl.textContent = article.main.markdown;
    } else if (article.main.plaintext) {
      mainEl.textContent = article.main.plaintext;
    } else if (article.main.json) {
      mainEl.textContent = JSON.stringify(article.main.json);
    }

    body.appendChild(mainEl);
  }

  // Optional CTA – expects article.ctaLabel + article.ctaUrl
  if (article.ctaLabel && article.ctaUrl) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'content-fragment-cta';

    const cta = document.createElement('a');
    cta.className = 'content-fragment-cta-link';
    cta.href = article.ctaUrl;
    cta.textContent = article.ctaLabel;

    // Map UE config (line 5) to CSS variants, e.g. "cta-link", "cta-primary", "cta-secondary"
    if (ctaStyle) {
      cta.classList.add(ctaStyle);
    }

    // UE: make CTA editable as a link field if mapped in your model
    cta.setAttribute('data-aue-prop', 'ctaUrl');
    cta.setAttribute('data-aue-type', 'hyperlink');

    ctaWrapper.appendChild(cta);
    body.appendChild(ctaWrapper);
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
    console.info(
      'content-fragment: no variation provided; relying on default from persisted query (if defined).',
    );
  }

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
