import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Structure the bottom bar: wrap <ul> + last <p> (copyright) into a row
  const wrapper = footer.querySelector('.default-content-wrapper');
  if (wrapper) {
    const ul = wrapper.querySelector('ul');
    const allPs = wrapper.querySelectorAll('p');
    const lastP = allPs[allPs.length - 1];

    if (ul && lastP) {
      const bottomBar = document.createElement('div');
      bottomBar.className = 'footer-bottom-bar';
      bottomBar.append(lastP, ul);
      wrapper.append(bottomBar);
    }
  }

  block.append(footer);
}
