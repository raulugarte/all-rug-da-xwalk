const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Extract config from data-* attributes or from text lines inside the block.
 * Current line-based convention:
 *   line 1: content fragment path
 *   line 2: variation
 *   line 3: style (image-left, image-right, image-top, image-bottom)
 *   line 4: alignment (text-left, text-right, text-center)
 *   line 5: cta style (cta-link, cta-button, ...)
 */
function getBlockConfig(block) {
  const cfg = {
    path: block.dataset.reference || '',
    variation: block.dataset.contentFragmentVariation || '',
    style: block.dataset.displaystyle || '',
    alignment: block.dataset.alignment || '',
    ctaStyle: block.dataset.ctastyle || '',
  };

  // Fallback to parsing text lines if no data-* attributes are set
  if (!cfg.path) {
    const text = block.textContent || '';
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length >= 1) cfg.path = lines[0];
    if (lines.length >= 2) cfg.variation = lines[1];
    if (lines.length >= 3) cfg.style = lines[2];
    if (lines.length >= 4) cfg.alignment = lines[3];
    if (lines.length >= 5) cfg.ctaStyle = lines[4];
  }

  return cfg;
}

async function fetchArticle(path, variation) {
  const url =
    `${GRAPHQL_ENDPOINT}` +
    `;path=${encodeURIComponent(path)}` +
    (variation ? `;variation=${encodeURIComponent(variation)}` : '');

  const resp = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    throw new Error(`GraphQL request failed: ${resp.status} ${resp.statusText}`);
  }

  const json = await resp.json();
  const articleByPath = json?.data?.articleByPath || json?.articleByPath;
  return articleByPath?.item || null;
}

function renderArticle(block, article /*, options = {} */) {
  const { headline, heroImage } = article || {};

  // Clear original text (path/style/alignment lines)
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';

  const media = document.createElement('div');
  media.className = 'content-fragment-media';

  const body = document.createElement('div');
  body.className = 'content-fragment-body';

  // Hero image
  if (heroImage) {
    const imgUrl =
      heroImage._dynamicUrl ||
      heroImage._publishUrl ||
      heroImage._path ||
      '';

    if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.loading = 'lazy';
      img.alt = headline || '';
      media.append(img);
    }
  }

  // Headline
  if (headline) {
    const h = document.createElement('h2');
    h.className = 'content-fragment-headline';
    h.textContent = headline;
    body.append(h);
  }

  wrapper.append(media, body);
  block.append(wrapper);
}

export default async function decorate(block) {
  block.classList.add('content-fragment');

  const cfg = getBlockConfig(block);
  const { path, variation, style, alignment } = cfg;

  if (!path) {
    // Nothing configured yet; do not throw, just skip
    // eslint-disable-next-line no-console
    console.warn('content-fragment: no reference set, skipping fetch');
    return;
  }

  // Apply style/alignment as classes on the block
  if (style) {
    block.classList.add(style); // e.g. image-left, image-right, ...
  }
  if (alignment) {
    block.classList.add(alignment); // e.g. text-left, text-right, text-center
  }

  try {
    const article = await fetchArticle(path, variation);
    if (!article) {
      // eslint-disable-next-line no-console
      console.warn(
        `content-fragment: no article returned for ${path} ${variation || ''}`,
      );
      return;
    }

    renderArticle(block, article);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('content-fragment: failed to load article', e);
  }
}
