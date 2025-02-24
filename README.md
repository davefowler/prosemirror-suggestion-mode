# ProseMirrorSuggestions -- WORK IN PROGRESS

A ProseMirror extension that implements a "suggestion mode" method to track and show changes similar to Google Docs', but inspired more by [Ink and Switch's Diffs](https://www.inkandswitch.com/patchwork/notebook/04/). This extension allows users to make suggested edits that can be reviewed, accepted, or rejected later.

## Design choices

For simplicity this is not really a diffing capability where you can input two different versions and see the changes.  Instead if a user makes changes with a suggestion mode enabled, the changes are stored as extra markup on the document.  It's not really version control, it's just a way to make suggestions.

## Features

- Toggle suggestion mode on/off
- Highlight suggested text additions in green
- Show suggested deletions as compact red squares that reveal text on hover
- Accept/reject individual suggestions
- Full undo/redo support
- Clean, minimal UI

## Installation

```bash
npm install
```

## Development

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

## Usage

### Basic Setup

```javascript
import { suggestionsPlugin } from 'prosemirror-suggestions'

// Add to your ProseMirror plugins
const plugins = [
  suggestionsPlugin,
  // ... other plugins
]
```

### Toggle Suggestion Mode and Set Metadata

```javascript
// Enable suggestion mode with username and custom data
view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
  suggestionMode: true,
  username: 'JohnDoe',
  data: {
    department: 'Engineering',
    priority: 'high',
    reviewerId: 'REV-123'
  }
}))

// Disable suggestion mode
view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
  suggestionMode: false
}))

// Change username and data
view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
  suggestionMode: true,
  username: 'JaneSmith',
  data: {
    department: 'Marketing',
    category: 'content'
  }
}))
```

The `data` attribute can contain any JSON-serializable object. This data will be stored with the suggestion mark and displayed in the tooltip by default.

Each suggestion will now be tagged with the username of the person who made it. This is useful for:
- Tracking who made which suggestions
- Filtering suggestions by user
- Displaying user information in the UI when hovering over suggestions

### Accept/Reject Suggestions

```javascript
// Accept a suggestion at the current selection
suggestionsPlugin.accept(view)

// Reject a suggestion at the current selection
suggestionsPlugin.reject(view)
```

### Customizing Tooltips

You can customize the content and appearance of suggestion tooltips in two ways:

1. **Custom Tooltip Renderer**

Provide a custom tooltip renderer function when creating the plugin.  If you added extra data to the suggestion mark you can access it in the tooltip renderer.  Below we've added a profile image url.

```javascript
new Plugin({
    ...suggestionsPlugin,
    tooltipRenderer: (mark, type) => {
        // mark contains attrs like username, createdAt
        // type is either 'add' or 'delete'
        return `<img src="${mark.attrs.data.profileImageUrl}" /> ${mark.attrs.username} edited on ${mark.attrs.createdAt}`
    }
})
```

2. **CSS Styling**

Override the default tooltip styles in your CSS:

```css
.suggestion-tooltip {
    /* Change tooltip background */
    background: #444;
    
    /* Modify padding/spacing */
    padding: 8px 12px;
    
    /* Customize font */
    font-size: 13px;
    font-family: sans-serif;
}

/* Style the tooltip arrow */
.suggestion-tooltip::after {
    border-top-color: #444;
}

/* Adjust tooltip position */
.suggestion-tooltip-wrapper {
    margin-top: 5px;
}
```

The tooltipRenderer function gives you full control over the tooltip content, while CSS customization lets you style the tooltip appearance.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)


## Todo's yet

- Cleanup tests
- handle paste replaces
- cursor issue after deletes - typing doesn't move to add
- accept/reject suggestions
- hovers for suggestions
- handle when toggling between suggestion mode and normal mode
