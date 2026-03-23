const AEM_PUBLISH_URL = 'https://publish-p130407-e1279066.adobeaemcloud.com';
const GRAPHQL_ENDPOINT = `${AEM_PUBLISH_URL}/graphql/execute.json/securbank/ArticleByPath`;

/**
 * Parse the block text into:
 * - path           (line 1)
 * - variation      (line 2, required for GraphQL)
 * - displayStyle   (line 3, optional)
 * - alignment      (line 4, optional)
 * - ctaStyle       (line 5, optional)
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
 * Call the persisted query using POST + JSON body.
 */
async function fetchArticle(path, variation) {
  const body = {
    variables: {
      path,
      variation,
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
      credentials: 'omit', // Cross-origin, anonym
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
  const { displayStyle, alignment, ctaStyle } = cfg;

  block.innerHTML = '';
  block.classList.add('content-fragment');

  if (displayStyle) {
    block.classList.add(displayStyle);
  }
  if (alignment) {
    block.classList.add(alignment);
  }

  const wrapper = document.createElement('article');
  wrapper.className = 'content-fragment-inner';

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

  if (article.heroImage?._dynamicUrl || article.heroImage?._publishUrl) {
    const img = document.createElement('img');
    img.className = 'content-fragment-image';
    img.src = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    img.alt = article.headline || '';
    img.setAttribute('data-aue-prop', 'heroImage');
    img.setAttribute('data-aue-type', 'media');
    media.appendChild(img);
  }

  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;
    h2.setAttribute('data-aue-prop', 'headline');
    h2.setAttribute('data-aue-type', 'text');
    body.appendChild(h2);
  }

  if (article.main) {
    const mainEl = document.createElement('div');
    mainEl.className = 'content-fragment-main';
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

  if (article.ctaLabel && article.ctaUrl) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'content-fragment-cta';

    const cta = document.createElement('a');
    cta.className = 'content-fragment-cta-link';
    cta.href = article.ctaUrl;
    cta.textContent = article.ctaLabel;

    if (ctaStyle) {
      cta.classList.add(ctaStyle);
    }

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
