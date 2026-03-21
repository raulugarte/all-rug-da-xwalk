import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { getHostname, mapAemPathToSitePath } from '../../scripts/utils.js';
import { readBlockConfig } from '../../scripts/aem.js';

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // Configuration
  const CONFIG = {
    WRAPPER_SERVICE_URL: 'https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf',
    // CHANGED: use article persisted query instead of CTA
    GRAPHQL_QUERY: '/graphql/execute.json/ref-demo-eds/ArticleByPath',
    EXCLUDED_THEME_KEYS: new Set(['brandSite', 'brandLogo']),
  };

  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders ? hostnameFromPlaceholders : getMetadata('hostname');
  const aemauthorurl = getMetadata('authorurl') || '';

  const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  // const persistedquery = '/graphql/execute.json/ref-demo-eds/ArticleByPath';

  // Block config / authoring inputs
  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variationname =
    block.querySelector(':scope div:nth-child(2) > div')?.textContent?.trim()?.toLowerCase()?.replace(' ', '_') ||
    'master';
  const displayStyle = block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || '';
  const alignment = block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || '';
  const ctaStyle = block.querySelector(':scope div:nth-child(5) > div')?.textContent?.trim() || 'button';

  block.innerHTML = '';
  const isAuthor = isAuthorEnvironment();

  // Prepare request configuration based on environment
  const requestConfig = isAuthor
    ? {
        url: `${aemauthorurl}${CONFIG.GRAPHQL_QUERY};path=${contentPath};variation=${variationname};ts=${Date.now()}`,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    : {
        url: `${CONFIG.WRAPPER_SERVICE_URL}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          graphQLPath: `${aempublishurl}${CONFIG.GRAPHQL_QUERY}`,
          cfPath: contentPath,
          variation: `${variationname};ts=${Date.now()}`,
        }),
      };

  try {
    // Fetch data
    const response = await fetch(requestConfig.url, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      ...(requestConfig.body && { body: requestConfig.body }),
    });

    if (!response.ok) {
      console.error(`Error making article CF GraphQL request: ${response.status} ${response.statusText}`, {
        contentPath,
        variationname,
        isAuthor,
      });
      block.innerHTML = '';
      return;
    }

    let offer;
    try {
      offer = await response.json();
    } catch (parseError) {
      console.error('Error parsing article JSON from response:', {
        error: parseError.message,
        stack: parseError.stack,
        contentPath,
        variationname,
        isAuthor,
      });
      block.innerHTML = '';
      return;
    }

    // CHANGED: root field for article model
    const cfReq = offer?.data?.articleByPath?.item;

    if (!cfReq) {
      console.error('Error parsing response from GraphQL request - no valid article data found', {
        response: offer,
        contentPath,
        variationname,
      });
      block.innerHTML = '';
      return;
    }

    // Set up block attributes
    const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;
    block.setAttribute('data-aue-type', 'container');

    // CHANGED: heroImage field instead of bannerimage
    const imgUrl = isAuthor ? cfReq.heroImage?._authorUrl : cfReq.heroImage?._publishUrl;

    // Determine the layout style
    const isImageLeft = displayStyle === 'image-left';
    const isImageRight = displayStyle === 'image-right';
    const isImageTop = displayStyle === 'image-top';
    const isImageBottom = displayStyle === 'image-bottom';

    // Set background image and styles based on layout
    let bannerContentStyle = '';
    let bannerDetailStyle = '';

    if (isImageLeft || isImageRight || isImageTop || isImageBottom) {
      bannerContentStyle = imgUrl ? `background-image: url(${imgUrl});` : '';
    } else {
      // Default layout: image as background with gradient overlay
      bannerDetailStyle = imgUrl
        ? `background-image: linear-gradient(90deg,rgba(0,0,0,0.6), rgba(0,0,0,0.1) 80%) ,url(${imgUrl});`
        : '';
    }

    // NOTE: article model has no CTA in your requirements, so we drop CTA rendering.
    // If you later add CTA fields to the article model, you can reintroduce this logic.

    block.innerHTML = `<div class="banner-content block ${displayStyle}"
        data-aue-resource="${itemId}"
        data-aue-label="${variationname || 'Elements'}"
        data-aue-type="reference"
        data-aue-filter="contentfragment"
        style="${bannerContentStyle}">
        <div class="banner-detail ${alignment}"
          style="${bannerDetailStyle}"
          data-aue-prop="heroImage"
          data-aue-label="Hero Image"
          data-aue-type="media">
          <h2
            data-aue-prop="headline"
            data-aue-label="Headline"
            data-aue-type="text"
            class="cftitle">
            ${cfReq?.headline || ''}
          </h2>
          <div
            data-aue-prop="main"
            data-aue-label="Main"
            data-aue-type="richtext"
            class="cfdescription">
            <p>${cfReq?.main?.plaintext || ''}</p>
          </div>
        </div>
        <div class="banner-logo"></div>
      </div>`;
  } catch (error) {
    console.error('Error rendering article content fragment:', {
      error: error.message,
      stack: error.stack,
      contentPath,
      variationname,
      isAuthor,
    });
    block.innerHTML = '';
  }

  /*
  if (!isAuthor) {
    moveInstrumentation(block, null);
    block.querySelectorAll('*').forEach((elem) => moveInstrumentation(elem, null));
  }
  */
}
