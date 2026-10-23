"use strict";
/**
 * dsh-settings-footer — Client half.
 *
 * dsh 0.2.1 folded Settings into the sidebar-footer account launcher: signed
 * out it reads "⋯ 更多" and opens a second-level menu (设置 / 意见反馈 / 登录).
 * By explicit user preference this bundle undoes that arrangement:
 *
 * 1. Settings becomes a first-class row at the TOP of the sidebar, carrying an
 *    icon plus the 设置 label and using the geometry of the pre-0.2.1 trigger.
 * 2. The 新会话 button is hidden (Cmd/Ctrl+N and the command palette still
 *    start a session — the host action is untouched, only this entry point).
 * 3. The whole sidebar footer is emptied: the account launcher, the footer
 *    settings cell, the plugin-runtime badge and the now-empty footer box.
 *
 * Resulting top stack: 品牌行 → 设置 → 全局面板 → 会话列表.
 *
 * How:
 * - `settings.launcher` is a `single` seat where the LOWEST priority renders.
 *   The shipped account launcher sits at priority 0, so registering at -1
 *   shadows it and the footer cell renders our trigger instead.
 * - A DOM effect then *moves* our row out of the footer and into the sidebar
 *   column, directly after the 新会话 node (hidden, but still present, so it
 *   anchors the insertion order). The moved node stays React-owned — it is a
 *   child of the span React keeps mounted — so unmounting returns it cleanly.
 * - A MutationObserver re-asserts the position, because the host re-renders
 *   move the row back into our span and layout switches (wide ⇄ rail) rebuild
 *   the column's children.
 *
 * Everything is disposed through `ctx.effect`, so disabling the bundle
 * restores the stock footer with no repair step.
 *
 * This file is compiled as a classic script (no `import` / `export`): the host
 * loads client bundles through `window.__ModuleLoader__`.
 */
/** Package id, also used as the injected `<style>` tag's owner. */
const PLUGIN_ID = 'dsh-settings-footer';
/** Locale namespace for this plugin's strings. */
const NS = 'dsh-settings-footer';
const DICTIONARIES = {
    zh: { trigger: '设置' },
    en: { trigger: 'Settings' },
};
/**
 * Host geometry, matched by CSS-module class prefix. The hash prefix changes
 * between builds but the `_name` suffix is stable:
 * `_root` (sidebar column), `_footArea` (footer box), `_settingsArea` (footer
 * settings cell), `_footerActions` (footer action cell), `_newSession` (新会话).
 */
const STYLES = [
    // Geometry copied from the shipped settings trigger (SettingsRoot's
    // `_trigger`: 42px tall, auto width, 8px left / 10px right padding, regular
    // weight, no border or fill). That is what the footer button looked like
    // before the move, so the relocated row matches it exactly.
    '.dshsf-trigger{box-sizing:border-box;flex:1;width:auto;min-width:0;height:42px;',
    'margin:0;padding:0 10px 0 8px;display:flex;align-items:center;gap:8px;',
    'border:none;border-radius:var(--dsw-radius-md);background:transparent;',
    'color:var(--dsw-alias-label-primary);font-family:inherit;font-size:14px;',
    'line-height:22px;cursor:pointer;overflow:hidden;text-align:left}',
    '.dshsf-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}',
    '.dshsf-trigger:focus-visible{outline:var(--dsw-focus-ring-width) solid ',
    'var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}',
    '.dshsf-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    // The row wrapper mirrors the host's settings row, but its width is pinned
    // to the 新会话 button's own box (margin 0 2px inside the padded column)
    // instead of the host row's `calc(100% + 4px)` / -2px bleed, so the rows
    // share one edge instead of overhanging by 4px a side.
    '.dshsf-row{flex:none;display:flex;align-items:center;gap:8px;padding:0;',
    'box-sizing:border-box;width:calc(100% - 4px);margin:4px 2px}',
    // Collapsed rail: the 36px square icon every rail control uses.
    ':root[data-sidebar-collapsed] .dshsf-row{width:auto;margin:8px 0 10px}',
    ':root[data-sidebar-collapsed] .dshsf-trigger{flex:none;justify-content:center;',
    'align-items:center;gap:0;width:36px;height:36px;margin:0;padding:0}',
    // The footer holds nothing we keep: the shipped account launcher (shadowed,
    // but still rendered inside this cell) and its settings row go away.
    '[class*="_settingsArea"]{display:none!important}',
    // The 新会话 button, by explicit user preference. The host keeps the action
    // itself: Cmd/Ctrl+N still starts a session.
    '[class*="_root"] > [class*="_newSession"]{display:none!important}',
    // The footer's remaining registrant is ui-cordis's plugin-runtime badge
    // ("Cordis Plugin · N running"), a 42px bar that opens a popover.
    // `data-cordis-badge` is the fallback selector for builds that carry it
    // under another class name.
    '[class*="_footerActions"]{display:none!important}',
    '[data-cordis-badge]{display:none!important}',
    // With both footer cells gone the container is an empty flex box; drop it
    // too so nothing can reserve space at the bottom.
    '[class*="_root"] > [class*="_footArea"]{display:none!important}',
].join('');
window.__ModuleLoader__.load({
    id: PLUGIN_ID,
    factory(require) {
        const React = require('react');
        const primitives = require('@deepseek-ai/dsh-client-ui-primitives');
        const h = React.createElement;
        /**
         * The settings row: a gear, the label, and a tooltip that carries the
         * keyboard shortcut.
         *
         * @param props - launcher owner props plus the bound translate.
         * @returns the trigger button wrapped in a tooltip.
         */
        function SettingsTrigger({ wide, settingsOpen, openSettings, settingsShortcut, t, }) {
            const label = t('trigger');
            const button = h('button', {
                type: 'button',
                className: 'dshsf-trigger',
                'aria-label': label,
                'aria-haspopup': 'dialog',
                'aria-expanded': settingsOpen ? 'true' : 'false',
                'aria-keyshortcuts': settingsShortcut?.aria,
                onClick: () => openSettings(),
            }, h(primitives.IconSettingsOutlineMedium, { size: wide ? 16 : 18 }), wide ? h('span', { className: 'dshsf-label' }, label) : null);
            return h(primitives.Tooltip, {
                // A tooltip repeating the visible label is noise; only the rail
                // (icon-only) and the open dialog get one.
                disabled: settingsOpen || wide,
                label,
                shortcutKeys: settingsShortcut?.keys,
                delayMs: 300,
            }, button);
        }
        /** Live teardown for the moved row, so a re-mount never leaks observers. */
        let unmountTrigger;
        /**
         * Move the rendered settings row into the sidebar's top stack.
         *
         * @param node - the span React mounted; its only child is our row wrapper.
         */
        function mountTrigger(node) {
            unmountTrigger?.();
            // The moving unit is the row wrapper (`.dshsf-row`), not the inner
            // button: the row carries the width and inset that match the host's own
            // settings trigger row.
            const row = node.firstElementChild;
            if (row === null)
                return;
            const column = document.querySelector('[class*="_root"]:has(> [class*="_footArea"])') ??
                document.querySelector('[class*="_root"]:has(> [class*="_logoRow"])');
            if (column === null)
                return;
            /**
             * The row goes right after the 新会话 node, which stays in the DOM as a
             * direct child of the column in both layouts even though our stylesheet
             * hides it — a `display:none` element still anchors insertion order.
             * Re-resolved on every pass rather than captured once, because layout
             * switches rebuild the column's children.
             */
            const place = () => {
                const newSession = column.querySelector(':scope > [class*="_newSession"]');
                if (newSession === null)
                    return;
                // Idempotent: when the row already sits there, inserting at the same
                // position is a no-op.
                if (newSession.nextElementSibling !== row) {
                    column.insertBefore(row, newSession.nextSibling);
                }
            };
            place();
            // Host re-renders move the row back into our span; layout switches
            // rebuild the column. Re-assert on both.
            const observer = new MutationObserver(place);
            observer.observe(column, { childList: true, subtree: true });
            unmountTrigger = () => {
                observer.disconnect();
                if (row.parentElement !== node)
                    node.insertBefore(row, node.firstChild);
                unmountTrigger = undefined;
            };
        }
        return {
            inject: ['slots', 'locale'],
            apply(ctx) {
                ctx.effect(() => {
                    const style = document.createElement('style');
                    style.dataset.plugin = PLUGIN_ID;
                    style.textContent = STYLES;
                    document.head.appendChild(style);
                    return () => style.remove();
                }, 'dsh-settings-footer: styles');
                ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'dsh-settings-footer: dictionaries');
                // Shadow the shipped account launcher (priority 0); the lowest priority
                // renders, so -1 wins and the footer cell renders our trigger.
                ctx.slots.inject('settings.launcher', () => ctx.slots.register({
                    name: 'settings.launcher',
                    priority: -1,
                    locale: NS,
                }, (props) => {
                    const node = React.useRef(null);
                    React.useLayoutEffect(() => {
                        if (node.current !== null)
                            mountTrigger(node.current);
                        return () => unmountTrigger?.();
                    }, []);
                    // The span owns the row wrapper. Keeping the trigger inside our
                    // own nodes means unmounting the span removes it even while it
                    // is parked in the sidebar column, outside the footer cell.
                    return h('span', { className: 'dshsf-slot-hoc', ref: node }, h('div', { className: 'dshsf-row' }, h(SettingsTrigger, props)));
                }));
            },
        };
    },
});
