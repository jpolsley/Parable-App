// Cover and divider pages Diana writes as HTML and inline SVG. Before anything is stored or shown,
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

// Pull the HTML out of a model reply (it may wrap it in a code fence or add a sentence).
export const extractHtml = (text: string) => {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('<');
  const end = body.lastIndexOf('>');
  return start >= 0 && end > start ? body.slice(start, end + 1) : '';
};
