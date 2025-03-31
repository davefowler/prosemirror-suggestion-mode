// Export all public API components

// Plugin core
export { suggestionModePlugin } from './plugin';
export type { SuggestionModePluginOptions } from './plugin';
export { suggestionPluginKey, suggestionTransactionKey } from './key';
export type { SuggestionModePluginState } from './key';

export {
  acceptSuggestionsInRange,
  rejectSuggestionsInRange,
  acceptAllSuggestions,
  rejectAllSuggestions,
} from './acceptReject';
export * from './setMode';
export * from './applySuggestion';
export * from './hoverMenu';
export { getSuggestionMenuItems } from './menuBar';

// Schema
export { addSuggestionMarks, suggestionMarks } from './schema';
