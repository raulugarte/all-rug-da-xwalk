const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Read config from block.
 * Supports two patterns:
 * 1) data-* attributes (future-proof)
 * 2) plain text lines inside the block (what you currently have)
 */
function readConfig(block) {
  let path = (block.dataset.reference || '').trim();
  let displaystyle = (block.dataset.displaystyle || '').trim();
  let alignment = (block.dataset.alignment || '').trim();
  let ctastyle = (block.dataset.ctastyle || '').trim();

  // Fallback: parse lines from children (current HTML structure)
  if (!path) {
    const lines = [...block.children]
      .map((el) => (el.textContent || '').trim())
      .filter(Boolean);

    if (lines.length > 0) {
      path = lines[0];
      displaystyle = lines[1] || '';
      alignment = lines[2] || '';
      ctastyle = lines[3] || '';
    }
  }

  return { path, displaystyle, alignment, ctastyle };
}

/**
 * Determine which variation values to try.
 * - Uses data-content-fragment-variation if present.
 * - Also tries stripped version (remove leading/trailing '!')
 * - Then falls back to "", "master", "main".
 */
function getVariationCandidates(block) {
  const raw = (block.dataset.contentFragmentVariation || '').trim();
  const candidates = [];

  if (raw) {
    candidates.push(raw);
    const stripped = raw.replace(/^!|!$/g, '');
    if (stripped && stripped !== raw) {
      candidates.push(stripped);
    }
  }

  // Fallbacks – order matters
  candidates.push('');
  candidates.push('master');
  candidates.push('main');

  // Deduplicate while preserving order
  return [...new Set(candidates)];
}

/**
 * Call persisted GraphQL query for a specific variation.
 */
async function fetchArticleOnce(path, variation) {
  const body = {
    path,
    variation,
  };

  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error('contentfragment: GraphQL request failed', res.status, res.statusText);
    return null;
  }

  const json = await res.json();

  if (json.errors && json.errors.length) {
    console.error('contentfragment: GraphQL errors', json.errors);
    return null;
  }

  return json.data && json.data.articleByPath && json.data.articleByPath.item
    ? json.data.articleByPath.item
    : null;
}

/**
 * Try multiple variation values until one returns an article.
 */
async function fetchArticle(path, block) {
  const variations = getVariationCandidates(block);

  for (const variation of variations) {
    try {
      const article = await fetchArticleOnce(path, variation);
      if (article) {
        console.debug('contentfragment: loaded article for', path, 'variation:', variation);
        return { article, variationUsed: variation };
      }
    } catch (e) {
      console.error('contentfragment: error fetching article for', path, 'variation:', variation, e);
    }
  }

  console.warn(
    'contentfragment: no article returned for',
    path,
    'tried variations:',
    variations.join(', '),
  );
  return null;
}

/**
 * Render the article content into the block.
 */
function renderArticle(block, article, uiConfig) {
  const { displaystyle, alignment, ctastyle } = uiConfig;

  // Clear original content (path, style lines, etc.)
  block.innerHTML = '';

  block.classList.add('contentfragment');
  if (displaystyle) block.classList.add(displaystyle);
  if (alignment) block.classList.add(alignment);
  if (ctastyle) block.classList.add(ctastyle);

  const wrapper = document.createElement('div');
  wrapper.className = 'contentfragment-inner';

  // Headline
  if (article.headline) {
    const h = document.createElement('h2');
    h.className = 'contentfragment-headline';
    h.textContent = article.headline;
    wrapper.appendChild(h);
  }

  // Hero image (handle single or array)
  const hero = Array.isArray(article.heroImage)
    ? article.heroImage[0]
    : article.heroImage;

  if (hero) {
    const imgUrl = hero._dynamicUrl || hero._publishUrl || hero._path;
    if (imgUrl) {
      const img = document.createElement('img');
      img.className = 'contentfragment-hero-image';
      img.src = imgUrl;
      img.alt = article.headline || '';
      wrapper.appendChild(img);
    }
  }

  // Example: metadata dump for debugging (optional)
  if (article._metadata && article._metadata.stringMetadata) {
    const metaContainer = document.createElement('dl');
    metaContainer.className = 'contentfragment-metadata';

    article._metadata.stringMetadata.forEach((m) => {
      const dt = document.createElement('dt');
      dt.textContent = m.name;
      const dd = document.createElement('dd');
      dd.textContent = m.value;
      metaContainer.appendChild(dt);
      metaContainer.appendChild(dd);
    });

    wrapper.appendChild(metaContainer);
  }

  block.appendChild(wrapper);
}

export default async function decorate(block) {
  const config = readConfig(block);
  const { path } = config;

  if (!path) {
    console.warn('contentfragment: no reference set, skipping fetch');
    return;
  }

  const result = await fetchArticle(path, block);
  if (!result) {
    // Already logged reason(s)
    return;
  }

  const { article /*, variationUsed*/ } = result;
  renderArticle(block, article, config);
}
