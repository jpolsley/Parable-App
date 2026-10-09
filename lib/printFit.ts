import { fitText } from './customPage';
// Each lesson section starts its own page, so a section a few lines too long leaves those lines
// stranded on an almost empty page. Just before printing, measure each section and shrink the
// ones that only slightly overflow so they fit their page (or pages). Long sections still flow normally.
// One-page sheets (session plan and overview, small group guide, family page) are fitted the same way.

const PX_PER_IN = 96;
const CONTENT_WIDTH = (8.5 - 0.65 * 2) * PX_PER_IN; // letter, side margins from @page
const CONTENT_HEIGHT = (11 - 0.6 - 0.7) * PX_PER_IN; // top and bottom margins from @page
const MAX_SHRINK = 0.82; // never smaller than this, so text stays comfortable to read
const MAX_SHRINK_SHEET = 0.76; // one-page sheets (small group guide, family page…) may shrink a little more than a flowing section: a few stranded lines on a second page look worse

export const fitSectionsToPages = (root: HTMLElement) => {
  const sections = [...root.querySelectorAll<HTMLElement>('.pr-flow > .pr-sec, .pr-overview, .pr-sg, .pr-plan, .pr-family')];
  const fitBoxes = root.querySelector('[data-fit]');
  if (!sections.length && !fitBoxes) return;
  const saved = root.getAttribute('style') ?? '';
  // The print view is hidden on screen; lay it out off-screen at page width to measure it.
  root.style.display = 'block';
  root.style.position = 'absolute';
  root.style.left = '-20000px';
  root.style.top = '0';
  root.style.width = `${CONTENT_WIDTH}px`;
  // Text in layout pages marked data-fit shrinks to fit its box (the page is laid out now, so it can be measured).
  fitText(root);
  for (const section of sections) {
    section.style.zoom = '';
    const height = section.getBoundingClientRect().height;
    // Pages it would fill if it were a little shorter: 1 for a section just over a page, 2 for just over two…
    const pages = Math.ceil(height / CONTENT_HEIGHT) - 1;
    if (pages < 1) continue;
    const scale = (CONTENT_HEIGHT * pages * 0.985) / height;
    const sheet = !section.matches('.pr-flow > .pr-sec');
    if (scale >= (sheet ? MAX_SHRINK_SHEET : MAX_SHRINK)) section.style.zoom = scale.toFixed(3);
  }
  root.setAttribute('style', saved);
};
