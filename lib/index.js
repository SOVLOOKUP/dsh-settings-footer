/**
 * dsh-settings-footer — Host half.
 *
 * The whole change lives in the client module: it shadows the
 * `settings.launcher` seat and relocates the trigger with a DOM effect. The
 * host half registers nothing — no routes, no config, no files — which is what
 * lets disabling the bundle return the stock sidebar with no repair step.
 */
/** No-op: this bundle contributes host behaviour. */
export function apply() { }
