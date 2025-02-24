# Project Prompt: ProseMirror Suggestions with Changeset Tracking

## Project Overview

Create a ProseMirror extension that implements a suggestion mode using prosemirror-changeset for tracking changes. The extension should provide functionality similar to Google Docs' suggestion mode, but using changesets instead of marks for tracking modifications.

## Key Features

1. **Change Tracking:**
   - Use prosemirror-changeset to track all document modifications
   - Store metadata with each change (user, timestamp, etc.)
   - Support both insertions and deletions

2. **Visual Representation:**
   - Show inserted text with green background
   - Show deleted text as red squares that reveal content on hover
   - Support toggling between showing/hiding deleted text
   - Provide tooltips showing change metadata

3. **Change Management:**
   - Accept/reject individual changes
   - Batch accept/reject multiple changes
   - Maintain change history for undo/redo support

## Technical Implementation

### 1. Changeset Configuration

```javascript
const changesetConfig = {
  complexSteps: true,
  metadata: {
    user: String,
    timestamp: Number,
    sessionId: String
  }
}
```

### 2. Core Components

1. **ChangesetTracker:**
   - Maintains the current changeset
   - Records changes with metadata
   - Provides methods for accepting/rejecting changes

2. **ChangesetDecorator:**
   - Converts changesets to ProseMirror decorations
   - Handles visual representation of changes
   - Manages tooltips and hover states

3. **SuggestionsPlugin:**
   - Coordinates between tracker and decorator
   - Handles user interactions
   - Manages suggestion mode state

## User Interface

1. **Controls:**
   - Toggle suggestion mode
   - Show/hide deleted text
   - Accept/reject buttons for changes
   - Change navigation

2. **Visual Indicators:**
   - Green background for insertions
   - Red squares for deletions
   - Tooltips showing:
     - Change type
     - User
     - Timestamp
     - Deleted content (for deletions)

## Implementation Steps

1. **Setup:**
   - Install dependencies (prosemirror-changeset)
   - Configure basic ProseMirror editor
   - Initialize changeset tracking

2. **Change Tracking:**
   - Implement ChangesetTracker
   - Configure metadata handling
   - Set up change recording

3. **Visual Display:**
   - Implement ChangesetDecorator
   - Create decoration mapping
   - Style changes appropriately

4. **User Interaction:**
   - Add suggestion mode toggle
   - Implement change acceptance/rejection
   - Add hover interactions

5. **Testing:**
   - Unit tests for tracker
   - Integration tests for plugin
   - UI interaction tests

## Additional Considerations

- **Performance:** Efficient handling of large documents and many changes
- **Persistence:** Serialization of changesets for storage
- **Collaboration:** Potential integration with collaborative editing
- **Accessibility:** Ensure changes are accessible to screen readers

## Example Usage

```javascript
const suggestionPlugin = new SuggestionsPlugin({
  user: "current-user",
  onChange: (changeset) => {
    // Handle changeset updates
  },
  onAccept: (change) => {
    // Handle change acceptance
  },
  onReject: (change) => {
    // Handle change rejection
  }
})
```

## Testing Requirements

1. **Unit Tests:**
   - Changeset creation
   - Change tracking accuracy
   - Metadata handling

2. **Integration Tests:**
   - Plugin initialization
   - Change recording
   - Visual representation

3. **UI Tests:**
   - Suggestion mode toggle
   - Change acceptance/rejection
   - Hover interactions

## Deliverables

1. Working ProseMirror plugin
2. Example implementation
3. Test suite
4. Documentation
5. Performance benchmarks
