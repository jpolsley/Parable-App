// Cover and divider pages from layout files, as HTML and inline SVG. Before anything is stored or shown,
// it goes through an allow-list: only layout and drawing elements, only presentational attributes,
// no scripts, links, images, outside files or event handlers. Text arrives through placeholders.

const MAX_LENGTH = 40000;

const HTML_TAGS = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'b', 'strong', 'i', 'em', 'br', 'small'];
const SVG_TAGS = ['svg', 'g', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'text', 'tspan', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clippath', 'mask', 'pattern'];
const ALLOWED = new Set([...HTML_TAGS, ...SVG_TAGS]);

const ATTRS = new Set([
  'style', 'class', 'id', 'viewbox', 'preserveaspectratio', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height',
  'd', 'points', 'transform', 'fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'offset',
  'stop-color', 'stop-opacity', 'clip-path', 'mask', 'patternunits', 'gradientunits', 'gradienttransform', 'dx', 'dy', 'rotate', 'xmlns',
  'data-fit', // "shrink this box's text until it fits" (see fitText)
]);

// Only same-page references like url(#stripes) survive; anything that could load or run something is dropped.
const safeValue = (v: string) => !/(javascript:|expression\s*\(|@import|behavior\s*:|-moz-binding)/i.test(v) && !/url\(\s*['"]?(?!#)/i.test(v);
const safeStyle = (v: string) => (safeValue(v) ? v.replace(/position\s*:\s*fixed/gi, 'position:absolute') : '');

export const sanitizeCustom = (html: unknown): string => {
  if (typeof html !== 'string' || !html.trim() || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<body>${html.slice(0, MAX_LENGTH)}</body>`, 'text/html');
  const clean = (el: Element) => {
    for (const child of [...el.children]) {
      if (!ALLOWED.has(child.tagName.toLowerCase())) {
        child.remove();
        continue;
      }
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase();
        if (!ATTRS.has(name) || name.startsWith('on')) child.removeAttribute(attr.name);
        else if (name === 'style') child.setAttribute('style', safeStyle(attr.value));
        // A blocked paint becomes "none": just removing it would default SVG shapes to solid black.
        else if (!safeValue(attr.value)) {
          if (name === 'fill' || name === 'stroke') child.setAttribute(attr.name, 'none');
          else child.removeAttribute(attr.name);
        }
      }
      clean(child);
    }
  };
  clean(doc.body);
  return doc.body.innerHTML.trim();
};

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Put the series' real text where Diana left {{placeholders}}.
export const fillCustom = (html: string, values: Record<string, string>) =>
  html.replace(/\{\{\s*([a-z]+)\s*\}\}/gi, (_, key: string) => escape(values[key.toLowerCase()] ?? ''));

// ---------- Layout CSS ----------
// A layout file may restyle any page. Its CSS is limited to plain rules (no @import, @font-face or other
// at-rules, no outside urls) and every selector is scoped to the book it is applied to.

export const scopeId = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `L${(h >>> 0).toString(36)}`;
};

export const sanitizeCss = (css: unknown): string => {
  if (typeof css !== 'string') return '';
  let text = css.slice(0, MAX_LENGTH).replace(/\/\*[\s\S]*?\*\//g, '');
  // Drop at-rules entirely (including nested blocks like @media { … }).
  for (let i = 0; i < 5 && /@[a-z-]+[^{;]*(\{(?:[^{}]|\{[^{}]*\})*\}|;)/i.test(text); i++) {
    text = text.replace(/@[a-z-]+[^{;]*(\{(?:[^{}]|\{[^{}]*\})*\}|;)/gi, '');
  }
  const rules: string[] = [];
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.includes(':') && safeValue(d))
      .map((d) => d.replace(/position\s*:\s*fixed/gi, 'position:absolute'));
    // '<' could close the <style> element; '>' is an ordinary child combinator and is fine.
    if (selector && decls.length && !selector.includes('<')) rules.push(`${selector} { ${decls.join('; ')} }`);
  }
  return rules.join('\n');
};

// Prefix every selector with the book's scope, so a layout can't touch the app around it.
export const scopeCss = (css: string, scope: string) =>
  css.replace(/([^{}]+)\{/g, (_, selectors: string) =>
    `${selectors.split(',').map((sel) => {
      const s = sel.trim().replace(/^(:root|html|body)\b/, '');
      return s ? `${scope} ${s}`.replace(`${scope} .pr `, `${scope} `) : scope;
    }).join(', ')} {`);

// Layout pages can't know how long a series title is, so a box marked data-fit shrinks its text
// (font-size, in steps) until nothing overflows the box. Runs on screen and right before printing.
export const fitText = (root: ParentNode) => {
  for (const box of root.querySelectorAll<HTMLElement>('[data-fit]')) {
    // Start from the layout's own size each time (remembered on the first run, since fitting overwrites it).
    if (box.dataset.fitBase === undefined) box.dataset.fitBase = box.style.fontSize;
    box.style.fontSize = box.dataset.fitBase;
    const start = parseFloat(getComputedStyle(box).fontSize) || 16;
    let size = start;
    // Overflow can go any direction (a bottom-aligned title spills off the top, which scroll sizes miss).
    // A box holding elements (a title in a wrapper) fits when those elements' boxes sit inside it; tight
    // display type always has some glyph overhang, so the text itself isn't measured there.
    // A box holding plain text fits when its lines don't run past it.
    const fits = () => {
      const b = box.getBoundingClientRect();
      const zoom = box.offsetHeight ? b.height / box.offsetHeight : 1;
      const kids = [...box.children];
      if (kids.length) {
        const t = 2 * zoom;
        return kids.every((k) => {
          const r = k.getBoundingClientRect();
          return r.top >= b.top - t && r.left >= b.left - t && r.bottom <= b.bottom + t && r.right <= b.right + t;
        });
      }
      const slack = 0.4 * size + 1;
      return box.scrollHeight <= box.clientHeight + slack && box.scrollWidth <= box.clientWidth + 1;
    };
    for (let i = 0; i < 40 && !fits() && size > start * 0.2; i++) {
      size *= 0.94;
      box.style.fontSize = `${size}px`;
    }
  }
};
