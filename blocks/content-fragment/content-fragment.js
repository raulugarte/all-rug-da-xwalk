import { getMetadata, readBlockConfig } from '../../scripts/aem.js';
import { isAuthorEnvironment, moveInstrumentation } from '../../scripts/scripts.js';
import { getHostname, mapAemPathToSitePath } from '../../scripts/utils.js';

/**
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // Configuration
  const CONFIG = {
    WRAPPER_SERVICE_URL: 'https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf',
    GRAPHQL_QUERY: '/graphql/execute.json/securbank/ArticleByPath',    
    EXCLUDED_THEME_KEYS: new Set(['brandSite', 'brandLogo']),
  };

  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders || getMetadata('hostname');
  const aemauthorurl = getMetadata('authorurl') || '';

  const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  const persistedquery = '/graphql/execute.json/securbank/ArticleByPath';

  // const properties = readBlockConfig(block);

  const contentPath = block
    .querySelector(':scope div:nth-child(1) > div a')
    ?.textContent?.trim();
  const variationname =
    block
      .querySelector(':scope div:nth-child(2) > div')
      ?.textContent?.trim()
      ?.toLowerCase()
      ?.replace(' ', '_') || 'master';
  const displayStyle =
    block.querySelector(':scope div:nth-child(3) > div')?.textContent?.trim() ||
    '';
  const alignment =
    block.querySelector(':scope div:nth-child(4) > div')?.textContent?.trim() ||
    '';
  const ctaStyle =
    block.querySelector(':scope div:nth-child(5) > div')?.textContent?.trim() ||
    'button';

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
      console.error(`error making cf graphql request: ${response.status}`, {
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
      console.error('Error parsing offer JSON from response:', {
        error: parseError.message,
        stack: parseError.stack,
        contentPath,
        variationname,
        isAuthor,
      });
      block.innerHTML = '';
      return;
    }

    const cfReq = offer?.data?.ctaByPath?.item;

    if (!cfReq) {
      console.error(
        'Error parsing response from GraphQL request - no valid data found',
        {
          response: offer,
          contentPath,
          variationname,
        },
      );
      block.innerHTML = '';
      return; // Exit early if no valid data
    }

    // ------------------------------------------------------------
    // Normalize fields for different CF models:
    // - Existing CTA model: title, subtitle, description, bannerimage
    // - Alternative model: headline, main, heroImage/heroimage
    // ------------------------------------------------------------

    const title =
      cfReq.title ??
      cfReq.headline ?? // Headline (CF element "Headline")
      '';

    const subtitle = cfReq.subtitle ?? '';

    const descriptionPlain =
      cfReq.description?.plaintext ??
      cfReq.main?.plaintext ?? // Main as rich text (CF element "Main")
      cfReq.main ?? // Main as plain text (fallback)
      '';

    // Image field normalization
    const imageRef =
      cfReq.bannerimage ??
      cfReq.heroImage ?? // Hero Image (camelCase)
      cfReq.heroimage ?? // Hero Image (all lowercase fallback)
      null;

    const imgUrl = imageRef
      ? isAuthor
        ? imageRef._authorUrl
        : imageRef._publishUrl
      : '';

    // For in-place editing, try to align data-aue-prop with the actual field
    const titlePropName =
      'title' in cfReq
        ? 'title'
        : 'headline' in cfReq
        ? 'headline'
        : 'title';

    const descriptionPropName =
      'description' in cfReq
        ? 'description'
        : 'main' in cfReq
        ? 'main'
        : 'description';

    const imagePropName =
      'bannerimage' in cfReq
        ? 'bannerimage'
        : 'heroImage' in cfReq
        ? 'heroImage'
        : 'heroimage' in cfReq
        ? 'heroimage'
        : 'bannerimage';

    // Determine the layout style
    const isImageLeft = displayStyle === 'image-left';
    const isImageRight = displayStyle === 'image-right';
    const isImageTop = displayStyle === 'image-top';
    const isImageBottom = displayStyle === 'image-bottom';

    // Set background image and styles based on layout
    let bannerContentStyle = '';
    let bannerDetailStyle = '';

    if (imgUrl) {
      if (isImageLeft) {
        bannerContentStyle = `background-image: url(${imgUrl});`;
      } else if (isImageRight) {
        bannerContentStyle = `background-image: url(${imgUrl});`;
      } else if (isImageTop) {
        bannerContentStyle = `background-image: url(${imgUrl});`;
      } else if (isImageBottom) {
        bannerContentStyle = `background-image: url(${imgUrl});`;
      } else {
        // Default layout: image as background with gradient overlay (original behavior)
        bannerDetailStyle = `background-image: linear-gradient(90deg,rgba(0,0,0,0.6), rgba(0,0,0,0.1) 80%) ,url(${imgUrl});`;
      }
    }

    // Derive CTA href: supports author-side paths/URLs and publish/EDS URLs
    let ctaHref = '#';
    const cta = cfReq?.ctaurl;
    if (cta) {
      if (typeof cta === 'string') {
        // Absolute URL vs repository path
        ctaHref = /^https?:\/\//i.test(cta)
          ? cta
          : `${isAuthor ? aemauthorurl || '' : aempublishurl || ''}${cta}`;
      } else if (typeof cta === 'object') {
        const authorUrl = cta._authorUrl;
        const publishUrl = cta._publishUrl || cta._url;
        const pathOnly = cta._path;
        if (isAuthor) {
          ctaHref =
            authorUrl || (pathOnly ? `${aemauthorurl || ''}${pathOnly}` : '#');
        } else {
          ctaHref = pathOnly || publishUrl || '#';
        }
      }
    }

    // Map content paths to site-relative paths using paths.json on live
    if (!isAuthor) {
      try {
        let candidate = ctaHref;
        if (/^https?:\/\//i.test(candidate)) {
          const u = new URL(candidate);
          candidate = u.pathname;
        }
        if (candidate && candidate.startsWith('/content/')) {
          const mapped = await mapAemPathToSitePath(candidate);
          if (mapped) ctaHref = mapped;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to map CTA via paths.json', e);
      }
    }

    const itemId = `urn:aemconnection:${contentPath}/jcr:content/data/${variationname}`;
    block.setAttribute('data-aue-type', 'container');

    // Render block HTML – now supports both:
    // - Title/Subtitle/Description/Banner Image
    // - Headline/Main/Hero Image
    block.innerHTML = `
      <div
        class="banner-content block ${displayStyle}"
        data-aue-resource="${itemId}"
        data-aue-label="${variationname || 'Elements'}"
        data-aue-type="reference"
        data-aue-filter="contentfragment"
        style="${bannerContentStyle}"
      >
        <div
          class="banner-detail ${alignment}"
          style="${bannerDetailStyle}"
          data-aue-prop="${imagePropName}"
          data-aue-label="Main Image"
          data-aue-type="media"
        >
          <h2
            data-aue-prop="${titlePropName}"
            data-aue-label="Title / Headline"
            data-aue-type="text"
            class="cftitle"
          >
            ${title || ''}
          </h2>
          <h3
            data-aue-prop="subtitle"
            data-aue-label="SubTitle"
            data-aue-type="text"
            class="cfsubtitle"
          >
            ${subtitle || ''}
          </h3>

          <div
            data-aue-prop="${descriptionPropName}"
            data-aue-label="Description / Main"
            data-aue-type="richtext"
            class="cfdescription"
          >
            <p>${descriptionPlain || ''}</p>
          </div>

          <p class="button-container ${ctaStyle}">
            <a
              href="${ctaHref}"
              data-aue-prop="ctaurl"
              data-aue-label="Button Link/URL"
              data-aue-type="reference"
              target="_blank"
              rel="noopener"
              data-aue-filter="page"
              class="button"
            >
              <span
                data-aue-prop="ctalabel"
                data-aue-label="Button Label"
                data-aue-type="text"
              >
                ${cfReq?.ctalabel || ''}
              </span>
            </a>
          </p>
        </div>
        <div class="banner-logo"></div>
      </div>
    `;
  } catch (error) {
    console.error('Error rendering content fragment:', {
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
