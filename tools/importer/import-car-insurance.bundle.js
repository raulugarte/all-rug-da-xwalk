var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-car-insurance.js
  var import_car_insurance_exports = {};
  __export(import_car_insurance_exports, {
    default: () => import_car_insurance_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const cells = [];
    const oneStage = element.querySelector("one-stage");
    const hasShadow = oneStage && oneStage.shadowRoot;
    const heroRoot = hasShadow ? oneStage.shadowRoot : element;
    let imageSrc = null;
    let imageAlt = "";
    if (oneStage) {
      const dataImage = oneStage.getAttribute("data-image");
      if (dataImage) {
        imageSrc = dataImage.startsWith("http") ? dataImage : `https://www.allianz.com.au${dataImage}`;
        imageAlt = oneStage.getAttribute("data-stageimagealt") || "";
      }
    }
    if (!imageSrc) {
      const bgImg = heroRoot.querySelector("img");
      if (bgImg) {
        imageSrc = bgImg.src || bgImg.getAttribute("src");
        imageAlt = bgImg.alt || "";
      }
    }
    if (imageSrc) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:image "));
      const imgEl = document.createElement("img");
      imgEl.src = imageSrc;
      imgEl.alt = imageAlt;
      frag.appendChild(imgEl);
      cells.push([frag]);
    }
    const contentCell = document.createDocumentFragment();
    contentCell.appendChild(document.createComment(" field:text "));
    let hasContent = false;
    if (hasShadow) {
      const heading = heroRoot.querySelector("h1");
      if (heading) {
        const h1 = document.createElement("h1");
        h1.textContent = heading.textContent.trim();
        contentCell.appendChild(h1);
        hasContent = true;
      }
      const subtitle = heroRoot.querySelector('.heading--h3, span[class*="heading"]');
      if (subtitle && subtitle.textContent.trim() !== heading?.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = subtitle.textContent.trim();
        contentCell.appendChild(p);
        hasContent = true;
      }
      const ctas = heroRoot.querySelectorAll('a[class*="button"], button[class*="button"]');
      ctas.forEach((cta) => {
        const text = cta.textContent.trim();
        if (text) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = cta.href || cta.getAttribute("href") || "#";
          a.textContent = text;
          p.appendChild(a);
          contentCell.appendChild(p);
          hasContent = true;
        }
      });
    }
    if (!hasContent) {
      const titleText = document.title || "";
      const titleParts = titleText.split("|");
      let pageHeading = titleParts[0].trim();
      pageHeading = pageHeading.replace(/\s+Quotes?\b/i, "").replace(/\s*\|\s*Compare\s+Options/i, "").trim();
      if (!pageHeading) pageHeading = "Allianz Insurance";
      const h1 = document.createElement("h1");
      h1.textContent = pageHeading;
      contentCell.appendChild(h1);
      const metaDesc = document.querySelector('meta[name="description"]');
      const descContent = metaDesc ? metaDesc.getAttribute("content") : "";
      let subtitleText = "";
      if (descContent) {
        const firstSentence = descContent.split(/\.\s/)[0].trim();
        subtitleText = firstSentence.length > 80 ? firstSentence.substring(0, 80).trim() : firstSentence;
        if (!subtitleText.endsWith(".")) subtitleText += ".";
      }
      if (!subtitleText) subtitleText = "Care you can count on";
      const subtitle = document.createElement("p");
      subtitle.textContent = subtitleText;
      contentCell.appendChild(subtitle);
      const cta1P = document.createElement("p");
      const cta1 = document.createElement("a");
      cta1.href = "#";
      cta1.textContent = "Get a quote";
      cta1P.appendChild(cta1);
      contentCell.appendChild(cta1P);
      hasContent = true;
    }
    if (hasContent) {
      cells.push([contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-cover.js
  function parse2(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope .l-grid__row > .column");
    columns.forEach((col) => {
      const img = col.querySelector(".cmp-image img, picture img, .c-image__img");
      let imageCell = "";
      if (img) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:image "));
        const imgEl = document.createElement("img");
        imgEl.src = img.src || img.getAttribute("src");
        imgEl.alt = img.alt || "";
        frag.appendChild(imgEl);
        imageCell = frag;
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      let hasText = false;
      const headingEl = col.querySelector("h3");
      if (headingEl) {
        const h3 = document.createElement("h3");
        const headingLink = headingEl.querySelector("a");
        if (headingLink) {
          const a = document.createElement("a");
          a.href = headingLink.href || headingLink.getAttribute("href");
          const linkText = headingLink.querySelector(".c-link__text");
          a.textContent = linkText ? linkText.textContent.trim() : headingLink.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = headingEl.textContent.trim();
        }
        textFrag.appendChild(h3);
        hasText = true;
      }
      const textBlocks = col.querySelectorAll(".text .c-copy");
      if (textBlocks.length > 0) {
        const firstP = textBlocks[0].querySelector("p");
        if (firstP) {
          const p = document.createElement("p");
          p.textContent = firstP.textContent.trim();
          textFrag.appendChild(p);
          hasText = true;
        }
      }
      const featureList = col.querySelector("ul.c-list--icon, ul.c-list");
      if (featureList) {
        const ul = document.createElement("ul");
        featureList.querySelectorAll("li.c-list__item").forEach((li) => {
          const newLi = document.createElement("li");
          const icon = li.querySelector(".c-icon");
          const isIncluded = icon && icon.classList.contains("c-icon--check");
          const text = li.textContent.trim();
          newLi.textContent = `${isIncluded ? "\u2713" : "\u2717"} ${text}`;
          ul.appendChild(newLi);
        });
        textFrag.appendChild(ul);
        hasText = true;
      }
      const learnMore = col.querySelector(".link a.c-link");
      if (learnMore) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = learnMore.href || learnMore.getAttribute("href");
        const linkText = learnMore.querySelector(".c-link__text");
        a.textContent = linkText ? linkText.textContent.trim() : learnMore.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
        hasText = true;
      }
      if (imageCell || hasText) {
        cells.push([imageCell || "", hasText ? textFrag : ""]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-cover", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table.js
  function parse3(element, { document }) {
    const cells = [];
    const headerTable = element.querySelector("table.c-product-comparison__table-main-head");
    const headerRow = [];
    if (headerTable) {
      const col1Frag = document.createDocumentFragment();
      col1Frag.appendChild(document.createComment(" field:column1text "));
      headerRow.push(col1Frag);
      const colHeaders = headerTable.querySelectorAll("td.c-product-comparison__col-header");
      const colFields = ["column2text", "column3text", "column4text"];
      colHeaders.forEach((col, i) => {
        const heading = col.querySelector("h3, .c-heading--comparison-table-col-headline");
        const frag = document.createDocumentFragment();
        if (i < colFields.length) {
          frag.appendChild(document.createComment(` field:${colFields[i]} `));
        }
        if (heading) {
          const strong = document.createElement("strong");
          strong.textContent = heading.textContent.trim();
          frag.appendChild(strong);
        }
        headerRow.push(frag);
      });
    }
    if (headerRow.length > 0) {
      cells.push(headerRow);
    }
    const featureTables = element.querySelectorAll(".service-list table.c-product-comparison__table");
    featureTables.forEach((table) => {
      const row = table.querySelector("tr.c-product-comparison__row, tr");
      if (!row) return;
      const rowCells = [];
      const rowHeader = row.querySelector("th.c-product-comparison__row-header");
      const featureFrag = document.createDocumentFragment();
      featureFrag.appendChild(document.createComment(" field:column1text "));
      if (rowHeader) {
        const featureContent = rowHeader.querySelector(".c-product-comparison__row-header-content");
        const text = featureContent ? featureContent.textContent.trim() : rowHeader.textContent.trim();
        featureFrag.appendChild(document.createTextNode(text));
      }
      rowCells.push(featureFrag);
      const dataCells = row.querySelectorAll("td.c-product-comparison__cell");
      const colFields = ["column2text", "column3text", "column4text"];
      dataCells.forEach((cell, i) => {
        const frag = document.createDocumentFragment();
        if (i < colFields.length) {
          frag.appendChild(document.createComment(` field:${colFields[i]} `));
        }
        const icon = cell.querySelector(".c-icon");
        if (icon) {
          const isIncluded = icon.classList.contains("c-icon--check");
          const ariaLabel = icon.getAttribute("aria-label") || "";
          frag.appendChild(document.createTextNode(
            isIncluded ? `\u2713 ${ariaLabel || "Included"}` : `\u2717 ${ariaLabel || "Not included"}`
          ));
        }
        rowCells.push(frag);
      });
      if (rowCells.length > 1) {
        cells.push(rowCells);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "table", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-actions.js
  var KNOWN_ACTIONS = [
    { heading: "24/7 online claims", cta: "Make a claim", href: "/claims.html" },
    { heading: "Manage your Home or Car policy", cta: "Log in to My Allianz", href: "/my-allianz/login-to-my-allianz.html" },
    { heading: "Manage renewals", cta: "Make a payment", href: "/my-allianz/renewals.html" }
  ];
  function parse4(element, { document }) {
    const cells = [];
    const outerColumns = element.querySelectorAll(":scope > div > .l-grid__row > .column");
    let headingEl = null;
    if (outerColumns.length > 0) {
      const heading = outerColumns[0].querySelector("h2, .c-heading--section");
      if (heading) {
        headingEl = document.createElement("h2");
        headingEl.textContent = heading.textContent.trim();
      }
    }
    if (outerColumns.length > 1) {
      const col2 = outerColumns[1];
      const actionGrids = col2.querySelectorAll(":scope .multi-column-grid");
      actionGrids.forEach((grid) => {
        const iconImg = grid.querySelector(".cmp-image img, picture img");
        const actionHeading = grid.querySelector("h3, .c-heading--subsection-medium");
        const actionLink = grid.querySelector(".link a.c-link");
        let imageCell = "";
        if (iconImg) {
          const p = document.createElement("p");
          const img = document.createElement("img");
          img.src = iconImg.src || iconImg.getAttribute("src");
          img.alt = iconImg.alt || "";
          p.appendChild(img);
          imageCell = p;
        }
        const textFrag = document.createDocumentFragment();
        let hasText = false;
        const headingText = actionHeading ? actionHeading.textContent.trim() : "";
        if (headingText) {
          const h3 = document.createElement("h3");
          h3.textContent = headingText;
          textFrag.appendChild(h3);
          hasText = true;
        }
        let ctaFound = false;
        if (actionLink) {
          const href = actionLink.href || actionLink.getAttribute("href") || "";
          if (!href.includes("einsure.com.au")) {
            const p = document.createElement("p");
            const a = document.createElement("a");
            a.href = href;
            a.textContent = actionLink.querySelector(".c-link__text") ? actionLink.querySelector(".c-link__text").textContent.trim() : actionLink.textContent.trim();
            p.appendChild(a);
            textFrag.appendChild(p);
            ctaFound = true;
            hasText = true;
          }
        }
        if (!ctaFound && headingText) {
          const known = KNOWN_ACTIONS.find(
            (ka) => headingText.toLowerCase().includes(ka.heading.toLowerCase())
          );
          if (known) {
            const p = document.createElement("p");
            const a = document.createElement("a");
            a.href = known.href;
            a.textContent = known.cta;
            p.appendChild(a);
            textFrag.appendChild(p);
            hasText = true;
          }
        }
        if (imageCell || hasText) {
          cells.push([imageCell || "", hasText ? textFrag : ""]);
        }
      });
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-actions", cells });
    if (headingEl) {
      element.before(headingEl);
    }
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-info.js
  function parse5(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope .l-grid__row > .column");
    if (columns.length >= 2) {
      const leftCol = columns[0];
      const textFrag = document.createDocumentFragment();
      let hasText = false;
      const heading = leftCol.querySelector("h2, .c-heading--section");
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        textFrag.appendChild(h2);
        hasText = true;
      }
      const copyDiv = leftCol.querySelector(".text .c-copy");
      if (copyDiv) {
        const paragraph = copyDiv.querySelector("p");
        if (paragraph) {
          const p = document.createElement("p");
          paragraph.childNodes.forEach((node) => {
            if (node.nodeType === 3) {
              p.appendChild(document.createTextNode(node.textContent));
            } else if (node.nodeName === "A") {
              const a = document.createElement("a");
              a.href = node.href || node.getAttribute("href");
              const linkText = node.querySelector(".c-link__text");
              a.textContent = linkText ? linkText.textContent.trim() : node.textContent.trim();
              p.appendChild(a);
            } else {
              p.appendChild(document.createTextNode(node.textContent));
            }
          });
          textFrag.appendChild(p);
          hasText = true;
        }
        const featureList = copyDiv.querySelector("ul.c-list--icon, ul.c-list");
        if (featureList) {
          const ul = document.createElement("ul");
          featureList.querySelectorAll("li.c-list__item").forEach((li) => {
            const newLi = document.createElement("li");
            const icon = li.querySelector(".c-icon");
            const isIncluded = icon && icon.classList.contains("c-icon--check");
            const text = li.textContent.trim();
            newLi.textContent = `${isIncluded ? "\u2713" : "\u2717"} ${text}`;
            ul.appendChild(newLi);
          });
          textFrag.appendChild(ul);
          hasText = true;
        }
      }
      const ctaLink = leftCol.querySelector(".button a.c-button, .button a");
      if (ctaLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = ctaLink.href || ctaLink.getAttribute("href");
        const btnText = ctaLink.querySelector("span");
        a.textContent = btnText ? btnText.textContent.trim() : ctaLink.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
        hasText = true;
      }
      const rightCol = columns[1];
      const img = rightCol.querySelector(".cmp-image img, picture img, .c-image__img");
      let imageCell = "";
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.src || img.getAttribute("src");
        imgEl.alt = img.alt || "";
        imageCell = imgEl;
      }
      cells.push([hasText ? textFrag : "", imageCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-info", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-features.js
  function parse6(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope > div > .l-grid__row > .column");
    const row = [];
    columns.forEach((col) => {
      const colContent = [];
      const img = col.querySelector(".cmp-image img, picture img, .c-image__img");
      if (img) {
        const imgEl = document.createElement("img");
        imgEl.src = img.src || img.getAttribute("src");
        imgEl.alt = img.alt || "";
        colContent.push(imgEl);
      }
      const text = col.querySelector(".headline span.c-heading, .headline .c-heading");
      if (text) {
        const p = document.createElement("p");
        p.textContent = text.textContent.trim();
        colContent.push(p);
      }
      row.push(colContent.length > 0 ? colContent : "");
    });
    if (row.length > 0) {
      cells.push(row);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-features", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse7(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope .l-grid__row > .column");
    columns.forEach((col) => {
      const img = col.querySelector(".cmp-image img, picture img, .c-image__img");
      let imageCell = "";
      if (img) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:image "));
        frag.appendChild(img);
        imageCell = frag;
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      let hasText = false;
      const headingEl = col.querySelector("h3");
      if (headingEl) {
        const headingLink = headingEl.querySelector("a");
        const h3 = document.createElement("h3");
        if (headingLink) {
          const a = document.createElement("a");
          a.href = headingLink.href || headingLink.getAttribute("href");
          a.textContent = headingLink.querySelector(".c-link__text") ? headingLink.querySelector(".c-link__text").textContent.trim() : headingLink.textContent.trim();
          h3.appendChild(a);
        } else {
          h3.textContent = headingEl.textContent.trim();
        }
        textFrag.appendChild(h3);
        hasText = true;
      }
      const desc = col.querySelector(".c-copy p, .text p");
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.trim();
        textFrag.appendChild(p);
        hasText = true;
      }
      const readMore = col.querySelector(".link a.c-link");
      if (readMore) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = readMore.href || readMore.getAttribute("href");
        a.textContent = readMore.querySelector(".c-link__text") ? readMore.querySelector(".c-link__text").textContent.trim() : readMore.textContent.trim();
        p.appendChild(a);
        textFrag.appendChild(p);
        hasText = true;
      }
      if (imageCell || hasText) {
        cells.push([imageCell || "", hasText ? textFrag : ""]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse8(element, { document }) {
    const cells = [];
    const items = element.querySelectorAll(".c-accordion__item-wrapper");
    items.forEach((item) => {
      const trigger = item.querySelector(".c-accordion__trigger, .js-accordion__trigger");
      const questionTitle = trigger ? trigger.querySelector("h3, .c-accordion__item-title") : null;
      const summaryFrag = document.createDocumentFragment();
      summaryFrag.appendChild(document.createComment(" field:summary "));
      if (questionTitle) {
        summaryFrag.appendChild(document.createTextNode(questionTitle.textContent.trim()));
      }
      const contentDiv = item.querySelector(".c-accordion__item-content .c-accordion__item-text");
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      let hasContent = false;
      if (contentDiv) {
        const copyDiv = contentDiv.querySelector(".c-copy, .text .c-copy");
        const sourceEl = copyDiv || contentDiv;
        sourceEl.childNodes.forEach((node) => {
          if (node.nodeType === 1) {
            const tag = node.tagName.toLowerCase();
            if (tag === "p") {
              const p = document.createElement("p");
              buildInlineContent(node, p, document);
              textFrag.appendChild(p);
              hasContent = true;
            } else if (tag === "ul" || tag === "ol") {
              const list = document.createElement(tag);
              node.querySelectorAll("li").forEach((li) => {
                const newLi = document.createElement("li");
                newLi.textContent = li.textContent.trim();
                list.appendChild(newLi);
              });
              textFrag.appendChild(list);
              hasContent = true;
            } else if (tag === "div") {
              node.querySelectorAll("p, ul, ol").forEach((child) => {
                const childTag = child.tagName.toLowerCase();
                if (childTag === "p") {
                  const p = document.createElement("p");
                  buildInlineContent(child, p, document);
                  textFrag.appendChild(p);
                  hasContent = true;
                } else if (childTag === "ul" || childTag === "ol") {
                  const list = document.createElement(childTag);
                  child.querySelectorAll("li").forEach((li) => {
                    const newLi = document.createElement("li");
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
        cells.push([summaryFrag, hasContent ? textFrag : ""]);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "accordion", cells });
    element.replaceWith(block);
  }
  function buildInlineContent(source, target, document) {
    source.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        target.appendChild(document.createTextNode(node.textContent));
      } else if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (tag === "a") {
          const a = document.createElement("a");
          a.href = node.href || node.getAttribute("href");
          const linkText = node.querySelector(".c-link__text");
          a.textContent = linkText ? linkText.textContent.trim() : node.textContent.trim();
          target.appendChild(a);
        } else if (tag === "b" || tag === "strong") {
          const strong = document.createElement("strong");
          strong.textContent = node.textContent.trim();
          target.appendChild(strong);
        } else if (tag === "sup") {
          const sup = document.createElement("sup");
          sup.textContent = node.textContent.trim();
          target.appendChild(sup);
        } else {
          target.appendChild(document.createTextNode(node.textContent));
        }
      }
    });
  }

  // tools/importer/transformers/allianz-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        ".c-global-header",
        ".header_navigation",
        ".c-navigation",
        'nav[class*="navigation"]'
      ]);
      WebImporter.DOMUtils.remove(element, [
        "footer",
        ".c-global-footer",
        ".footer_navigation"
      ]);
      WebImporter.DOMUtils.remove(element, [".spacer.parbase"]);
      WebImporter.DOMUtils.remove(element, [".c-stage--only-breadcrumbs"]);
      WebImporter.DOMUtils.remove(element, [".stage.container.aem-GridColumn"]);
      WebImporter.DOMUtils.remove(element, [".agent-card-xf"]);
      WebImporter.DOMUtils.remove(element, [".anchor"]);
      WebImporter.DOMUtils.remove(element, [
        ".product_navigation",
        ".c-product-nav-bar"
      ]);
      element.querySelectorAll('a[href*="einsure.com.au"]').forEach((a) => {
        const parent = a.parentElement;
        if (parent && parent.children.length <= 2) parent.remove();
        else a.remove();
      });
      element.querySelectorAll("b").forEach((b) => {
        const text = b.textContent.trim();
        if ((text.endsWith("Insurance") || text.endsWith("Compensation")) && !b.closest("a, h1, h2, h3, h4, nav")) {
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
      WebImporter.DOMUtils.remove(element, [".footer_navigation"]);
      const footerXf = element.querySelector(".footer_navigation");
      if (footerXf) {
        const xfParent = footerXf.closest(".experiencefragment");
        if (xfParent) xfParent.remove();
      }
      const allXfs = element.querySelectorAll(".experiencefragment");
      allXfs.forEach((xf) => {
        const hasInsuranceType = xf.querySelector("h4");
        const hasLegalText = xf.textContent.includes("ABN 15 000 122 850");
        if (hasInsuranceType || hasLegalText) {
          xf.remove();
        }
      });
      element.querySelectorAll("h4").forEach((h4) => {
        if (h4.textContent.trim().toUpperCase().includes("INSURANCE TYPE")) {
          let sibling = h4.nextElementSibling;
          while (sibling) {
            const next = sibling.nextElementSibling;
            sibling.remove();
            sibling = next;
          }
          h4.remove();
        }
      });
      const socialDomains = ["facebook.com", "twitter.com", "x.com", "linkedin.com", "youtube.com", "instagram.com", "tiktok.com"];
      element.querySelectorAll("ul").forEach((ul) => {
        const links = ul.querySelectorAll("a");
        if (links.length >= 3) {
          const allSocial = Array.from(links).every((a) => socialDomains.some((d) => (a.href || "").includes(d)));
          if (allSocial) ul.remove();
        }
      });
      element.querySelectorAll("h2").forEach((h2) => {
        if (h2.textContent.trim().toLowerCase() === "follow us on") h2.remove();
      });
      element.querySelectorAll("h2").forEach((h2) => {
        if (h2.textContent.trim().includes("Conditions apply")) h2.remove();
      });
      element.querySelectorAll("ol").forEach((ol) => {
        if (ol.textContent.includes("insurance brand") || ol.textContent.includes("24/7 online claims")) {
          ol.remove();
        }
      });
      element.querySelectorAll('a[href*="einsure.com.au"]').forEach((a) => {
        const p = a.closest("p");
        if (p) p.remove();
        else a.remove();
      });
      element.querySelectorAll("p").forEach((p) => {
        const text = p.textContent.trim();
        if (p.querySelector("strong") && !p.querySelector("a") && text.endsWith("Insurance")) {
          p.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, ["noscript", "iframe", "link"]);
      element.querySelectorAll("[data-track]").forEach((el) => el.removeAttribute("data-track"));
      element.querySelectorAll("[onclick]").forEach((el) => el.removeAttribute("onclick"));
    }
  }

  // tools/importer/transformers/allianz-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function findWrapperByHeading(element, headingText) {
    const lowerText = headingText.toLowerCase();
    const wrappers = element.querySelectorAll(".parsys > .wrapper");
    for (const wrapper of wrappers) {
      const headings = wrapper.querySelectorAll("h1, h2, h3");
      for (const h of headings) {
        if (h.textContent.toLowerCase().includes(lowerText)) {
          return wrapper;
        }
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const template = payload && payload.template;
      if (!template || !template.sections || template.sections.length < 2) return;
      const { sections } = template;
      const document = payload.document || element.ownerDocument || element.getRootNode();
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
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
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metaBlock);
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-car-insurance.js
  if (typeof globalThis !== "undefined") {
    if (!globalThis.process) globalThis.process = {};
    if (typeof globalThis.process.cwd !== "function") {
      globalThis.process.cwd = () => "/";
    }
  }
  var parsers = {
    "hero-banner": parse,
    "cards-cover": parse2,
    "table": parse3,
    "columns-actions": parse4,
    "columns-info": parse5,
    "columns-features": parse6,
    "cards-article": parse7,
    "accordion": parse8
  };
  var PAGE_TEMPLATE = {
    name: "car-insurance",
    description: "Allianz Australia car insurance product page with hero banner, cover options, comparison table, customer actions, CTP info, roadside assistance, trust signals, related content, FAQs, and conditions",
    urls: [
      "https://www.allianz.com.au/car-insurance.html"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".parsys > .a1stage"]
      },
      {
        name: "cards-cover",
        headingMatch: "Find the right Car Insurance",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "table",
        instances: [".product-comparison-table-new"]
      },
      {
        name: "columns-actions",
        headingMatch: "Already an Allianz",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-info",
        headingMatch: "Compulsory Third Party",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-features",
        headingMatch: "Why choose Allianz",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "cards-article",
        headingMatch: "Related content",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "accordion",
        headingMatch: "Frequently asked questions",
        gridSelector: ".c-accordion"
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero Banner",
        selector: ".parsys > .a1stage",
        style: null,
        blocks: ["hero-banner"],
        defaultContent: []
      },
      {
        id: "section-2-disclaimer",
        name: "Policy Disclaimer",
        selector: ".parsys > .experiencefragment:nth-of-type(1)",
        style: null,
        blocks: [],
        defaultContent: ["p"]
      },
      {
        id: "section-2b-rating",
        name: "Customer Rating",
        selector: ".parsys > .experiencefragment:nth-of-type(2)",
        style: "dark-blue",
        blocks: [],
        defaultContent: ["img", "p"]
      },
      {
        id: "section-3-covers",
        name: "Cover Options",
        selector: ".parsys > .wrapper:nth-of-type(1)",
        style: null,
        blocks: ["cards-cover"],
        defaultContent: ["h2.headline"]
      },
      {
        id: "section-4-comparison",
        name: "Comparison Table",
        headingMatch: "Compare our Car Insurance",
        selector: [".parsys > .wrapper:nth-of-type(2)", ".parsys > .product-comparison-table-new", ".parsys > .wrapper:nth-of-type(3)"],
        style: null,
        blocks: ["table"],
        defaultContent: ["h2.headline", "div.text"]
      },
      {
        id: "section-5-states",
        name: "State-Based Links",
        selector: ".parsys > .wrapper:nth-of-type(4)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", ".state-link-list"]
      },
      {
        id: "section-6-customer",
        name: "Existing Customer Actions",
        headingMatch: "Already an Allianz",
        selector: ".parsys > .wrapper:nth-of-type(5)",
        style: "dark-blue",
        blocks: ["columns-actions"],
        defaultContent: ["h2.headline", "p"]
      },
      {
        id: "section-7-ctp",
        name: "CTP Information",
        selector: ".parsys > .wrapper:nth-of-type(6)",
        style: null,
        blocks: ["columns-info"],
        defaultContent: []
      },
      {
        id: "section-8-roadside",
        name: "Roadside Assistance",
        selector: ".parsys > .wrapper:nth-of-type(7)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", "p", "a.cta"]
      },
      {
        id: "section-9-why-choose",
        name: "Why Choose Allianz",
        headingMatch: "Why choose Allianz",
        selector: ".parsys > .wrapper:nth-of-type(9)",
        style: null,
        blocks: ["columns-features"],
        defaultContent: ["h2.headline"]
      },
      {
        id: "section-10-related",
        name: "Related Content",
        selector: ".parsys > .wrapper:nth-of-type(10)",
        style: null,
        blocks: ["cards-article"],
        defaultContent: ["h2.headline"]
      },
      {
        id: "section-11-cta",
        name: "Get Started CTA",
        selector: ".parsys > .experiencefragment:nth-of-type(3)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", "a.cta"]
      },
      {
        id: "section-12-faq",
        name: "FAQs",
        headingMatch: "Frequently asked questions",
        selector: ".parsys > .wrapper:nth-of-type(11)",
        style: "light-grey",
        blocks: ["accordion"],
        defaultContent: ["h2.headline"]
      },
      {
        id: "section-13-raa",
        name: "RAA Insurance Info",
        selector: ".parsys > .wrapper:nth-of-type(12)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", "p"]
      },
      {
        id: "section-14-help",
        name: "Help Section",
        selector: ".parsys > .experiencefragment:nth-of-type(4)",
        style: "light-blue",
        blocks: [],
        defaultContent: ["h2.headline", "p", "a.cta"]
      },
      {
        id: "section-15-social",
        name: "Social Media Links",
        selector: ".parsys > .experiencefragment:nth-of-type(5)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", ".c-social-icon"]
      },
      {
        id: "section-16-conditions",
        name: "Conditions/Footnotes",
        selector: ".parsys > .wrapper:nth-of-type(13)",
        style: null,
        blocks: [],
        defaultContent: ["h2.headline", ".c-list--ordered"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      document: payload.document,
      url: payload.url,
      html: payload.html,
      params: payload.params,
      template: PAGE_TEMPLATE
    };
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findWrapperByHeading2(document, headingText) {
    const lowerText = headingText.toLowerCase();
    const wrappers = document.querySelectorAll(".parsys > .wrapper");
    for (const wrapper of wrappers) {
      const headings = wrapper.querySelectorAll("h1, h2, h3");
      for (const h of headings) {
        if (h.textContent.toLowerCase().includes(lowerText)) {
          return wrapper;
        }
      }
    }
    return null;
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      if (blockDef.headingMatch) {
        const wrapper = findWrapperByHeading2(document, blockDef.headingMatch);
        if (wrapper) {
          const gridSel = blockDef.gridSelector || ".multi-column-grid";
          const grids = wrapper.querySelectorAll(gridSel);
          if (grids.length > 0) {
            grids.forEach((grid) => {
              pageBlocks.push({
                name: blockDef.name,
                selector: `heading:"${blockDef.headingMatch}" ${gridSel}`,
                element: grid,
                section: blockDef.section || null
              });
            });
          } else {
            console.warn(`Block "${blockDef.name}": heading "${blockDef.headingMatch}" found but no "${gridSel}" inside`);
          }
        } else {
          console.warn(`Block "${blockDef.name}": no wrapper with heading "${blockDef.headingMatch}"`);
        }
        return;
      }
      if (blockDef.instances) {
        blockDef.instances.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) {
            console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
          }
          elements.forEach((el) => {
            pageBlocks.push({
              name: blockDef.name,
              selector,
              element: el,
              section: blockDef.section || null
            });
          });
        });
      }
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_car_insurance_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      let pathname = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "");
      if (!pathname) pathname = "/index";
      const path = WebImporter.FileUtils.sanitizePath(pathname);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_car_insurance_exports);
})();
