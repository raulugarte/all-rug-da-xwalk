export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length === 0) return;

  const row = rows[0];
  const cols = [...row.children];

  // Identify text and image columns
  cols.forEach((col) => {
    const img = col.querySelector('picture, img');
    const hasText = col.querySelector('h2, h3, p');
    if (img && !hasText) {
      col.classList.add('columns-awards-img-col');
    } else if (hasText) {
      col.classList.add('columns-awards-text-col');
    }
  });

  block.classList.add(`columns-awards-${cols.length}-cols`);
}
