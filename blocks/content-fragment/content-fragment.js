const GRAPHQL_ENDPOINT = '/graphql/execute.json/securbank/ArticleByPath';

/**
 * Extract config for this block from data-* attributes and/or text lines.
 * Priority:
 * - data-reference, data-content-fragment-variation, data-displaystyle, data-alignment, data-ctastyle
 * - fallback: parse text lines inside the block
 *
 * Text line parsing (if no data-*):
 *   line 1 = path
 *   remaining lines: try to map to style, alignment, ctaStyle, variation (in that order)
 */
function getBlockConfig(block) {
  const ds = block.dataset;

  let path = ds.reference && ds.reference.trim();
  let variation = ds.contentFragmentVariation && ds.contentFragmentVariation.trim();
  let displayStyle = ds.displaystyle && ds.displaystyle.trim();
  let alignment = ds.alignment && ds.alignment.trim();
  let ctaStyle = ds.ctastyle && ds.ctastyle.trim();

  // If reference not set via data-*, fall back to text lines
  if (!path) {
    const lines = block.textContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 0) {
      path = lines[0];

      const styleTokens = new Set([
        '', 'default', 'image-left', 'image-right', 'image-top', 'image-bottom',
        'image left', 'image right', 'image top', 'image bottom',
      ]);
      const alignTokens = new Set([
        'text-left', 'text-right', 'text-center',
        'left', 'right', 'center',
      ]);
      const ctaTokens = new Set([
        'cta-link', 'cta-button', 'cta-button-secondary', 'cta-button-dark',
        'link', 'primary button', 'secondary button', 'dark button',
      ]);

      // Go through remaining lines and classify them
      lines.slice(1).forEach((line) => {
        const lower = line.toLowerCase();

        if (!displayStyle && styleTokens.has(lower)) {
          displayStyle = line;
          return;
        }

        if (!alignment && alignTokens.has(lower)) {
          alignment = line;
          return;
        }

        if (!ctaStyle && ctaTokens.has(lower)) {
          ctaStyle = line;
          return;
        }

        // If it's none of the above and we don't have a variation yet,
        // treat this as the variation.
        if (!variation) {
          variation = line;
        }
      });
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
 * Call the persisted query.
 * If variation is present, send it as a matrix parameter.
 * If not, call without variation so the backend can use its default.
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
 * Renders the article into the block.
 */
function renderArticle(block, article, cfg) {
  const { displayStyle, alignment } = cfg;

  // Clear original config text
  block.innerHTML = '';
  block.classList.add('content-fragment');

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
 * Block entry point.
 */
export default async function decorate(block) {
  const cfg = getBlockConfig(block);

  if (!cfg.path) {
    console.warn('content-fragment: no reference set, skipping fetch');
    return;
  }

  const article = await fetchArticle(cfg.path, cfg.variation);
  if (!article) {
    return;
  }

  renderArticle(block, article, cfg);
}
