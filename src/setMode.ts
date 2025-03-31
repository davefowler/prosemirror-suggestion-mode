import { Command, EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { suggestionPluginKey } from './key';
import { Transaction } from 'prosemirror-state';

/**
 * Set the suggestion mode state
 * @param enabled Whether suggestion mode should be enabled or disabled
 */
export const setSuggestionModeCommand = (enabled: boolean): Command => {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const pluginState = suggestionPluginKey.getState(state);
    if (!pluginState) return false;

    if (dispatch) {
      dispatch(
        state.tr.setMeta(suggestionPluginKey, {
          ...pluginState,
          inSuggestionMode: enabled,
        })
      );
    }
    return true;
  };
};

/**
 * Toggle the suggestion mode on or off
 */
export const toggleSuggestionMode: Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => {
  const pluginState = suggestionPluginKey.getState(state);
  if (!pluginState) return false;

  // Use setSuggestionModeCommand to toggle the current state
  return setSuggestionModeCommand(!pluginState.inSuggestionMode)(
    state,
    dispatch
  );
};

/**
 * Helper function to set suggestion mode (non-command version for direct view manipulation)
 */
export const setSuggestionMode = (
  view: EditorView,
  enabled: boolean
): boolean => {
  const command = setSuggestionModeCommand(enabled);
  return command(view.state, view.dispatch);
};
