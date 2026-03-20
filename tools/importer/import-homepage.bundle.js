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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
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
      const h1 = document.createElement("h1");
      h1.textContent = "Allianz Insurance";
      contentCell.appendChild(h1);
      const subtitle = document.createElement("p");
      subtitle.textContent = "Care you can count on";
      contentCell.appendChild(subtitle);
      const cta1P = document.createElement("p");
      const cta1 = document.createElement("a");
      cta1.href = "#";
      cta1.textContent = "Get a quote";
      cta1P.appendChild(cta1);
      contentCell.appendChild(cta1P);
      const cta2P = document.createElement("p");
      const cta2 = document.createElement("a");
      cta2.href = "/my-allianz/renewals.html";
      cta2.textContent = "Renew now";
      cta2P.appendChild(cta2);
      contentCell.appendChild(cta2P);
      hasContent = true;
    }
    if (hasContent) {
      cells.push([contentCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  var KNOWN_CTAS = [
    { heading: "Home Insurance", cta: "Get a quote", href: "/home-insurance.html" },
    { heading: "Car Insurance", cta: "Get a quote", href: "/car-insurance.html" },
    { heading: "CTP Insurance", cta: "Select your state", href: "/ctp-insurance.html#select-state" }
  ];
  function parse2(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope .l-grid__row > .column");
    columns.forEach((col) => {
      const img = col.querySelector(".cmp-image img, picture img, .c-image__img");
      let imageCell = "";
      if (img) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:image "));
        const p = document.createElement("p");
        const newImg = document.createElement("img");
        newImg.src = img.src || img.getAttribute("src");
        newImg.alt = img.alt || "";
        p.appendChild(newImg);
        frag.appendChild(p);
        imageCell = frag;
      }
      const textFrag = document.createDocumentFragment();
      textFrag.appendChild(document.createComment(" field:text "));
      let hasText = false;
      const headingLink = col.querySelector(".c-link-list__headline a, h3 a");
      const headingText = headingLink ? headingLink.textContent.trim() : "";
      if (headingLink) {
        const h3 = document.createElement("h3");
        const a = document.createElement("a");
        a.href = headingLink.href || headingLink.getAttribute("href");
        a.textContent = headingText;
        h3.appendChild(a);
        textFrag.appendChild(h3);
        hasText = true;
      }
      const subLinks = col.querySelectorAll(".c-link-list__list a.c-link");
      if (subLinks.length > 0) {
        const ul = document.createElement("ul");
        subLinks.forEach((link) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.href = link.href || link.getAttribute("href");
          a.textContent = link.querySelector(".c-link__text") ? link.querySelector(".c-link__text").textContent.trim() : link.textContent.trim();
          li.appendChild(a);
          ul.appendChild(li);
        });
        textFrag.appendChild(ul);
        hasText = true;
      }
      let ctaFound = false;
      const cta = col.querySelector("a.c-button");
      if (cta) {
        const href = cta.href || cta.getAttribute("href") || "";
        if (!href.includes("einsure.com.au")) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = href;
          a.textContent = cta.textContent.trim();
          p.appendChild(a);
          textFrag.appendChild(p);
          ctaFound = true;
          hasText = true;
        }
      }
      if (!ctaFound && headingText) {
        const known = KNOWN_CTAS.find(
          (kc) => headingText.toLowerCase().includes(kc.heading.toLowerCase())
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
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse3(element, { document }) {
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

  // tools/importer/parsers/columns-awards.js
  function parse5(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope > div > .l-grid__row > .column");
    const row = [];
    if (columns.length > 0) {
      const col1 = columns[0];
      const col1Content = [];
      const heading = col1.querySelector("h2, .c-heading--section");
      if (heading) {
        const h2 = document.createElement("h2");
        h2.textContent = heading.textContent.trim();
        col1Content.push(h2);
      }
      const desc = col1.querySelector(".c-copy p, .text p");
      if (desc) {
        const p = document.createElement("p");
        p.textContent = desc.textContent.trim();
        col1Content.push(p);
      }
      const link = col1.querySelector(".link a.c-link");
      if (link) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = link.href || link.getAttribute("href");
        a.textContent = link.querySelector(".c-link__text") ? link.querySelector(".c-link__text").textContent.trim() : link.textContent.trim();
        p.appendChild(a);
        col1Content.push(p);
      }
      row.push(col1Content.length > 0 ? col1Content : "");
    }
    if (columns.length > 1) {
      const col2 = columns[1];
      const img = col2.querySelector(".cmp-image img, picture img, .c-image__img");
      row.push(img || "");
    }
    if (row.length > 0) {
      cells.push(row);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-awards", cells });
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

  // tools/importer/parsers/columns-partner.js
  function parse7(element, { document }) {
    const cells = [];
    const columns = element.querySelectorAll(":scope > div > .l-grid__row > .column, :scope .multi-grid-columnLayout-sameHeights > .l-grid__row > .column");
    const row = [];
    if (columns.length > 0) {
      const col1 = columns[0];
      const img = col1.querySelector(".cmp-image img, picture img, .c-image__img");
      row.push(img || "");
    }
    if (columns.length > 1) {
      const col2 = columns[1];
      const textEl = col2.querySelector(".c-copy p, .text p");
      if (textEl) {
        const p = document.createElement("p");
        p.textContent = textEl.textContent.trim();
        row.push(p);
      } else {
        row.push("");
      }
    }
    if (row.length > 0) {
      cells.push(row);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-partner", cells });
    element.replaceWith(block);
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

  // tools/importer/import-homepage.js
  if (typeof globalThis !== "undefined") {
    if (!globalThis.process) globalThis.process = {};
    if (typeof globalThis.process.cwd !== "function") {
      globalThis.process.cwd = () => "/";
    }
  }
  var parsers = {
    "hero-banner": parse,
    "cards-product": parse2,
    "cards-article": parse3,
    "columns-actions": parse4,
    "columns-awards": parse5,
    "columns-features": parse6,
    "columns-partner": parse7
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Allianz Australia homepage with insurance product offerings, promotions, and quick links",
    urls: [
      "https://www.allianz.com.au"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: [".parsys > .a1stage"]
      },
      {
        name: "cards-product",
        headingMatch: "Insurance with Allianz",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-actions",
        headingMatch: "Already an Allianz customer",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-awards",
        headingMatch: "award-winning insurer",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-features",
        headingMatch: "What care looks like",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "cards-article",
        headingMatch: "Let us help you",
        gridSelector: ".multi-column-grid"
      },
      {
        name: "columns-partner",
        headingMatch: "Olympic",
        gridSelector: ".multi-column-grid"
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
        id: "section-2-products",
        name: "Insurance Products",
        headingMatch: "Insurance with Allianz",
        style: null,
        blocks: ["cards-product"],
        defaultContent: ["h2.c-heading", "div.text .c-copy"]
      },
      {
        id: "section-3-customer",
        name: "Existing Customer Actions",
        headingMatch: "Already an Allianz customer",
        style: "dark-blue",
        blocks: ["columns-actions"],
        defaultContent: []
      },
      {
        id: "section-4-awards",
        name: "Awards Section",
        headingMatch: "award-winning insurer",
        style: null,
        blocks: ["columns-awards"],
        defaultContent: []
      },
      {
        id: "section-5-care",
        name: "What Care Looks Like",
        headingMatch: "What care looks like",
        style: "light-grey",
        blocks: ["columns-features"],
        defaultContent: ["h2.c-heading"]
      },
      {
        id: "section-6-articles",
        name: "Help Articles",
        headingMatch: "Let us help you",
        style: null,
        blocks: ["cards-article"],
        defaultContent: ["h2.c-heading", "div.text .c-copy", "div.link"]
      },
      {
        id: "section-8-hardship",
        name: "Financial Hardship Support",
        headingMatch: "Financial hardship",
        style: "light-blue",
        blocks: [],
        defaultContent: ["h2.c-heading", "div.text .c-copy", "div.link"]
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
            pageBlocks.push({
              name: blockDef.name,
              selector: `heading:"${blockDef.headingMatch}" ${gridSel}`,
              element: grids[0],
              section: blockDef.section || null
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
  var import_homepage_default = {
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
  return __toCommonJS(import_homepage_exports);
})();
