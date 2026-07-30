import * as S from '../store.js';
import { esc, grouped, dateLabel, longDate, isWithin, pct } from '../format.js';
import { icon } from './components.js';

/**
 * Shareable payment statement for a unit. Sharing uses the Web Share API when
 * available (falls back to WhatsApp / clipboard), plus Print → Save as PDF, so
 * it needs no external libraries and works offline.
 */
export function statementSheet(ctx, unitId, range) {
  const { t } = ctx;
  const unit = S.unitById(unitId);
  if (!unit) return '';

  return `<div class="scrim no-print" data-act="close-sheet"></div>
    <div class="sheet sheet-full" role="dialog" aria-modal="true" aria-label="${esc(t('shareStatement'))}">
      <div class="sheet-grab no-print"></div>
      <div class="sheet-head no-print">
        <span class="sheet-title">${esc(t('shareStatement'))}</span>
        <button class="icon-btn sm" data-act="close-sheet" aria-label="Close">${icon.close(16)}</button>
      </div>
      <div style="padding:12px 20px 8px;flex-shrink:0" class="no-print">
        <div class="segmented">
          <button class="${range === 'all' ? 'active' : ''}" data-act="stmt-range" data-range="all">${esc(t('allTime'))}</button>
          <button class="${range === 'month' ? 'active' : ''}" data-act="stmt-range" data-range="month">${esc(t('monthOnly'))}</button>
        </div>
      </div>

      <div class="sheet-body" id="stmt-scroll">
        ${statementCard(ctx, unit, range)}
      </div>

      <div class="qa-actions no-print">
        <button class="qa-save" data-act="share-statement">${icon.share(16)} ${esc(t('shareNow'))}</button>
        <button class="qa-add" data-act="print-statement" aria-label="${esc(t('printPdf'))}">${icon.print(19)}</button>
        <button class="qa-add" data-act="copy-statement" aria-label="${esc(t('copyText'))}">${icon.copy(19)}</button>
      </div>
    </div>`;
}

export function statementPayments(unitId, range) {
  const all = S.expensesOf(unitId);
  return range === 'month' ? all.filter((e) => isWithin(e.date, 'month')) : all;
}

function statementCard(ctx, unit, range) {
  const { t, lang } = ctx;
  const payments = statementPayments(unit.id, range);
  const total = S.sum(payments);

  // Category rollup (subcategory spend rolls up into its parent).
  const buckets = new Map();
  for (const e of payments) {
    const cat = e.categoryId ? S.categoryById(e.categoryId) : null;
    const key = e.categoryId || '_';
    if (!buckets.has(key)) {
      buckets.set(key, { name: cat ? cat.name : t('uncategorized'), color: cat ? cat.colorHex : S.UNCATEGORIZED_HEX, amount: 0 });
    }
    buckets.get(key).amount += e.amount;
  }
  const cats = [...buckets.values()].sort((a, b) => b.amount - a.amount);

  return `<div class="stmt" id="statement-card">
    <div class="stmt-head">
      <div class="stmt-brand">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="stmt-logo">S</span>
          <span class="stmt-wordmark">Site Ledger</span>
        </div>
        <span class="stmt-kind">${esc(t('paymentStatement'))}</span>
      </div>
      <div class="stmt-unit">${esc(unit.name)}</div>
      <div class="stmt-meta">${esc(unit.clientName || '—')}${unit.address ? ' · ' + esc(unit.address) : ''}</div>
    </div>

    <div class="stmt-body">
      <div style="font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#9CA3AF;margin-bottom:6px">
        ${esc(range === 'month' ? t('monthOnly') : t('totalSpent'))}
      </div>
      <div style="display:flex;align-items:baseline;gap:6px">
        <span class="stmt-total">${grouped(total, lang)}</span>
        <span style="font-size:14px;font-weight:600;color:#0F766E;opacity:.6">EGP</span>
      </div>
      ${unit.budget ? `<div style="font-size:11px;font-weight:500;color:#6B7280;margin-top:6px">
        ${grouped(S.unitTotal(unit.id), lang)} / ${grouped(unit.budget, lang)} EGP · ${pct(S.unitTotal(unit.id), unit.budget)}% ${esc(t('ofBudget'))}
      </div>` : ''}

      <div class="stmt-divider"></div>

      ${cats.map((c) => `
        <div class="stmt-row">
          <span style="width:10px;height:10px;border-radius:999px;background:${esc(c.color)};flex-shrink:0"></span>
          <span style="flex:1;font-size:12px;font-weight:500">${esc(c.name)}</span>
          <span style="font-size:12px;font-weight:700;font-variant-numeric:tabular-nums">${grouped(c.amount, lang)}</span>
          <span style="font-size:10.5px;color:#9CA3AF;width:34px;text-align:end">${pct(c.amount, total)}%</span>
        </div>`).join('')}

      <div class="stmt-divider"></div>

      ${payments.map((e) => {
        const cat = e.categoryId ? S.categoryById(e.categoryId) : null;
        const sub = e.subcategoryId ? S.subcategoryById(e.subcategoryId) : null;
        const worker = e.workerId ? S.workerById(e.workerId) : null;
        const bits = [sub && sub.name, worker && worker.name, e.note].filter(Boolean);
        const line = bits.length ? bits.join(' · ') : (e.method === 'transfer' ? t('transfer') : t('cash'));
        return `<div class="stmt-row">
          <span style="width:4px;align-self:stretch;min-height:30px;border-radius:999px;flex-shrink:0;background:${esc(cat ? cat.colorHex : S.UNCATEGORIZED_HEX)}"></span>
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:12.5px;font-weight:600">${esc(cat ? cat.name : t('uncategorized'))}</span>
            <span style="display:block;font-size:10.5px;color:#9CA3AF" class="ellipsis">${esc(line)}</span>
          </span>
          <span style="text-align:end">
            <span style="display:block;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums">${grouped(e.amount, lang)}</span>
            <span style="display:block;font-size:10px;color:#9CA3AF">${esc(dateLabel(e.date, t, lang))}</span>
          </span>
        </div>`;
      }).join('')}

      <div class="stmt-foot">
        ${lang === 'ar' ? `أُنشئ في ${esc(longDate(Date.now(), lang))} · Site Ledger`
                        : `Generated ${esc(longDate(Date.now(), lang))} · Site Ledger`}
      </div>
    </div>
  </div>`;
}

/** Plain-text summary used for Web Share / WhatsApp / clipboard. */
export function statementSummary(ctx, unitId, range) {
  const { t, lang } = ctx;
  const unit = S.unitById(unitId);
  if (!unit) return '';
  const payments = statementPayments(unitId, range);
  const total = S.sum(payments);
  const client = unit.clientName || '—';

  if (lang === 'ar') {
    return `كشف مدفوعات — ${unit.name}\nالعميل: ${client}\nالإجمالي: ${grouped(total, lang)} EGP (${payments.length} دفعة)\n— Site Ledger`;
  }
  return `Payment statement — ${unit.name}\nClient: ${client}\nTotal: ${grouped(total, lang)} EGP (${payments.length} payments)\n— Site Ledger`;
}
