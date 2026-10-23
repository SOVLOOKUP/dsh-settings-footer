/**
 * Ambient types for the surfaces a DSH web client plugin touches.
 *
 * The client half is loaded by the host as a *classic* script through
 * `window.__ModuleLoader__.load({ id, factory })`. That means the compiled
 * output must not contain `import` / `export` statements, so `src/client.ts`
 * is written as a script (no top-level module syntax) and everything the host
 * hands it — React, the primitives package, the plugin context — arrives
 * through the `require` argument and is typed here.
 *
 * Only the members this plugin uses are declared. They are deliberately
 * structural (no nominal coupling to host internals) so a host upgrade that
 * adds props does not break the build.
 */

/** Loader-injected `require`: resolves a host-provided module id. */
type DshRequire = (id: string) => any;

/** The subset of React used by this plugin. */
interface ReactLike {
  createElement(
    type: unknown,
    props?: object | null,
    ...children: unknown[]
  ): unknown;
  useRef<T>(initial: T): { current: T };
  useLayoutEffect(
    effect: () => void | (() => void),
    deps?: readonly unknown[],
  ): void;
}

/** The subset of `@deepseek-ai/dsh-client-ui-primitives` used by this plugin. */
interface PrimitivesLike {
  Tooltip: (props: {
    disabled?: boolean;
    label: string;
    shortcutKeys?: readonly string[];
    delayMs?: number;
    side?: string;
    children?: unknown;
  }) => unknown;
  IconSettingsOutlineMedium: (props: { size?: number }) => unknown;
}

declare namespace Dsh {
  /** A key binding as the host exposes it to slot components. */
  interface ShortcutBinding {
    readonly keys?: readonly string[];
    /** Value for the `aria-keyshortcuts` attribute. */
    readonly aria?: string;
  }

  /**
   * Props the host passes to every `settings.launcher` registration: the
   * shipped account launcher and anything shadowing it receive the same set.
   */
  interface SettingsLauncherProps {
    /** `false` on the collapsed icon rail. */
    readonly wide: boolean;
    readonly settingsOpen: boolean;
    readonly openSettings: () => void;
    readonly settingsShortcut?: ShortcutBinding;
    /** Translate within this registration's `locale` namespace. */
    readonly t: (key: string) => string;
  }

  /** Options for one slot registration. */
  interface SlotRegisterOptions {
    name: string;
    /** For `kind: "single"` seats the lowest priority wins. */
    priority?: number;
    locale?: string;
  }

  interface SlotRegistry {
    /**
     * Declare interest in a seat. The callback runs when the seat is ready and
     * its return value is the registration's live handle.
     */
    inject(name: string, register: () => unknown): void;
    register(
      options: SlotRegisterOptions,
      component: (props: any) => unknown,
    ): () => void;
  }

  interface LocaleRegistry {
    register(
      namespace: string,
      dictionaries: {
        zh: Record<string, string>;
        en: Record<string, string>;
      },
    ): () => void;
  }

  /** The plugin context handed to the client half's `apply`. */
  interface PluginContext {
    /** Run `fn` now; its return value is called on teardown. */
    effect(fn: () => (() => void) | void, label?: string): void;
    readonly locale: LocaleRegistry;
    readonly slots: SlotRegistry;
  }
}

interface DshModuleLoader {
  load(module: {
    id: string;
    factory(require: DshRequire): unknown;
  }): void;
}

interface Window {
  __ModuleLoader__: DshModuleLoader;
}
