import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getHostname } from '../../scripts/utils.js';

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // Configuration
  const CONFIG = {
    WRAPPER_SERVICE_URL: 'https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf',
    // Adjust this to your actual persisted query name if different
    GRAPHQL_QUERY: '/graphql/execute.json/ref-demo-eds/ArticleByPath',
  };

  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders ? hostnameFromPlaceholders : getMetadata('hostname');
  const aemauthorurl = getMetadata('authorurl') || '';
  const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  // Read configuration from block content:
  // 1: CF path (reference)
  // 2: variation (contentFragmentVariation)
  // 3: display style (displaystyle)
  // 4: alignment (alignment)
  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim();
  const variationname =
    block
      .querySelector(':scope div:nth-child(2) > div')
      ?.textContent?.trim()
      ?.toLowerCase()
      ?.replace(' ', '_') || 'master';
  const displayStyle = block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() || '';
  const alignment = block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() || '';

  block.innerHTML = '';
  const isAuthor = isAuthorEnvironment();

  if (!contentPath) {
    // No CF path configured – nothing to render
    // eslint-disable-next-line no-console
    console.warn('Content Fragment block: no content path provided');
    return;
  }

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
      // eslint-disable-next-line no-console
      console.error(`Error making CF GraphQL request: ${response.status}`, {
        status: response.status,
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
      // eslint-disable-next-line no-console
      console.error('Error parsing JSON from GraphQL response:', {
        error: parseError.message,
        stack: parseError.stack,
        contentPath,
        variationname,
        isAuthor,
      });
      block.innerHTML = '';
      return;
    }

    // Expecting persisted query "ArticleByPath" with root "articleByPath"
    // and fields: headline (string), main (rich text), heroImage (content reference)
    const cfReq = offer?.data?.articleByPath?.item;

    if (!cfReq) {
      // eslint-disable-next-line no-console
      console.error('Error parsing response from GraphQL request - no valid article data found', {
        response: offer,
        contentPath,
        variationname,
      });
      block.innerHTML = '';
      return;
    }

    // Set up block authoring attributes
    const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;
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
      // image-left/right/top/bottom -> image as background of outer wrapper
      bannerContentStyle = imgUrl ? `background-image: url(${imgUrl});` : '';
    } else {
      // Default layout: image as background with gradient overlay (original behavior)
      bannerDetailStyle = imgUrl
        ? `background-image: linear-gradient(90deg,rgba(0,0,0,0.6), rgba(0,0,0,0.1) 80%) ,url(${imgUrl});`
        : '';
    }

    block.innerHTML = `
      <div class="banner-content block ${displayStyle}"
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
          <h2 data-aue-prop="headline"
              data-aue-label="Headline"
              data-aue-type="text"
              class="cftitle">
            ${cfReq?.headline || ''}
          </h2>
          <div data-aue-prop="main"
               data-aue-label="Main"
               data-aue-type="richtext"
               class="cfdescription">
            <p>${cfReq?.main?.plaintext || ''}</p>
          </div>
        </div>
        <div class="banner-logo"></div>
      </div>
    `;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error rendering content fragment:', {
      error: error.message,
      stack: error.stack,
      contentPath,
      variationname,
      isAuthor,
    });
    block.innerHTML = '';
  }
}
