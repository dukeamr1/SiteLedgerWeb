import * as S from '../store.js';
import { esc } from '../format.js';
import { suggestedFor } from '../i18n.js';
import { icon, subDot } from './components.js';

/**
 * New/edit unit screen. `d` is the working draft held in app state:
 *   { id, name, clientName, budgetText, cats: [{key, existingId, name, colorHex,
 *     expenseCount, subs:[{key, existingId, name, expenseCount}], newSub,
 *     subsOpen}], newCat, recolorKey }
 */
export function unitEditView(ctx, d) {
  const { t, lang } = ctx;
  const isNew = !d.id;

  return `<div class="stack gap18">
    <div class="between" style="padding-top:6px">
      <button style="font-size:14px;font-weight:500;color:var(--fg2)" data-act="cancel-edit">${esc(t('cancel'))}</button>
      <span class="sheet-title">${esc(isNew ? t('newUnitTitle') : t('editUnitTitle'))}</span>
      <button style="font-size:14px;font-weight:700;color:var(--money)" data-act="save-unit">${esc(t('saveShort'))}</button>
    </div>

    <div>
      <label class="field-label">${esc(t('unitName'))}</label>
      <div class="field"><input data-field="name" value="${esc(d.name)}" placeholder="${esc(t('unitNamePh'))}" autocomplete="off"></div>
    </div>

    <div>
      <label class="field-label">${esc(t('clientName'))}</label>
      <div class="field"><input data-field="clientName" value="${esc(d.clientName)}" placeholder="${esc(t('clientNamePh'))}" autocomplete="off"></div>
    </div>

    <div>
      <label class="field-label">${esc(t('budgetOpt'))}</label>
      <div class="field">
        <input data-field="budgetText" value="${esc(d.budgetText)}" placeholder="0" inputmode="numeric" class="tabular" style="font-weight:600">
        <span class="suffix">EGP</span>
      </div>
    </div>

    <div>
      <label class="field-label" style="margin-bottom:10px">${esc(t('categories'))}</label>
      <div class="stack gap8">
        ${d.cats.map((c) => categoryRow(c, d, ctx)).join('')}
      </div>

      <div class="micro mt16 mb10" style="letter-spacing:.08em;font-size:10.5px">${esc(t('suggested'))}</div>
      <div class="chips">
        ${suggestions(d, lang).map((name) => `
          <button class="chip add" data-act="add-suggested" data-name="${esc(name)}">${icon.plus(13)}${esc(name)}</button>
        `).join('')}
      </div>

      <div class="add-cat">
        <input data-field="newCat" value="${esc(d.newCat)}" placeholder="${esc(t('addCategory'))}" autocomplete="off" data-enter="add-cat">
        <button data-act="add-cat" aria-label="${esc(t('addCategory'))}">${icon.plus(20)}</button>
      </div>
      ${hint(d, t)}
    </div>

    ${!isNew ? `
      <div class="stack gap10 mt10">
        <button class="btn-soft" data-act="toggle-status">${esc(statusLabel(d, t))}</button>
        <button class="btn-danger" data-act="delete-unit">${esc(t('deleteUnit'))}</button>
      </div>` : ''}
  </div>`;
}

function statusLabel(d, t) {
  const unit = d.id ? S.unitById(d.id) : null;
  return unit && unit.status === 'done' ? t('markActive') : t('markDone');
}

function suggestions(d, lang) {
  const existing = new Set(d.cats.map((c) => c.name.trim().toLowerCase()));
  return suggestedFor(lang).filter((n) => !existing.has(n.toLowerCase()));
}

function hint(d, t) {
  const matches = S.categoryNamesElsewhere(d.newCat, d.id);
  if (!matches.length) return '';
  return `<div class="mt10" style="font-size:11.5px;color:var(--fg3)">
    ${esc(t('alreadyUsedHint'))} <b style="color:var(--money)">${esc(matches.join(', '))}</b>
  </div>`;
}

function categoryRow(c, d, ctx) {
  const { t } = ctx;
  const recoloring = d.recolorKey === c.key;

  return `<div class="cat-editor">
    <div class="cat-head">
      <button class="cat-swatch" style="background:${esc(c.colorHex)}" data-act="toggle-recolor" data-key="${esc(c.key)}" aria-label="Color"></button>
      <input class="cat-name" data-field="cat-name" data-key="${esc(c.key)}" value="${esc(c.name)}" autocomplete="off">
      <button class="mini-btn subs${c.subsOpen ? ' on' : ''}" data-act="toggle-subs" data-key="${esc(c.key)}" aria-label="${esc(t('subcategories'))}">
        ${icon.list(13)}${c.subs.length ? `<b>${c.subs.length}</b>` : ''}
      </button>
      <button class="mini-btn" data-act="move-cat" data-key="${esc(c.key)}" data-dir="-1" aria-label="Up">${icon.up(16)}</button>
      <button class="mini-btn" data-act="move-cat" data-key="${esc(c.key)}" data-dir="1" aria-label="Down">${icon.down(16)}</button>
      <button class="mini-btn danger" data-act="remove-cat" data-key="${esc(c.key)}" aria-label="${esc(t('delete'))}">${icon.trash(15)}</button>
    </div>

    ${recoloring ? `
      <div class="palette">
        ${S.PALETTE.map((hex) => `
          <button class="swatch${hex === c.colorHex ? ' on' : ''}" style="background:${hex};color:${hex}"
            data-act="pick-color" data-key="${esc(c.key)}" data-color="${esc(hex)}" aria-label="${hex}"></button>
        `).join('')}
      </div>` : ''}

    ${c.subsOpen ? `
      <div class="subs-section">
        ${c.subs.map((s) => `
          <div class="sub-row">
            ${subDot(c.colorHex, 12)}
            <input data-field="sub-name" data-key="${esc(c.key)}" data-sub="${esc(s.key)}" value="${esc(s.name)}" autocomplete="off">
            <button class="mini-btn" style="width:26px;height:26px" data-act="move-sub" data-key="${esc(c.key)}" data-sub="${esc(s.key)}" data-dir="-1" aria-label="Up">${icon.up(14)}</button>
            <button class="mini-btn" style="width:26px;height:26px" data-act="move-sub" data-key="${esc(c.key)}" data-sub="${esc(s.key)}" data-dir="1" aria-label="Down">${icon.down(14)}</button>
            <button class="mini-btn danger" style="width:26px;height:26px" data-act="remove-sub" data-key="${esc(c.key)}" data-sub="${esc(s.key)}" aria-label="${esc(t('delete'))}">${icon.close(13)}</button>
          </div>`).join('')}
        <div class="sub-add">
          <input data-field="new-sub" data-key="${esc(c.key)}" value="${esc(c.newSub || '')}"
                 placeholder="${esc(t('addSubcategory'))}" autocomplete="off" data-enter="add-sub">
          <button data-act="add-sub" data-key="${esc(c.key)}" aria-label="${esc(t('addSubcategory'))}">${icon.plus(15)}</button>
        </div>
      </div>` : ''}
  </div>`;
}
