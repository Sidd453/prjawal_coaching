// Dependency-free SVG charts (the site's security policy blocks external chart libraries).
import { esc, raw } from './ui.js';

export const PALETTE = ['var(--chart-green)', 'var(--chart-red)', 'var(--chart-amber)', 'var(--chart-blue)', 'var(--chart-purple)', 'var(--chart-slate)'];

export const short = (n) => {
  n = Number(n) || 0;
  const f = (v, s) => `${v.toFixed(v >= 10 || Number.isInteger(v) ? 0 : 1).replace(/\.0$/, '')}${s}`;
  if (n >= 1e7) return '\u20B9' + f(n / 1e7, 'Cr');
  if (n >= 1e5) return '\u20B9' + f(n / 1e5, 'L');
  if (n >= 1e3) return '\u20B9' + f(n / 1e3, 'k');
  return '\u20B9' + n;
};

const niceTop = (max) => {
  const m = Math.pow(10, Math.floor(Math.log10(Math.max(max, 1))));
  const n = max / m;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * m;
};

// Smooth area + line chart. points: [{ label, value }]
export const areaChart = (points, { format = short } = {}) => {
  const W = 620, H = 250, pad = { l: 52, r: 18, t: 26, b: 34 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b, base = pad.t + ih;
  const top = niceTop(Math.max(...points.map((p) => p.value), 1));
  const x = (i) => pad.l + (points.length === 1 ? iw / 2 : (iw * i) / (points.length - 1));
  const y = (v) => base - (v / top) * ih;
  const xy = points.map((p, i) => [x(i), y(p.value)]);

  let line = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2;
    const cl = (v) => Math.min(base, Math.max(pad.t, v));
    line += ` C${p1[0] + (p2[0] - p0[0]) / 6},${cl(p1[1] + (p2[1] - p0[1]) / 6)} ${p2[0] - (p3[0] - p1[0]) / 6},${cl(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
  }
  const area = `${line} L${xy[xy.length - 1][0]},${base} L${xy[0][0]},${base} Z`;
  const grid = [0, 1, 2, 3, 4].map((i) => {
    const v = (top / 4) * i, gy = y(v);
    return `<line x1="${pad.l}" x2="${W - pad.r}" y1="${gy}" y2="${gy}" class="c-grid${i ? '' : ' base'}"/><text x="${pad.l - 10}" y="${gy + 4}" text-anchor="end" class="c-axis">${esc(format(v))}</text>`;
  }).join('');
  const dots = points.map((p, i) => `<g class="pt${i === points.length - 1 ? ' last' : ''}">
      <circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="16" fill="transparent"/><circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="5" class="dot"/>
      <text x="${xy[i][0]}" y="${xy[i][1] - 12}" text-anchor="middle" class="c-val">${p.value ? esc(format(p.value)) : ''}</text>
      <title>${esc(p.label)}: ${esc(p.full ?? format(p.value))}</title></g>`).join('');
  const labels = points.map((p, i) => `<text x="${xy[i][0]}" y="${H - 10}" text-anchor="middle" class="c-axis">${esc(p.label)}</text>`).join('');

  return raw(`<svg viewBox="0 0 ${W} ${H}" class="chart-svg area" role="img" aria-label="Fee collection trend">
    <defs><linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-opacity=".28"/><stop offset="1" stop-opacity="0"/></linearGradient></defs>
    ${grid}<path d="${area}" fill="url(#gArea)" class="c-area"/><path d="${line}" class="c-line" pathLength="1"/>${dots}${labels}</svg>`);
};

// Donut chart. segments: [{ label, value, color }]
export const donut = (segments, { big = '', small = '' } = {}) => {
  const R = 70, SW = 24, C = 2 * Math.PI * R, total = segments.reduce((s, g) => s + g.value, 0);
  let off = 0;
  const rings = total
    ? segments.filter((g) => g.value > 0).map((g) => {
        const len = (g.value / total) * C, gap = segments.filter((s) => s.value > 0).length > 1 ? 3 : 0;
        const el = `<circle cx="100" cy="100" r="${R}" fill="none" style="stroke:${g.color}" stroke-width="${SW}" stroke-dasharray="${Math.max(len - gap, 0.1)} ${C}" stroke-dashoffset="${-off}" class="seg"><title>${esc(g.label)}: ${g.value} (${Math.round((g.value / total) * 100)}%)</title></circle>`;
        off += len;
        return el;
      }).join('')
    : '';
  return raw(`<svg viewBox="0 0 200 200" class="chart-svg donut" role="img" aria-label="${esc(small)}">
    <circle cx="100" cy="100" r="${R}" fill="none" class="d-track" stroke-width="${SW}"/>
    <g transform="rotate(-90 100 100)">${rings}</g>
    <text x="100" y="${small ? 102 : 110}" text-anchor="middle" class="d-big">${esc(big)}</text>
    ${small ? `<text x="100" y="124" text-anchor="middle" class="d-small">${esc(small)}</text>` : ''}</svg>`);
};

export const legend = (segments, fmt = (v) => v) => {
  const total = segments.reduce((s, g) => s + g.value, 0);
  return raw(`<ul class="legend">${segments.map((g) => `<li><i style="background:${g.color}"></i><span>${esc(g.label)}</span><b class="num">${esc(fmt(g.value))}</b><em>${total ? Math.round((g.value / total) * 100) : 0}%</em></li>`).join('')}</ul>`);
};
