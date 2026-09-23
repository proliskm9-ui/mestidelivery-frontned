/**
 * PostCSS plugin: gate every client `:hover` rule behind
 * `@media (hover: hover) and (pointer: fine)`.
 *
 * Touch browsers fake :hover on tap and keep it until the next tap elsewhere,
 * so a card that lifts on hover stays lifted after being tapped. Mouse users
 * keep the exact same hover styles. Partner mini-app and admin CSS are skipped.
 */
const MEDIA = '(hover: hover) and (pointer: fine)';
const SKIP = /[\\/](PartnerApp|Admin)[\\/]|node_modules/;

function insideHoverMedia(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === 'atrule' && p.name === 'media' && /hover\s*:\s*hover/.test(p.params)) return true;
  }
  return false;
}

/** @type {import('postcss').PluginCreator} */
const hoverGate = () => ({
  postcssPlugin: 'mesti-hover-gate',
  Once(root, { result, AtRule }) {
    const from = (result.opts && result.opts.from) || '';
    if (SKIP.test(from)) return;

    root.walkRules((rule) => {
      if (!rule.selector || !rule.selector.includes(':hover')) return;
      if (rule.parent && rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
      if (insideHoverMedia(rule)) return;

      const hoverSelectors = rule.selectors.filter((s) => s.includes(':hover'));
      const otherSelectors = rule.selectors.filter((s) => !s.includes(':hover'));

      const gated = rule.clone({ selectors: hoverSelectors });
      const media = new AtRule({ name: 'media', params: MEDIA });
      media.append(gated);

      if (otherSelectors.length) {
        rule.selectors = otherSelectors;
        rule.after(media);
      } else {
        rule.replaceWith(media);
      }
    });
  },
});
hoverGate.postcss = true;

export default hoverGate;
