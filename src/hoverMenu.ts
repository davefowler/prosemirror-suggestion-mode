import {
  acceptSuggestionsInRange,
  rejectSuggestionsInRange,
} from './acceptReject';
import { Command } from 'prosemirror-state';

// Menu item interface
export interface MenuComponent {
  dom: HTMLElement;
  update?: (attrs: Record<string, any>) => void;
}

// Options for creating the hover menu
export interface SuggestionHoverMenuOptions {
  components?: {
    createInfoComponent?: (attrs: Record<string, any>) => MenuComponent;
    createButtonsComponent?: (
      from: number,
      to: number,
      handler: CommandHandler
    ) => MenuComponent;
    // Add more component types as needed
  };
  disabled?: boolean;
  // CSS classes
  menuClass?: string;
}

export interface CommandHandler {
  dispatch: (command: Command) => void;
}

// Type for suggestion hover menu renderer function
export type SuggestionHoverMenuRenderer = (
  from: number,
  to: number,
  attrs: Record<string, any>,
  handler: CommandHandler
) => HTMLElement;

// Default components builders
export const defaultComponents = {
  // Creates the info section showing who made the change and when
  createInfoComponent(attrs: Record<string, any>): MenuComponent {
    const infoText = document.createElement('div');

    // Create text node for the first part
    infoText.appendChild(document.createTextNode('edited by '));

    // Create username span
    const usernameSpan = document.createElement('span');
    usernameSpan.className = 'username';
    usernameSpan.textContent = attrs.username;
    infoText.appendChild(usernameSpan);

    return { dom: infoText };
  },

  // Creates the buttons section with accept/reject
  createButtonsComponent(
    from: number,
    to: number,
    handler: CommandHandler
  ): MenuComponent {
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'suggestion-buttons';

    const acceptButton = document.createElement('button');
    acceptButton.className = 'suggestion-accept';
    acceptButton.textContent = 'Accept';
    acceptButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handler.dispatch(acceptSuggestionsInRange(from, to));
    });

    const rejectButton = document.createElement('button');
    rejectButton.className = 'suggestion-reject';
    rejectButton.textContent = 'Reject';
    rejectButton.addEventListener('click', (e) => {
      e.stopPropagation();
      handler.dispatch(rejectSuggestionsInRange(from, to));
    });

    buttonsDiv.appendChild(acceptButton);
    buttonsDiv.appendChild(rejectButton);

    return { dom: buttonsDiv };
  },
};

// Create a hover menu with the specified components
export function hoverMenuFactory(
  options: SuggestionHoverMenuOptions = {}
): SuggestionHoverMenuRenderer {
  const menuClass = options.menuClass || 'suggestion-hover-menu';
  const components = { ...defaultComponents, ...options?.components };

  return (
    from: number,
    to: number,
    attrs,
    handler: CommandHandler
  ): HTMLElement => {
    // Create the menu container
    const menu = document.createElement('div');
    menu.className = menuClass;

    // Create and add the info component
    const infoComponent = components.createInfoComponent(attrs);
    menu.appendChild(infoComponent.dom);

    // Create and add the buttons component
    const buttonsComponent = components.createButtonsComponent(
      from,
      to,
      handler
    );
    menu.appendChild(buttonsComponent.dom);
    return menu;
  };
}
