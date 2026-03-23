import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const imageRow = rows[0];
  const contentRow = rows[1];

  // Bild/Quelle finden (picture bevorzugen, sonst img)
  const picture = imageRow.querySelector('picture');
  const img = imageRow.querySelector('img');

  if (picture || img) {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'hero-banner-bg';

    if (picture) {
      // Falls die Pipeline schon ein optimiertes <picture> erzeugt hat, einfach übernehmen
      bgContainer.append(picture);
    } else if (img) {
      // Aus einem nackten <img> ein optimiertes <picture> erzeugen
      const src = img.getAttribute('src');
      const alt = img.getAttribute('alt') || '';

      // Query-Parameter (z.B. ?width=750) werden in createOptimizedPicture
      // automatisch verworfen, da nur pathname verwendet wird.
      const optimizedPicture = createOptimizedPicture(
        src,
        alt,
        true, // eager für Hero
        [
          { media: '(min-width: 900px)', width: '2000' }, // Desktop-Hero
          { width: '750' },                               // Mobile/Fallback
        ],
      );

      bgContainer.append(optimizedPicture);
    }

    block.prepend(bgContainer);
  }

  // Content-Bereich mit Card aufbauen (unverändert)
  const contentDiv = contentRow.querySelector('div > div') || contentRow.querySelector('div');
  if (contentDiv) {
    const content = document.createElement('div');
    content.className = 'hero-banner-content';

    const card = document.createElement('div');
    card.className = 'hero-banner-card';
    card.append(...contentDiv.childNodes);

    const buttons = card.querySelectorAll('.button');
    if (buttons.length > 1) {
      buttons[1].classList.add('secondary');
    }

    content.append(card);
    block.append(content);
  }

  // Ursprüngliche Tabellenzeilen entfernen
  rows.forEach((row) => row.remove());
}
