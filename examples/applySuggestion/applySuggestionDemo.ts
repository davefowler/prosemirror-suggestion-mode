import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema } from 'prosemirror-model';
import {
  suggestionModePlugin,
  acceptAllSuggestions,
  rejectAllSuggestions,
  TextSuggestion,
  addSuggestionMarks,
  applySuggestion,
  MenuComponent,
} from 'prosemirror-suggestion-mode';
import { DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';

const exampleSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),

  // When creating your schema, wrap the marks in the addSuggestionMarks function
  // this will add the needed suggestion_insert and suggestion_delete marks to the schema
  marks: addSuggestionMarks(schema.spec.marks),
});

// Normally you can just direct import a theme
import 'prosemirror-suggestion-mode/style/suggestion-mode.css';

// Create a custom component for displaying suggestion reason in the hover menu
const createSuggestionReasonComponent = (
  attrs: Record<string, any>
): MenuComponent => {
  const reasonDiv = document.createElement('div');
  reasonDiv.className = 'suggestion-reason';
  const reason = attrs?.data?.reason;
  if (reason) {
    const reasonLabel = document.createElement('strong');
    reasonLabel.textContent = `${attrs.username}: `;

    const reasonText = document.createElement('span');
    reasonText.textContent = reason;
    reasonText.className = 'reason-content';

    reasonDiv.appendChild(reasonLabel);
    reasonDiv.appendChild(reasonText);
  }

  return { dom: reasonDiv };
};

// Initialize the editor with the suggestions plugin
window.addEventListener('load', () => {
  // === REGULAR EDITOR SETUP ===
  const content = `
    <p>We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard, because that goal will serve to organize and measure the best of our energies and skills, because that challenge is one that we are willing to accept, one we are unwilling to postpone, and one which we intend to win, and the others, too.</p>
    <p>We set sail on this new sea because there is new knowledge to be gained, and new rights to be won, and they must be won and used for the progress of all people. For space science, like nuclear science and all <i>technology, has no conscience of its own.</i></p>
    <p>Whether it will become a <b>force</b> for good or ill depends on man, and only if the United States occupies a position of pre-eminence can we help decide whether this new ocean will be a sea of peace or a new terrifying theater of war.</p>
  `;

  const parser = DOMParser.fromSchema(exampleSchema);
  const htmlDoc = new window.DOMParser().parseFromString(content, 'text/html');
  const doc = parser.parse(htmlDoc.body);

  const state = EditorState.create({
    schema: exampleSchema,
    doc,
    plugins: [
      keymap(baseKeymap),
      suggestionModePlugin({
        username: 'example user',
        inSuggestionMode: false, // This isn't demoing user-triggered suggestion mode, just suggestions using applySuggestion.
        // Add hover menu options to show suggestion reasons
        hoverMenuOptions: {
          components: {
            createInfoComponent: createSuggestionReasonComponent,
          },
        },
      }),
    ],
  });

  // Create the editor view
  const view = new EditorView(document.querySelector('#editor'), { state });
  // @ts-expect-error - for testing
  document.view = view; // for testing

  document
    .querySelector('#acceptAllSuggestions')
    ?.addEventListener('click', () => {
      acceptAllSuggestions(view.state, view.dispatch);
    });

  document
    .querySelector('#rejectAllSuggestions')
    ?.addEventListener('click', () => {
      rejectAllSuggestions(view.state, view.dispatch);
    });

  // === TEXT SUGGESTION EXAMPLES ===

  const exampleSuggestions: TextSuggestion[] = [
    {
      textToReplace: 'Moon',
      textReplacement: 'moon',
      reason: 'Consistent lowercase for celestial bodies',
      textBefore: 'We choose to go to the ',
      textAfter: ' in this decade and do',
    },
    {
      textToReplace: '',
      textReplacement: '\n\nWe want to see if the moon is made of cheese.',
      reason: 'Added new paragraph about cheese moon theory',
      textBefore: 'others, too.',
      textAfter: 'We set sail',
    },
    {
      textToReplace: 'hard',
      textReplacement: 'challenging',
      reason: 'Word choice improvement',
      textBefore: 'not because they are easy, but because they are ',
      textAfter: ', because that goal',
    },
    {
      textToReplace: 'pre-eminence',
      textReplacement: 'leadership position',
      reason: 'Using more common terminology',
      textBefore: 'only if the United States occupies a position of ',
      textAfter: ' can we help decide',
    },
    {
      textToReplace: 'new terrifying theater',
      textReplacement: 'terrifying new theater',
      reason: 'Improved word order',
      textAfter: ' of war.',
    },
    {
      textToReplace: 's',
      textReplacement: 'z',
      reason: 'Corrected spelling',
      textBefore: 'will serve to organi',
      textAfter: 'e and measure',
    },
  ];

  // Apply suggestions one by one
  exampleSuggestions.forEach((suggestion) => {
    applySuggestion(view, suggestion, 'some suggester');
  });

  const suggestionsDiv = document.querySelector('#suggestions');

  // Use a pre element to preserve formatting
  suggestionsDiv!.innerHTML = `<pre>${JSON.stringify(exampleSuggestions, null, 2)}</pre>`;
});
