export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Row 0 contains the image, Row 1 contains the text content
  const imageRow = rows[0];
  const contentRow = rows[1];

  // Extract the image and wrap in a picture-like container for background positioning
  const img = imageRow.querySelector('img');
  if (img) {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'hero-banner-bg';
    bgContainer.append(img);
    block.prepend(bgContainer);
  }

  // Promote text content to direct child
  const contentDiv = contentRow.querySelector('div > div') || contentRow.querySelector('div');
  if (contentDiv) {
    const overlay = document.createElement('div');
    overlay.className = 'hero-banner-content';
    overlay.append(...contentDiv.childNodes);
    block.append(overlay);
  }

  // Remove the original table rows
  rows.forEach((row) => row.remove());
}
