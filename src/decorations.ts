import { EditorState } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { SuggestionHoverMenuRenderer } from './hoverMenu';

/**
 * Decorates a group of suggestions with a hover menu
 * @param decos - The array of decorations to add to
 * @param from - The start position of the group
 * @param to - The end position of the group
 * @param attrs - The attributes of the group
 * @param renderHoverMenu - The function to render the hover menu
 */
export function decorateSuggestionGroup(
  decos: Decoration[],
  from: number,
  to: number,
  attrs: Record<string, any>,
  renderHoverMenu: SuggestionHoverMenuRenderer
) {
  decos.push(
    Decoration.inline(from, to, {
      class: 'suggestion-group',
      key: `suggestion-group-${from}`,
    })
  );
  decos.push(
    Decoration.widget(
      from,
      (view) => {
        const wrapper = document.createElement('span');
        wrapper.className = 'suggestion-menu-wrapper';
        wrapper.id = `suggestion-menu-wrapper-${from}`;
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.style.verticalAlign = 'text-top';
        wrapper.style.height = '0';
        wrapper.style.width = '0';
        wrapper.style.overflow = 'visible';

        const menu = renderHoverMenu(from, to, attrs, {
          dispatch: (command) => command(view.state, view.dispatch),
        });
        wrapper.appendChild(menu);
        return wrapper;
      },
      {
        key: `hover-${from}`,
        side: -1,
      }
    )
  );
}

/**
 * Creates a decoration set for a given editor state
 * @param state - The editor state to create decorations for
 * @param renderHoverMenu - The function to render the hover menu
 * @returns A decoration set for the editor state
 */
export function createDecorations(
  state: EditorState,
  renderHoverMenu: SuggestionHoverMenuRenderer
): DecorationSet {
  const decos: Decoration[] = [];
  let groupStart: number | null = null;
  let groupEnd: number | null = null;
  let currentUsername: string | null = null;
  let currentAttrs: Record<string, any> | null = null;

  // Helper function to create decoration and reset group tracking
  const finalizeCurrentGroup = () => {
    if (groupStart !== null) {
      decorateSuggestionGroup(
        decos,
        groupStart,
        groupEnd!,
        currentAttrs!,
        renderHoverMenu
      );
      groupStart = null;
      groupEnd = null;
      currentUsername = null;
      currentAttrs = null;
    }
  };

  state.doc.descendants((node, pos, parent, index) => {
    if (node.type.name !== 'text') return; // only look at text nodes
    const suggestionMark = node.marks.find(
      (m) =>
        m.type.name === 'suggestion_insert' ||
        m.type.name === 'suggestion_delete'
    );

    if (!suggestionMark && !groupStart) return;

    if (
      (suggestionMark && currentUsername !== suggestionMark.attrs.username) ||
      !suggestionMark
    ) {
      finalizeCurrentGroup();
    }

    if (suggestionMark) {
      if (!groupStart) {
        groupStart = pos;
        currentUsername = suggestionMark.attrs.username;
        currentAttrs = suggestionMark.attrs;
      }
      groupEnd = pos + node.nodeSize;
    }
  });

  // finalize the last group if there is one
  finalizeCurrentGroup();

  return DecorationSet.create(state.doc, decos);
}
