# ProseMirror Suggestion Mode

**Status** WIP, still known issues in a few scenarios

A ProseMirror plugin that implements a "suggestion mode" method to track and show changes similar to Google Docs and Word. This plugin allows users to make suggested edits that can be reviewed, accepted, or rejected later.

## Demo

Check out the [live demos](https://prosemirror-suggestion-mode.netlify.app). The source for the examples is hosted at [prosemirror-suggestion-mode-examples](https://github.com/davefowler/prosemirror-suggestion-mode-examples/)

- [Simple](https://prosemirror-suggestion-mode.netlify.app/simple/) - a bare bones example
- [Basic Markdown](https://prosemirror-suggestion-mode.netlify.app/basic/) - use with the prosemirror-example-setup handling formatted text
- [Apply Suggestion Method](https://prosemirror-suggestion-mode.netlify.app/applySuggestion/) - showcasing the applySuggestion method for applying text based suggestions (handy for AI)

[![ProseMirror Suggestion Mode Demo](https://github.com/davefowler/prosemirror-suggestion-mode/blob/main/assets/3-11-25%20prosemirror%20suggestions%20with%20markup.png)](https://prosemirror-suggestion-mode.netlify.app/basic/)

## Features

- Toggle suggestion mode on/off
- Highlight suggested text additions in green, deletions in red
- Show suggested deletions as compact red squares that reveal text on hover
- Accept/reject individual suggestions
- Does not conflict with formatting or undo/redo
- Clean, minimal UI
- Text search/replace helpers for AI generated suggestions

## Releases

See [releases](https://github.com/davefowler/prosemirror-suggestion-mode/blob/main/releases) for full release notes

## Installation

```bash
# Using npm
npm install prosemirror-suggestion-mode

# Using yarn
yarn add prosemirror-suggestion-mode
```

## Usage

### Basic Setup

First import the _addSuggestionMarks_ helper to add the plugin's marks to your schema.

```javascript
import { addSuggestionMarks } from 'prosemirror-suggestion-mode';

const exampleSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),

  // When creating your schema, wrap the marks in the addSuggestionMarks function
  // this will add the needed suggestion_insert and suggestion_delete marks to the schema
  marks: addSuggestionMarks(schema.spec.marks),
});
```

Then add the plugin to your plugins array with the _suggestionModePlugin_ plugin factory function when you create the editor

```javascript
import { suggestionModePlugin } from 'prosemirror-suggestion-mode';
const state = EditorState.create({
  schema: exampleSchema,
  doc,
  plugins: [
    keymap(baseKeymap), // basic keymap for the editor
    // suggestion mode plugin factory function with init values
    suggestionModePlugin({
      username: 'example user',
      data: {
        // put any custom data here that you want added as attrs to the hover tooltip
        exampleattr: 'these get added to the attrs of the the hover tooltip',
      },
    }),
  ],
});
```

The init options for the plugin are:

```javascript
suggestionModePlugin({
  inSuggestionMode: false, // starting status of suggestion mode
  username?: string; // of who is making the suggestions
  data?: Record<string, any>; // custom metadata that will get added to the attrs of the mark nodes
  hoverMenuRenderer?: (mark: Mark, view: EditorView, pos: number) => HTMLElement;  // override to create a fully custom hover menu
  hoverMenuOptions?: { // override parts of this to customise just parts of the hover menu
  components?: {
    createInfoComponent?: (mark: Mark, view: EditorView, pos: number) => HTMLElement; // override to create a custom info component above the buttons
    createButtonsComponent?: (mark: Mark, view: EditorView, pos: number) => HTMLElement; // override to create a custom buttons component below the info component
  };
  disabled?: false // disable hover menu and listeners (off by default)
  menuClass?: string; // class to apply to the hover menu
};
```

## Commands and Helper Functions

The plugin provides various commands and helper functions to control its behavior.

### Suggestion Mode Controls

```javascript
import {
  setSuggestionMode,
  setSuggestionModeCommand,
  toggleSuggestionMode,
} from 'prosemirror-suggestion-mode';

// Helper function to set suggestion mode on/off
setSuggestionMode(view, true); // enable suggestion mode
setSuggestionMode(view, false); // disable suggestion mode

// Command to set suggestion mode (for use with menus or keymaps)
const enableSuggestionMode = setSuggestionModeCommand(true);
view.dispatch(enableSuggestionMode(view.state, view.dispatch));

// Command to toggle suggestion mode
view.dispatch(toggleSuggestionMode(view.state, view.dispatch));
```

### Applying AI or Text-Based Suggestions

```javascript
import {
  applySuggestion,
  createApplySuggestionCommand,
} from 'prosemirror-suggestion-mode';

// Apply a single suggestion using the helper function
applySuggestion(
  view,
  {
    textToReplace: 'Moon',
    textReplacement: 'moon',
    reason: 'Consistent lowercase for celestial bodies',
    textBefore: 'We choose to go to the ',
    textAfter: ' in this decade and do',
  },
  'AI Assistant'
);

// Apply multiple suggestions by looping through them
mySuggestions.forEach((suggestion) => {
  applySuggestion(view, suggestion, 'AI Assistant');
});

// Create a command for a suggestion (for use with menus or keymaps)
const command = createApplySuggestionCommand(
  {
    textToReplace: 'pre-eminence',
    textReplacement: 'leadership position',
    reason: 'Using more common terminology',
    textBefore: 'only if the United States occupies a position of ',
    textAfter: ' can we help decide',
  },
  'AI Assistant'
);

command(view.state, view.dispatch, view);
```

### Accept/Reject Suggestions

```javascript
import {
  acceptSuggestionsInRange,
  rejectSuggestionsInRange,
  acceptAllSuggestions,
  rejectAllSuggestions,
} from 'prosemirror-suggestion-mode';

// Accept or reject suggestions within a specific range
acceptSuggestionsInRange(10, 20)(view.state, view.dispatch);
rejectSuggestionsInRange(10, 20)(view.state, view.dispatch);

// Accept or reject all suggestions in the document
acceptAllSuggestions(view.state, view.dispatch);
rejectAllSuggestions(view.state, view.dispatch);
```

### Change the username or data

To change the username and data that will get stored in the suggestion mark attributes you can change defaults at the global Plugin level by using the _suggestionPluginKey_

```javascript
// Set a default username and data category
view.dispatch(
  view.state.tr.setMeta(suggestionPluginKey, {
    username: 'JaneSmith',
    data: {
      category: 'content',
    },
  })
);
```

and override these global defaults per transaction with the _suggestionModeTransactionKey_

```javascript
// Setting specific metadata to override defaults for this specific transaction
view.dispatch(
  view.state.tr.setMeta(suggestionPluginKey, {
    data: {
      reason: 'some reason for this specific change',
      date: '03-25-25',
    },
  })
);
```

The `data` attribute can contain any JSON-serializable object. This data will be stored with the suggestion mark and displayed in the tooltip by default.

### Customizing the Hover Menu

You can customize the content and appearance of suggestion hover menu by either overwritting a component of the default hover menu, or by providing your own full hover menu renderer.

#### CSS Styling

For basic styling you can simply import the [default styles](https://github.com/davefowler/prosemirror-suggestion-mode/blob/main/style/suggestion-mode.css)

```javascript
import 'prosemirror-suggestion-mode/style/suggestion-mode.css';
```

The hover menu customizations give you full control over the hover menu content, while CSS customization lets you style the hover menu appearance.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

To start the development server:

```bash
npm start
```

This will:

1. Build the project
2. Start a local development server on http://localhost:8080
3. Open the example page in your browser
4. Watch for changes and reload automatically

The development server will be available at:
http://localhost:8080

## License

[MIT](https://choosealicense.com/licenses/mit/)
