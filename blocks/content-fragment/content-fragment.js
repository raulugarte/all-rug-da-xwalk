/**
 * DEBUG VERSION: no GraphQL.
 *
 * Goal:
 * - Read the five lines UE writes into the block
 * - Apply Style + Alignment as CSS classes on the block
 * - Show the parsed config in the block so you can see what JS sees
 *
 * Expected raw block content (before JS runs):
 *
 * /content/dam/all-rug-da-xwalk/documents/allianz-offer   ← line 1 = path
 * testvar                                                 ← line 2 = variation (optional)
 * image-left                                              ← line 3 = style
 * text-left                                               ← line 4 = alignment
 * cta-link                                                ← line 5 = CTA style (optional)
 */

function getBlockConfig(block) {
  const lines = block.textContent
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Log raw lines so we can see exactly what the block contains
  console.log('contentfragment debug: raw lines', lines);

  if (!lines.length) {
    return {};
  }

  const path = lines[0] || null;
  const variation = lines.length > 1 ? lines[1] : null;
  const displayStyle = lines.length > 2 ? lines[2] : '';
  const alignment = lines.length > 3 ? lines[3] : '';
  const ctaStyle = lines.length > 4 ? lines[4] : '';

  const cfg = { path, variation, displayStyle, alignment, ctaStyle };
  console.log('contentfragment debug: parsed config', cfg);

  return cfg;
}

function renderDebug(block, cfg) {
  const { path, variation, displayStyle, alignment, ctaStyle } = cfg;

  // Clear original text lines
  block.innerHTML = '';

  // Base class so CSS can target this block
  block.classList.add('contentfragment-block');

  // Apply Style + Alignment classes on the block
  if (displayStyle) {
    block.classList.add(displayStyle); // e.g. image-left / image-right / ...
  }
  if (alignment) {
    block.classList.add(alignment); // e.g. text-left / text-right / text-center
  }

  // Simple debug rendering so you can see what JS thinks the config is
  const pre = document.createElement('pre');
  pre.className = 'contentfragment-debug';
  pre.textContent = `contentfragment config:
path:        ${path || '(none)'}
variation:   ${variation || '(none)'}
style:       ${displayStyle || '(none)'}
alignment:   ${alignment || '(none)'}
cta style:   ${ctaStyle || '(none)'}`;

  block.appendChild(pre);
}

// Block entry point
export default async function decorate(block) {
  const cfg = getBlockConfig(block);
  if (!cfg.path) {
    console.warn('contentfragment debug: no path found in block text');
    return;
  }
  renderDebug(block, cfg);
}
