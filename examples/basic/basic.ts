import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  suggestionModePlugin,
  addSuggestionMarks,
  getSuggestionMenuItems,
} from 'prosemirror-suggestion-mode';
import { DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema } from 'prosemirror-model';
import { exampleSetup, buildMenuItems } from 'prosemirror-example-setup';

// Import a theme for the suggestions
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import 'prosemirror-example-setup/style/style.css';
import 'prosemirror-suggestion-mode/style/suggestion-mode.css';

// Create an enhanced schema with suggestion marks and list support
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: addSuggestionMarks(schema.spec.marks),
});

// Create suggestion mode menu items
const suggestionMenuItems = getSuggestionMenuItems();

// Initialize the editor
document.addEventListener('DOMContentLoaded', () => {
  const content = `
    <h1>ProseMirror Suggestion Mode Example</h1>
    <p>This is an example of <strong>ProseMirror</strong> with suggestion mode enabled by default.  It uses the <a href="https://github.com/ProseMirror/prosemirror-example-setup">prosemirror-example-setup</a> package to provide a toolbar and undo/redo functionality.</p>

<p>ProseMirror suggestion works across many features:</p>
    <ol>
    <li><em>formatted text</em></li>
    <li><strong>lists</strong></li>
    <li>deleting and pasting across blocks</li>
    <li>auto grouping adjacent delete/paste suggestions</li>
    <li>multiple-user suggestions</li>
    </ol>
  `;

  const parser = DOMParser.fromSchema(mySchema);
  const htmlDoc = new window.DOMParser().parseFromString(content, 'text/html');
  const doc = parser.parse(htmlDoc.body);

  // Get the default menu items
  const defaultMenuItems = buildMenuItems(mySchema);

  const view = new EditorView(document.querySelector('#editor'), {
    state: EditorState.create({
      doc,
      plugins: [
        ...exampleSetup({
          schema: mySchema,
          menuBar: true,
          floatingMenu: false,
          menuContent: [...defaultMenuItems.fullMenu, [...suggestionMenuItems]],
        }),
        suggestionModePlugin({
          inSuggestionMode: true,
          username: 'example user',
          data: {
            source: 'basic example',
          },
        }),
      ],
    }),
  });
});
