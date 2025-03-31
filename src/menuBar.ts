/**
 * Menu bar components for suggestion mode.
 * NOTE: Using this module requires adding "prosemirror-menu" as a dependency
 * to your project.
 */
import { MenuItem } from 'prosemirror-menu';
import { EditorState } from 'prosemirror-state';
import { acceptAllSuggestions, rejectAllSuggestions } from './acceptReject';
import { toggleSuggestionMode } from './setMode';
import { suggestionPluginKey } from './key';

const hasSuggestions = (state: EditorState): boolean => {
  let found = false;
  state.doc.descendants((node) => {
    if (
      node.marks.some((mark) => mark.type.name === 'suggestion_insert') ||
      node.marks.some((mark) => mark.type.name === 'suggestion_delete')
    ) {
      found = true;
      return false;
    }
    return true;
  });
  return found;
};

export const getSuggestionMenuItems = () => [
  new MenuItem({
    title: 'Toggle Suggestion Mode',
    label: '✏️ Suggestions',
    enable: () => true,
    active(state) {
      const pluginState = suggestionPluginKey.getState(state);
      return pluginState?.inSuggestionMode || false;
    },
    run: toggleSuggestionMode,
  }),
  new MenuItem({
    title: 'Accept All',
    label: '✅ All',
    enable: hasSuggestions,
    run: acceptAllSuggestions,
  }),
  new MenuItem({
    title: 'Reject All',
    label: '❌ All',
    enable: hasSuggestions,
    run: rejectAllSuggestions,
  }),
];
