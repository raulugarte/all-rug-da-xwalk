const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Parse config from:
 * - data-* attributes (future-proof)
 * - or, current text layout:
 *   line 1: path
 *   line 2: variation
 *   line 3: displaystyle
 *   line 4: alignment
 *   line 5: ctastyle
 */
function parseBlockConfig(block) {
  const config = {
    path: block.dataset.reference || '',
    variation: block.dataset.contentFragmentVariation || '',
    displaystyle: block.dataset.displaystyle || '',
    alignment: block.dataset.alignment || '',
    ctastyle: block.dataset.ctastyle || '',
  };

  // If path not in data-attributes, fall back to text lines in the block
  if (!config.path) {
    const lines = Array.from(block.children)
      .map((child) => child.textContent.trim())
      .filter((text) => !!text);

    if (lines.length > 0) {
      config.path = lines[0];
    }
    if (lines.length > 1) {
      // second line is your variation (e.g. "testvar")
      config.variation = lines[1];
    }
    if (lines.length > 2) {
      config.displaystyle = lines[2];
    }
    if (lines.length > 3) {
      config.alignment = lines[3];
    }
    if (lines.length > 4) {
      config.ctastyle = lines[4];
    }
  }

  // reasonable default if variation left empty
  if (!config.variation) {
    config.variation = 'master';
  }

  return config;
}

/**
 * Build persisted query URL like:
 * /graphql/execute.json/securbank/ArticleByPath;path=/content/...;variation=testvar
 *
 * NOTE: we keep `path` as-is (no encode) since it is already a valid CF path.
 * `variation` is encoded to be safe.
 */
function buildGraphqlUrl(path, variation) {
  const varParam = encodeURIComponent(variation || '');
  return `${GRAPHQL_ENDPOINT};path=${path};variation=${varParam}`;
}

async function fetchArticle(path, variation) {
  if (!path) {
    console.warn('contentfragment: no path, skipping fetch');
    return null;
  }

  const url = buildGraphqlUrl(path, variation);
  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (!resp.ok) {
      console.error(`contentfragment: GraphQL request failed (${resp.status}) for`, url);
      return null;
    }

    const json = await resp.json();
    const item = json?.data?.articleByPath?.item;

    if (!item) {
      console.warn(`contentfragment: no article returned for ${path} variation ${variation}`, json);
      return null;
    }

    console.debug(`contentfragment: loaded article for ${path} variation ${variation}`, item);
    return item;
  } catch (e) {
    console.error('contentfragment: error fetching article', e);
    return null;
  }
}

function createHeroImage(heroImage) {
  if (!heroImage) return null;

  const url = heroImage._dynamicUrl || heroImage._publishUrl || heroImage._authorUrl;
  if (!url) return null;

  const img = document.createElement('img');
  img.src = url;
  img.alt = heroImage._path || '';
  img.loading = 'lazy';
  return img;
}

function renderArticle(block, item, config) {
  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.classList.add('contentfragment-inner');

  if (config.displaystyle) {
    wrapper.classList.add(config.displaystyle);
  }
  if (config.alignment) {
    wrapper.classList.add(config.alignment);
  }
  if (config.ctastyle) {
    wrapper.classList.add(config.ctastyle);
  }

  // Headline
  if (item.headline) {
    const h2 = document.createElement('h2');
    h2.textContent = item.headline;
    wrapper.appendChild(h2);
  }

  // Hero image
  const heroImageEl = createHeroImage(item.heroImage);
  if (heroImageEl) {
    const pictureWrapper = document.createElement('div');
    pictureWrapper.classList.add('contentfragment-hero');
    pictureWrapper.appendChild(heroImageEl);
    wrapper.appendChild(pictureWrapper);
  }

  block.appendChild(wrapper);
}

export default async function decorate(block) {
  const config = parseBlockConfig(block);
  const { path, variation } = config;

  if (!path) {
    console.warn('contentfragment: no reference set, skipping fetch');
    return;
  }

  const article = await fetchArticle(path, variation);
  if (!article) {
    // leave original text visible if nothing returned
    return;
  }

  renderArticle(block, article, config);
}
