import * as S from '../store.js';
import { esc, grouped, short, pct } from '../format.js';
import { icon, money, dot, progressBar, unitThumb, emptyState } from './components.js';

export function homeView(ctx) {
  const { t, lang } = ctx;
  const units = S.unitsSorted();
  const grand = S.grandTotal();
  const week = S.rangeTotal('week');
  const month = S.rangeTotal('month');

  const header = `
    <div class="between" style="align-items:flex-start;padding-top:6px">
      <div>
        <div class="micro" style="letter-spacing:.14em;margin-bottom:5px">${esc(t('siteLog'))}</div>
        <div class="serif" style="font-size:25px;line-height:1.05">${esc(t('greeting'))}</div>
      </div>
      <button class="chip" data-act="toggle-lang">${lang === 'ar' ? 'EN' : 'عربي'}</button>
    </div>`;

  if (!units.length) {
    return `<div class="stack gap18">
      ${header}
      ${ctx.installBanner || ''}
      ${emptyState({
        iconHtml: icon.building(40),
        title: t('noUnitsTitle'),
        body: t('noUnitsBody'),
        actions: `
          <button class="btn-primary" data-act="new-unit">${icon.plus(18)}${esc(t('addFirstUnit'))}</button>
          <button class="link-btn" style="margin-top:16px;color:var(--fg3)" data-act="load-sample">${esc(t('loadSample'))}</button>`,
      })}
    </div>`;
  }

  const heroSub = lang === 'ar'
    ? `${t('across')} ${units.length} ${t('activeUnits')} · ${grouped(week)} EGP ${t('thisWeekLower')}`
    : `Across ${units.length} units · ${grouped(week)} EGP this week`;

  return `<div class="stack gap18">
    ${header}
    ${ctx.installBanner || ''}

    <div class="home-top">
      <div class="hero">
        <div class="micro" style="letter-spacing:.12em;margin-bottom:8px">${esc(t('totalSpent'))}</div>
        ${money(grand, { lang })}
        <div class="hero-sub">${esc(heroSub)}</div>
      </div>

      <div class="tiles">
        <div class="tile"><div class="micro" style="letter-spacing:.06em;font-size:9.5px">${esc(t('thisWeek'))}</div><div class="val">${esc(short(week))}</div></div>
        <div class="tile"><div class="micro" style="letter-spacing:.06em;font-size:9.5px">${esc(t('thisMonth'))}</div><div class="val">${esc(short(month))}</div></div>
        <div class="tile"><div class="micro" style="letter-spacing:.06em;font-size:9.5px">${esc(t('activeUnits'))}</div><div class="val accent">${units.length}</div></div>
      </div>
    </div>

    <div class="between" style="align-items:baseline;margin-top:2px">
      <h2 class="section">${esc(t('units'))}</h2>
      <button class="link-btn" data-act="new-unit">${icon.plus(14)}${esc(t('newUnit'))}</button>
    </div>

    <div class="card-grid">
      ${units.map((u) => unitCard(u, ctx)).join('')}
    </div>
  </div>`;
}

function unitCard(unit, { t, lang }) {
  const total = S.unitTotal(unit.id);
  const count = S.S.expenses.filter((e) => e.unitId === unit.id).length;
  const cats = S.categoriesOf(unit.id);
  const frac = S.budgetFraction(unit);
  const over = frac !== null && frac > 1;

  const budgetLabel = frac === null
    ? t('noBudget')
    : over
      ? `${t('over')} ${Math.round(frac * 100)}%`
      : `${Math.round(frac * 100)}% ${t('ofBudget')}`;

  return `<button class="unit-card" data-act="open-unit" data-id="${esc(unit.id)}">
    <div class="unit-top">
      ${unitThumb(unit)}
      <div class="grow">
        <div class="unit-name ellipsis">${esc(unit.name)}</div>
        <div class="unit-client ellipsis">${esc(unit.clientName || '—')}</div>
      </div>
      <div style="text-align:end">
        <div class="unit-total">${grouped(total, lang)}<span class="sfx">EGP</span></div>
        <div class="unit-count">${count} ${esc(t('entries'))}</div>
      </div>
    </div>
    <div class="hairline"></div>
    <div class="unit-bottom">
      <div class="row gap6">
        ${cats.slice(0, 5).map((c) => dot(c.colorHex)).join('')}
        <span style="font-size:11px;color:var(--fg3);margin-inline-start:4px">${cats.length} ${esc(t('categoriesCount'))}</span>
      </div>
      <div class="stack" style="flex:1;max-width:120px;align-items:flex-end;gap:4px">
        ${progressBar(frac || 0, { thin: true, over })}
        <span class="budget-label">${esc(budgetLabel)}</span>
      </div>
    </div>
  </button>`;
}
