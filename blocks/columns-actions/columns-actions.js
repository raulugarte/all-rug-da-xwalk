export default function decorate(block) {
  // Each row is an action item: [icon | text+link]
  [...block.children].forEach((row) => {
    row.classList.add('columns-actions-item');
    const cols = [...row.children];
    if (cols.length >= 2) {
      cols[0].classList.add('columns-actions-icon');
      cols[1].classList.add('columns-actions-text');
    }
  });
}
