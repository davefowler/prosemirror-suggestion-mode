import { EditorView } from 'prosemirror-view';

/**
 * Initialize hover listeners for all suggestions and menus in the editor
 * This should be called whenever decorations are updated
 */
export function initSuggestionHoverListeners(view: EditorView) {
  // Find all suggestion elements in the document
  const suggestionElements = view.dom.querySelectorAll('.suggestion-group');
  // Store references to functions so they can be removed later
  const listeners = new WeakMap();

  // Add listeners to suggestion elements
  suggestionElements.forEach((element) => {
    const el = element as HTMLElement;
    const key = el.getAttribute('key');
    const from = key.replace('suggestion-group-', '');
    const menuWrapper = view.dom.querySelector(
      `#suggestion-menu-wrapper-${from}`
    ) as HTMLElement;

    if (!menuWrapper) return;

    const menu = menuWrapper.querySelector(
      '.suggestion-hover-menu'
    ) as HTMLElement;
    if (!menu) return;

    // Create functions with closure over the specific menu
    const mouseEnter = () => {
      menu.style.display = 'block';
    };

    const mouseLeave = (event: MouseEvent) => {
      // Only hide if not moving to the menu
      if (!menuWrapper.contains(event.relatedTarget as Node)) {
        menu.style.display = 'none';
      }
    };

    // Store for cleanup
    listeners.set(el, { mouseEnter, mouseLeave });

    // Attach listeners
    el.addEventListener('mouseenter', mouseEnter);
    el.addEventListener('mouseleave', mouseLeave);
  });

  // menu wrappers also need to stay open on hover
  const menuWrappers = view.dom.querySelectorAll('.suggestion-menu-wrapper');
  menuWrappers.forEach((wrapper) => {
    const el = wrapper as HTMLElement;
    const menu = el.querySelector('.suggestion-hover-menu') as HTMLElement;
    if (!menu) return;

    const mouseEnter = () => {
      menu.style.display = 'block';
    };

    const mouseLeave = () => {
      menu.style.display = 'none';
    };

    // Store for cleanup
    listeners.set(el, { mouseEnter, mouseLeave });

    // Attach listeners
    el.addEventListener('mouseenter', mouseEnter);
    el.addEventListener('mouseleave', mouseLeave);
  });

  return listeners; // Return for cleanup purposes
}
