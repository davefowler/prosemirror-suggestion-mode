// Export all public API components

// Plugin core
export { suggestionModePlugin } from './plugin';
export type { SuggestionModePluginOptions } from './plugin';
export { suggestionPluginKey, suggestionTransactionKey } from './key';
export type { SuggestionModePluginState } from './key';

export * from './commands/accept-reject';
export * from './commands/setMode';
export * from './commands/applySuggestion';
export * from './menus/hoverMenu';
export { getSuggestionMenuItems } from './menus/menuBar';

// Schema
export { addSuggestionMarks } from './schema';
