function renderArticle(block, article, cfg) {
  const { displayStyle, alignment, path, variation } = cfg;

  // Clear original text lines
  block.innerHTML = '';
  block.classList.add('content-fragment');

  if (displayStyle) block.classList.add(displayStyle);
  if (alignment) block.classList.add(alignment);

  // 1) Build CF URN for this variation
  // Requires <meta name="urn:adobe:aue:system:aemconnection" ...> in the HTML head
  const cfUrn = `urn:aemconnection:${path}/jcr:content/data/${variation}`;

  // 2) Top-level wrapper: mark as CF reference
  const wrapper = document.createElement('div');
  wrapper.className = 'content-fragment-inner';
  wrapper.setAttribute('data-aue-resource', cfUrn);
  wrapper.setAttribute('data-aue-type', 'reference');
  wrapper.setAttribute('data-aue-label', article.headline || 'Article');

  const media = document.createElement('div');
  media.className = 'content-fragment-media';

  const body = document.createElement('div');
  body.className = 'content-fragment-body';

  // 3) Hero image – make CF image field editable
  if (article.heroImage?._dynamicUrl || article.heroImage?._publishUrl) {
    const img = document.createElement('img');
    img.className = 'content-fragment-image';
    img.src = article.heroImage._dynamicUrl || article.heroImage._publishUrl;
    img.alt = article.headline || '';

    // UE instrumentation
    img.setAttribute('data-aue-prop', 'heroImage');
    img.setAttribute('data-aue-type', 'media');

    media.appendChild(img);
  }

  // 4) Headline – editable text field
  if (article.headline) {
    const h2 = document.createElement('h2');
    h2.className = 'content-fragment-headline';
    h2.textContent = article.headline;

    // UE instrumentation
    h2.setAttribute('data-aue-prop', 'headline');
    h2.setAttribute('data-aue-type', 'text');

    body.appendChild(h2);
  }

  // 5) Main body – editable rich text field
  if (article.main) {
    const mainEl = document.createElement('div');
    mainEl.className = 'content-fragment-main';

    if (article.main.html) {
      mainEl.innerHTML = article.main.html;
    } else if (article.main.markdown) {
      mainEl.textContent = article.main.markdown;
    } else if (article.main.plaintext) {
      mainEl.textContent = article.main.plaintext;
    } else if (article.main.json) {
      mainEl.textContent = JSON.stringify(article.main.json);
    }

    // UE instrumentation
    mainEl.setAttribute('data-aue-prop', 'main');
    mainEl.setAttribute('data-aue-type', 'richtext');

    body.appendChild(mainEl);
  }

  wrapper.append(media, body);
  block.appendChild(wrapper);
}
