export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-info-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-info-img-col');
        }
      } else {
        const img = col.querySelector('img');
        if (img && col.children.length === 1) {
          col.classList.add('columns-info-img-col');
        }
      }
    });
  });
}
