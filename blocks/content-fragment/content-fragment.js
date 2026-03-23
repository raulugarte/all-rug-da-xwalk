/* Base URL deines Publish-Hosts (für EDS und relative Medien-URLs) */
const PUBLISH_BASE_URL = 'https://publish-p130407-e1279066.adobeaemcloud.com';

/**
 * Ermittelt den GraphQL-Endpoint abhängig von der Umgebung:
 * - Auf AEM-Hosts (*.adobeaemcloud.com): relative URL (same-origin)
 * - Auf Edge Delivery (*.aem.page / *.aem.live): absoluter Publish-Endpoint
 */
function getGraphqlEndpoint() {
  if (typeof window === 'undefined') {
    // Fallback für SSR / Tests
    return '/graphql/execute.json/securbank/ArticleByPath';
  }

  const { hostname } = window.location;

  if (hostname.endsWith('.adobeaemcloud.com')) {
    // Author oder Publish (AEM) → same-origin
    return '/graphql/execute.json/securbank/ArticleByPath';
  }

  // Edge Delivery oder sonstige Hosts → gegen Publish aufrufen
  return `${PUBLISH_BASE_URL}/graphql/execute.json/securbank/ArticleByPath`;
}

const GRAPHQL_ENDPOINT = getGraphqlEndpoint();

/**
 * Ermittelt, ob wir auf einem AEM-Host laufen
 * (Author oder Publish: *.adobeaemcloud.com).
 */
function isAemHost() {
  if (typeof window === 'undefined') return false;
  const { hostname } = window.location;
  return hostname.endsWith('.adobeaemcloud.com');
}

/**
 * Parse den Blocktext in:
 * - path           (Zeile 1)
 * - variation      (Zeile 2, benötigt für GraphQL-Query)
 * - displayStyle   (Zeile 3, optional)
 * - alignment      (Zeile 4, optional)
 * - ctaStyle       (Zeile 5, optional – z.B. "cta-link", "cta-primary")
 *
 * Erwartetes Format:
 *
 * /content/dam/.../allianz-offer      ← Zeile 1: path
 * default                             ← Zeile 2: variation
 * image-left                          ← Zeile 3: displayStyle
 * text-left                           ← Zeile 4: alignment
 * cta-primary                         ← Zeile 5: ctaStyle
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
 * CSRF-Token nur auf AEM-Host holen (Author/Publish).
 * Auf EDS oder anderen Hosts wird null zurückgegeben.
 */
async function getCsrfToken() {
  if (!isAemHost()) {
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
    // Nicht fatal; kann z.B. auf Publish ohne CSRF oder bei Problemen auftreten
    return null;
  }
}

/**
 * Normalisiert Bild-URLs:
 * - Absolute URLs (http/https) werden unverändert gelassen.
 * - Relative URLs werden:
 *   - auf AEM-Hosts (Author/Publish) unverändert verwendet (same-origin),
 *   - auf Edge Delivery Hosts (*.aem.page / *.aem.live) mit PUBLISH_BASE_URL
 *     als Origin versehen, damit Assets vom Publish-Host kommen.
 */
function normalizeImageUrl(rawUrl) {
  if (!rawUrl) return null;

  // Bereits absolute URL → so lassen
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    return rawUrl;
  }

  if (typeof window === 'undefined') {
    // Fallback: relative URL unverändert
    return rawUrl;
  }

  const { hostname } = window.location;

  if (hostname.endsWith('.adobeaemcloud.com')) {
    // Author/Publish: relative URL ist ok (same-origin)
    return rawUrl;
  }

  // Edge Delivery oder andere Hosts: relative URL über Publish ausliefern
  return `${PUBLISH_BASE_URL}${rawUrl}`;
}

/**
 * Optionaler Helper:
 * Falls du künftig eine Delivery-URL (Dynamic Media with OpenAPI)
 * im Content Fragment modellierst (z.B. Feld "heroImageDeliveryUrl"),
 * kannst du diese hier bevorzugt verwenden.
 *
 * Aktuell nutzt du laut GraphQL-Response:
 * - heroImage._dynamicUrl   (z.B. "/adobe/dynamicmedia/deliver/...")
 * - heroImage._publishUrl   (z.B. "https://publish-.../content/dam/...")
 */
function resolveHeroImageUrl(article) {
  // 1) Bevorzugt: explizite Delivery-URL aus dem Modell (DM OpenAPI)
  if (article.heroImageDeliveryUrl) {
    return article.heroImageDeliveryUrl;
  }

  // 2) Klassische Dynamic Media / WOE-URL aus heroImage
  if (article.heroImage && (article.heroImage._dynamicUrl || article.heroImage._publishUrl)) {
    const candidate = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    return normalizeImageUrl(candidate);
  }

  // 3) Kein Bild vorhanden
  return null;
}

/**
 * Aufruf der persisted Query per POST + JSON-Body:
 *
 * POST {GRAPHQL_ENDPOINT}
 * {
 *   "variables": {
 *     "path": "...",
 *     "variation": "..."
 *   }
 * }
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

  // CSRF-Token nur auf AEM-Host setzen
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
 * Rendert den Artikel im Block.
 */
function renderArticle(block, article, cfg) {
  const { displayStyle, alignment, ctaStyle } = cfg;

  // Ursprünglichen Text entfernen
  block.innerHTML = '';

  // Basis-Klasse für CSS
  block.classList.add('content-fragment');

  // Style + Alignment als CSS-Klassen anwenden
  if (displayStyle) {
    block.classList.add(displayStyle);
  }
  if (alignment) {
    block.classList.add(alignment);
  }

  const wrapper = document.createElement('article');
  wrapper.className = 'content-fragment-inner';

  /**
   * Universal Editor Instrumentation
   * Für Content Fragments muss der Resource-Pfad immer auf
   * /jcr:content/data/master zeigen – Variationen übernimmt die CF-API.
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

  // Hero Image
  const heroUrl = resolveHeroImageUrl(article);
  if (heroUrl) {
    const img = document.createElement('img');
    img.className = 'content-fragment-image';
    img.src = heroUrl;
    img.alt = article.headline || '';

    // UE: heroImage als Medienfeld editierbar machen
    img.setAttribute('data-aue-prop', 'heroImage');
    img.setAttribute('data-aue-type', 'media');

    media.appendChild(img);
  }

  // Headline
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;

    // UE: Headline als einfachen Text editierbar machen
    h2.setAttribute('data-aue-prop', 'headline');
    h2.setAttribute('data-aue-type', 'text');

    body.appendChild(h2);
  }

  // Main Body (CF-Feld "main")
  if (article.main) {
    const mainEl = document.createElement('div');
    mainEl.className = 'content-fragment-main';

    // UE: Feld "main" als Richtext abbilden
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

  // Optional CTA – erwartet article.ctaLabel + article.ctaUrl
  if (article.ctaLabel && article.ctaUrl) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'content-fragment-cta';

    const cta = document.createElement('a');
    cta.className = 'content-fragment-cta-link';
    cta.href = article.ctaUrl;
    cta.textContent = article.ctaLabel;

    // UE-Konfiguration aus Zeile 5 (CTA-Style) auf CSS-Variante mappen
    if (ctaStyle) {
      cta.classList.add(ctaStyle);
    }

    // UE: CTA als Link-Feld editierbar machen
    cta.setAttribute('data-aue-prop', 'ctaUrl');
    cta.setAttribute('data-aue-type', 'hyperlink');

    ctaWrapper.appendChild(cta);
    body.appendChild(ctaWrapper);
  }

  wrapper.append(media, body);
  block.appendChild(wrapper);
}

/**
 * Block Entry Point
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
