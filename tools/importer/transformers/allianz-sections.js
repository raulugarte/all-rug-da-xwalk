/* eslint-disable */
/* global WebImporter */

/**
 * Allianz AU sections.
 * Runs in afterTransform only. Uses payload.template.sections to insert
 * <hr> section breaks and Section Metadata blocks for styled sections.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Find wrapper element by heading text match.
 */
function findWrapperByHeading(element, headingText) {
  const lowerText = headingText.toLowerCase();
  const wrappers = element.querySelectorAll('.parsys > .wrapper');
  for (const wrapper of wrappers) {
    const headings = wrapper.querySelectorAll('h1, h2, h3');
    for (const h of headings) {
      if (h.textContent.toLowerCase().includes(lowerText)) {
        return wrapper;
      }
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const template = payload && payload.template;
    if (!template || !template.sections || template.sections.length < 2) return;

    const { sections } = template;
    const document = payload.document || element.ownerDocument || element.getRootNode();

    // Process sections in reverse order to avoid DOM position shifts
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];

      // Find section element: prefer heading-based matching, fall back to CSS selector
      let sectionEl = null;
      if (section.headingMatch) {
        sectionEl = findWrapperByHeading(element, section.headingMatch);
      }
      if (!sectionEl && section.selector) {
        const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
        for (const sel of selectors) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
      }

      if (!sectionEl) continue;

      // Add section-metadata block if section has a style
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.after(metaBlock);
      }

      // Add <hr> section break before this section (except the first section)
      if (i > 0) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    }
  }
}
