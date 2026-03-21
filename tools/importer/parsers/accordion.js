/* eslint-disable */
/* global WebImporter */

/**
 * Parser: accordion
 * Source: https://www.allianz.com.au/car-insurance.html
 * Selector: .parsys > .wrapper:nth-of-type(11) .c-accordion
 * Structure: Accordion with multiple expandable items, each having a question
 *   (h3 inside button trigger) and answer (rich text with paragraphs, lists, links)
 * Accordion table: 2 columns per row (summary | text content)
 * UE model: accordion-item { summary (text), text (richtext) }
 * Note: The FAQ section has 3 accordion groups. Each .c-accordion element
 *   is parsed separately (3 calls), each preceded by an h3 group heading.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Each accordion item wrapper contains a trigger button (question) and content div (answer)
  const items = element.querySelectorAll('.c-accordion__item-wrapper');

  items.forEach((item) => {
    // Summary cell: question title (field: summary)
    const trigger = item.querySelector('.c-accordion__trigger, .js-accordion__trigger');
    const questionTitle = trigger
      ? trigger.querySelector('h3, .c-accordion__item-title')
      : null;

    const summaryFrag = document.createDocumentFragment();
    summaryFrag.appendChild(document.createComment(' field:summary '));
    if (questionTitle) {
      summaryFrag.appendChild(document.createTextNode(questionTitle.textContent.trim()));
    }

    // Text cell: answer content (field: text)
    const contentDiv = item.querySelector('.c-accordion__item-content .c-accordion__item-text');
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    let hasContent = false;

    if (contentDiv) {
      const copyDiv = contentDiv.querySelector('.c-copy, .text .c-copy');
      const sourceEl = copyDiv || contentDiv;

      // Extract paragraphs, lists, and other block-level content
      sourceEl.childNodes.forEach((node) => {
        if (node.nodeType === 1) {
          // Element node
          const tag = node.tagName.toLowerCase();

          if (tag === 'p') {
            const p = document.createElement('p');
            // Preserve inline elements (bold, links)
            buildInlineContent(node, p, document);
            textFrag.appendChild(p);
            hasContent = true;
          } else if (tag === 'ul' || tag === 'ol') {
            const list = document.createElement(tag);
            node.querySelectorAll('li').forEach((li) => {
              const newLi = document.createElement('li');
              newLi.textContent = li.textContent.trim();
              list.appendChild(newLi);
            });
            textFrag.appendChild(list);
            hasContent = true;
          } else if (tag === 'div') {
            // Nested div (e.g., .text wrapper) - recurse into its children
            node.querySelectorAll('p, ul, ol').forEach((child) => {
              const childTag = child.tagName.toLowerCase();
              if (childTag === 'p') {
                const p = document.createElement('p');
                buildInlineContent(child, p, document);
                textFrag.appendChild(p);
                hasContent = true;
              } else if (childTag === 'ul' || childTag === 'ol') {
                const list = document.createElement(childTag);
                child.querySelectorAll('li').forEach((li) => {
                  const newLi = document.createElement('li');
                  newLi.textContent = li.textContent.trim();
                  list.appendChild(newLi);
                });
                textFrag.appendChild(list);
                hasContent = true;
              }
            });
          }
        }
      });
    }

    if (questionTitle || hasContent) {
      cells.push([summaryFrag, hasContent ? textFrag : '']);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}

/**
 * Build inline content preserving bold, links, and text nodes
 */
function buildInlineContent(source, target, document) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      // Text node
      target.appendChild(document.createTextNode(node.textContent));
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'a') {
        const a = document.createElement('a');
        a.href = node.href || node.getAttribute('href');
        const linkText = node.querySelector('.c-link__text');
        a.textContent = linkText
          ? linkText.textContent.trim()
          : node.textContent.trim();
        target.appendChild(a);
      } else if (tag === 'b' || tag === 'strong') {
        const strong = document.createElement('strong');
        strong.textContent = node.textContent.trim();
        target.appendChild(strong);
      } else if (tag === 'sup') {
        const sup = document.createElement('sup');
        sup.textContent = node.textContent.trim();
        target.appendChild(sup);
      } else {
        // Other inline elements - just add text content
        target.appendChild(document.createTextNode(node.textContent));
      }
    }
  });
}
