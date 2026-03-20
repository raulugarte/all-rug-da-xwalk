export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const imageRow = rows[0];
  const contentRow = rows[1];

  // Create image container (displayed normally, not as background)
  const img = imageRow.querySelector('img');
  if (img) {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'hero-banner-bg';
    bgContainer.append(img);
    block.prepend(bgContainer);
  }

  // Create content area with white card overlay
  const contentDiv = contentRow.querySelector('div > div') || contentRow.querySelector('div');
  if (contentDiv) {
    const content = document.createElement('div');
    content.className = 'hero-banner-content';

    const card = document.createElement('div');
    card.className = 'hero-banner-card';
    card.append(...contentDiv.childNodes);

    // Mark second button as secondary (outline style)
    const buttons = card.querySelectorAll('.button');
    if (buttons.length > 1) {
      buttons[1].classList.add('secondary');
    }

    content.append(card);
    block.append(content);
  }

  // Remove the original table rows
  rows.forEach((row) => row.remove());
}
