const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Extract configuration from either:
 * - data-* attributes (preferred long-term), or
 * - text lines inside the block (your current setup):
 *   line 1: content fragment path
 *   line 2: displaystyle
 *   line 3: alignment
 *   line 4: ctastyle
 */
function extractConfig(block) {
  // 1) Try data-* attributes first
  let path = (block.dataset.reference || '').trim();
  let variation = (block.dataset.contentFragmentVariation || '').trim();
  let displaystyle = (block.dataset.displaystyle || '').trim();
  let alignment = (block.dataset.alignment || '').trim();
  let ctastyle = (block.dataset.ctastyle || '').trim();

  // 2) Fall back to parsing text content (matches your current HTML)
  if (!path || !displaystyle || !alignment || !ctastyle) {
    const raw = (block.textContent || '').trim();
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (!path && lines[0]) path = lines[0];
    if (!displaystyle && lines[1]) displaystyle = lines[1];
    if (!alignment && lines[2]) alignment = lines[2];
    if (!ctastyle && lines[3]) ctastyle = lines[3];
  }

  // Default variation if nothing is provided; adjust if your CF uses different naming
  if (!variation) {
    // UE shows "Main"; CF variation is usually "main"
    variation = 'main';
  }

  return {
    path,
    variation,
    displaystyle,
    alignment,
    ctastyle,
  };
}

/**
 * Call the persisted GraphQL query ArticleByPath.
 * For persisted queries, the body usually only contains the variables.
 */
async function fetchArticle(path, variation) {
  if (!path) {
    console.warn('contentfragment: no reference set, skipping fetch');
    return null;
  }

  const body = {
    path,
    variation,
  };

  const resp = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.error('contentfragment: GraphQL request failed', resp.status, resp.statusText);
    return null;
  }

  const data = await resp.json();
  // Depending on how the persisted query is defined, structure may differ slightly.
  // Adjust here if your JSON layout is different.
  return data && data.data && data.data.articleByPath && data.data.articleByPath.item
    ? data.data.articleByPath.item
    : null;
}

/**
 * Render the article (headline + hero image) into the block.
 */
function renderArticle(block, article, cfg) {
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('contentfragment-inner');

  if (cfg.displaystyle) wrapper.classList.add(cfg.displaystyle);
  if (cfg.alignment) wrapper.classList.add(cfg.alignment);
  if (cfg.ctastyle) wrapper.classList.add(cfg.ctastyle);

  // Headline
  if (article.headline) {
    const h = document.createElement('h2');
    h.textContent = article.headline;
    wrapper.appendChild(h);
  }

  // Hero image
  if (article.heroImage && Array.isArray(article.heroImage)) {
    // GraphQL CF APIs often return arrays for multivalued fields
    const hero = article.heroImage[0];
    if (hero && (hero._dynamicUrl || hero._publishUrl || hero._path)) {
      const img = document.createElement('img');
      img.alt = article.headline || '';
      img.src = hero._dynamicUrl || hero._publishUrl || hero._path;
      img.loading = 'lazy';
      wrapper.appendChild(img);
    }
  } else if (article.heroImage && typeof article.heroImage === 'object') {
    const hero = article.heroImage;
    if (hero._dynamicUrl || hero._publishUrl || hero._path) {
      const img = document.createElement('img');
      img.alt = article.headline || '';
      img.src = hero._dynamicUrl || hero._publishUrl || hero._path;
      img.loading = 'lazy';
      wrapper.appendChild(img);
    }
  }

  block.appendChild(wrapper);
}

export default async function decorate(block) {
  const cfg = extractConfig(block);

  if (!cfg.path) {
    console.warn('contentfragment: no CF path found in block; nothing to render');
    return;
  }

  try {
    const article = await fetchArticle(cfg.path, cfg.variation);
    if (!article) {
      console.warn('contentfragment: no article returned for', cfg.path, cfg.variation);
      return;
    }

    renderArticle(block, article, cfg);
  } catch (e) {
    console.error('contentfragment: unexpected error while rendering', e);
  }
}
