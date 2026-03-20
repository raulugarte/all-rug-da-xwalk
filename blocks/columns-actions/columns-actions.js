export default function decorate(block) {
  // Strip EDS auto-button classes so section theme colours apply
  block.querySelectorAll('.button').forEach((btn) => {
    btn.classList.remove('button');
    const container = btn.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });

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
