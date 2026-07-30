import * as S from '../store.js';
import { esc } from '../format.js';
import { icon } from './components.js';

/** The "⋯ More" sheet: new unit, language, appearance, reset, sample data. */
export function moreSheet(ctx) {
  const { t, lang } = ctx;
  const pref = S.S.themePref;

  return `<div class="scrim" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(t('more'))}">
      <div class="sheet-grab"></div>
      <div class="sheet-body" style="padding-top:4px">
        <button class="menu-item" data-act="new-unit">
          <span class="menu-icon teal">${icon.building(20)}</span>
          <span class="menu-label">${esc(t('newUnit'))}</span>
        </button>

        <button class="menu-item" data-act="toggle-lang">
          <span class="menu-icon">${icon.globe(19)}</span>
          <span class="grow" style="text-align:start">
            <span style="display:block" class="menu-label">${esc(t('language'))}</span>
            <span style="display:block" class="menu-sub">${esc(t('switchLang'))}</span>
          </span>
        </button>

        <div style="padding:14px 10px 6px">
          <div class="micro mb10">${esc(t('theme'))}</div>
          <div class="segmented">
            <button class="${pref === 'system' ? 'active' : ''}" data-act="set-theme" data-theme="system">${esc(t('themeSystem'))}</button>
            <button class="${pref === 'light' ? 'active' : ''}" data-act="set-theme" data-theme="light">${esc(t('themeLight'))}</button>
            <button class="${pref === 'dark' ? 'active' : ''}" data-act="set-theme" data-theme="dark">${esc(t('themeDark'))}</button>
          </div>
        </div>

        <button class="menu-item" data-act="load-sample">
          <span class="menu-icon">${icon.download(19)}</span>
          <span class="menu-label">${esc(t('loadSample'))}</span>
        </button>

        <button class="menu-item" data-act="reset-all">
          <span class="menu-icon">${icon.reset(19)}</span>
          <span class="menu-label">${esc(t('startEmpty'))}</span>
        </button>

        <div style="padding:10px;font-size:11.5px;color:var(--fg3);text-align:center">
          ${esc(t('offlineReady'))} · v1.0
        </div>
      </div>
    </div>`;
}

/** Generic confirm dialog (delete unit / delete category with payments). */
export function confirmSheet(ctx, { title, body, confirmLabel, act, payload = {} }) {
  const { t } = ctx;
  const data = Object.entries(payload).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
  return `<div class="scrim" data-act="close-sheet"></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grab"></div>
      <div class="sheet-body" style="padding-top:6px">
        <div class="sheet-title mb8">${esc(title)}</div>
        <p style="font-size:13.5px;color:var(--fg2);line-height:1.55;margin:0 0 20px">${esc(body)}</p>
        <div class="stack gap10">
          <button class="btn-danger" style="height:50px" data-act="${esc(act)}" ${data}>${esc(confirmLabel)}</button>
          <button class="btn-ghost" style="height:50px" data-act="close-sheet">${esc(t('cancel'))}</button>
        </div>
      </div>
    </div>`;
}
