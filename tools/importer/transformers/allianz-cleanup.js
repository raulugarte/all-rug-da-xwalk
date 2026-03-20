/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Allianz Australia site-wide cleanup.
 * Selectors from captured DOM of allianz.com.au
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove site header/navigation (handled by EDS header block + nav.plain.html)
    // Found in captured HTML: <header class="c-global-header ...">
    WebImporter.DOMUtils.remove(element, [
      'header',
      '.c-global-header',
      '.header_navigation',
      '.c-navigation',
      'nav[class*="navigation"]',
    ]);

    // Remove site footer (handled by EDS footer block + footer.plain.html)
    // Found in captured HTML: <footer class="c-global-footer ...">
    WebImporter.DOMUtils.remove(element, [
      'footer',
      '.c-global-footer',
      '.footer_navigation',
    ]);

    // Remove spacers (empty div containers used for spacing)
    // Found in captured HTML: <div class="spacer parbase"><div></div></div>
    WebImporter.DOMUtils.remove(element, ['.spacer.parbase']);

    // Remove breadcrumb stage
    // Found in captured HTML: <div class="c-stage c-stage--only-breadcrumbs">
    WebImporter.DOMUtils.remove(element, ['.c-stage--only-breadcrumbs']);

    // Remove empty stage container wrapping breadcrumbs
    // Found in captured HTML: <div class="stage container aem-GridColumn">
    WebImporter.DOMUtils.remove(element, ['.stage.container.aem-GridColumn']);

    // Remove agent-card-xf experience fragment (non-authorable)
    // Found in captured HTML: <div class="agent-card-xf experiencefragment">
    WebImporter.DOMUtils.remove(element, ['.agent-card-xf']);

    // Remove anchor elements used for in-page navigation
    // Found in captured HTML: <div class="anchor"><span id="conditions"></span></div>
    WebImporter.DOMUtils.remove(element, ['.anchor']);

    // Remove einsure quote links early (quote grid remnants)
    element.querySelectorAll('a[href*="einsure.com.au"]').forEach((a) => {
      const parent = a.parentElement;
      if (parent && parent.children.length <= 2) parent.remove();
      else a.remove();
    });

    // Remove bold insurance category labels from quote grids
    // In the original DOM these use <b> tags (not <strong>), structured as
    // <div><b><span>Car Insurance</span></b></div>
    // WebImporter converts <b> to <strong> during markdown conversion
    element.querySelectorAll('b').forEach((b) => {
      const text = b.textContent.trim();
      if ((text.endsWith('Insurance') || text.endsWith('Compensation')) && !b.closest('a, h1, h2, h3, h4, nav')) {
        const parent = b.parentElement;
        if (parent && parent.textContent.trim() === text) {
          parent.remove();
        } else {
          b.remove();
        }
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove footer navigation (non-authorable site chrome)
    // Found in captured HTML: <div class="footer_navigation container">
    WebImporter.DOMUtils.remove(element, ['.footer_navigation']);

    // Remove the experience fragment containing footer navigation
    // This is the last experiencefragment in the parsys
    const footerXf = element.querySelector('.footer_navigation');
    if (footerXf) {
      const xfParent = footerXf.closest('.experiencefragment');
      if (xfParent) xfParent.remove();
    }

    // Remove footer experience fragments containing legal text and quote links grid
    const allXfs = element.querySelectorAll('.experiencefragment');
    allXfs.forEach((xf) => {
      const hasInsuranceType = xf.querySelector('h4');
      const hasLegalText = xf.textContent.includes('ABN 15 000 122 850');
      if (hasInsuranceType || hasLegalText) {
        xf.remove();
      }
    });

    // Remove "INSURANCE TYPE" headings and all content after them within their parent
    element.querySelectorAll('h4').forEach((h4) => {
      if (h4.textContent.trim().toUpperCase().includes('INSURANCE TYPE')) {
        let sibling = h4.nextElementSibling;
        while (sibling) {
          const next = sibling.nextElementSibling;
          sibling.remove();
          sibling = next;
        }
        h4.remove();
      }
    });

    // Remove social media link lists (content-based: lists containing only social media links)
    const socialDomains = ['facebook.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'instagram.com', 'tiktok.com'];
    element.querySelectorAll('ul').forEach((ul) => {
      const links = ul.querySelectorAll('a');
      if (links.length >= 3) {
        const allSocial = Array.from(links).every((a) => socialDomains.some((d) => (a.href || '').includes(d)));
        if (allSocial) ul.remove();
      }
    });

    // Remove "Follow us on" heading
    element.querySelectorAll('h2').forEach((h2) => {
      if (h2.textContent.trim().toLowerCase() === 'follow us on') h2.remove();
    });

    // Remove "*Conditions apply" heading
    element.querySelectorAll('h2').forEach((h2) => {
      if (h2.textContent.trim().includes('Conditions apply')) h2.remove();
    });

    // Remove footnote lists containing legal disclaimers
    element.querySelectorAll('ol').forEach((ol) => {
      if (ol.textContent.includes('insurance brand') || ol.textContent.includes('24/7 online claims')) {
        ol.remove();
      }
    });

    // Remove links to einsure.com.au quote pages (footer quote grid remnants)
    element.querySelectorAll('a[href*="einsure.com.au"]').forEach((a) => {
      const p = a.closest('p');
      if (p) p.remove();
      else a.remove();
    });

    // Remove orphaned bold insurance category headings (remnants after einsure links removed)
    element.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.trim();
      if (p.querySelector('strong') && !p.querySelector('a') && text.endsWith('Insurance')) {
        p.remove();
      }
    });

    // Remove noscript, iframes, and link elements
    WebImporter.DOMUtils.remove(element, ['noscript', 'iframe', 'link']);

    // Clean tracking attributes from all elements
    element.querySelectorAll('[data-track]').forEach((el) => el.removeAttribute('data-track'));
    element.querySelectorAll('[onclick]').forEach((el) => el.removeAttribute('onclick'));
  }
}
