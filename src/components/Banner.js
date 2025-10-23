import { el, icon } from '../app/ui.js';

export default function Banner({ onClick = () => {} } = {}) {
  const node = el('div', { class: 'banner', role: 'presentation' });
  node.append(
    el('strong', {}, 'Voucher Boost'),
    el('span', { class: 'deal-offer', style: 'font-size:2rem;font-weight:700;letter-spacing:-0.02em;' }, '$9,377'),
    el('small', {}, 'Trade in your device today and stack exclusive Revo vouchers.'),
    el('div', { class: 'chip' }, [icon('ticket', { size: 16, className: 'sm' }), '+20% Trade-In Bonus'])
  );
  const cta = el('button', { class: 'btn primary cta', type: 'button' }, ['Explore offers', icon('chevron-right', { size: 16, className: 'sm' })]);
  cta.addEventListener('click', onClick);
  node.appendChild(cta);
  return node;
}
