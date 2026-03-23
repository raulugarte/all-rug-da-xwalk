/**
 * Ermittelt den richtigen GraphQL-Endpoint je nach Umgebung:
 * - Author/Publish (adobeaemcloud.com): same-origin /graphql/execute.json/...
 * - Edge Delivery (*.aem.page / *.aem.live): Publish-Host explizit
 */
function getGraphQLEndpoint() {
  const { origin, hostname } = window.location;

  // Dein Publish-Host (anpassen falls nötig)
  const PUBLISH_HOST = 'https://publish-p130407-e1279066.adobeaemcloud.com';

  const isAemHost = hostname.endsWith('adobeaemcloud.com');

  if (isAemHost) {
    // Author oder klassisches Publish-HTML: same-origin
    return `${origin}/graphql/execute.json/securbank/ArticleByPath`;
  }

  // Edge Delivery (aem.page / aem.live): immer gegen Publish gehen
  return `${PUBLISH_HOST}/graphql/execute.json/securbank/ArticleByPath`;
}

const GRAPHQL_ENDPOINT = getGraphQLEndpoint();

/**
 * CSRF-Token nur auf AEM-Hosts holen (Author/Publish).
 * Auf EDS-Domains (aem.page/live) gibt es /libs/granite/csrf/token.json nicht.
 */
async function getCsrfToken() {
  const { hostname } = window.location;
  const isAemHost = hostname.endsWith('adobeaemcloud.com');

  if (!isAemHost) {
    // Auf EDS: kein CSRF benötigt (anonym gegen Publish)
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
    return null;
  }
}

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

  const token = await getCsrfToken();
  if (token) {
    headers['CSRF-Token'] = token;
  }

  try {
    const resp = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'same-origin', // passt für AEM, schadet EDS nicht
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
