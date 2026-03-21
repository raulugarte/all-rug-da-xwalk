import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-cover-card-image';
      else div.className = 'cards-cover-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  // Style checklist icons: wrap leading ✓/✗ in spans
  ul.querySelectorAll('.cards-cover-card-body ul li').forEach((li) => {
    const text = li.textContent;
    if (text.startsWith('✓')) {
      li.classList.add('check-included');
      li.innerHTML = `<span class="check-icon">${text.charAt(0)}</span>${text.slice(1).trim()}`;
    } else if (text.startsWith('✗')) {
      li.classList.add('check-excluded');
      li.innerHTML = `<span class="check-icon">${text.charAt(0)}</span>${text.slice(1).trim()}`;
    }
  });

  block.textContent = '';
  block.append(ul);
}
