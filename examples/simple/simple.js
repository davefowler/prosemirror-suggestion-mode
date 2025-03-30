import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { baseKeymap } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { suggestionModePlugin, acceptAllSuggestions, rejectAllSuggestions, setSuggestionMode, } from 'prosemirror-suggestion-mode';
import { addSuggestionMarks } from 'prosemirror-suggestion-mode';
import { DOMParser } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { Schema } from 'prosemirror-model';
// Import a theme for the suggestions here if using a bundler or with a link tag in the html file
// import 'prosemirror-suggestion-mode/style/suggestion-mode.css';
const exampleSchema = new Schema({
    nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
    // When creating your schema, wrap the marks in the addSuggestionMarks function
    // this will add the needed suggestion_insert and suggestion_delete marks to the schema
    marks: addSuggestionMarks(schema.spec.marks),
});
// Initialize the editor with the suggestions plugin
window.addEventListener('load', () => {
    var _a, _b, _c;
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
            keymap(baseKeymap), // basic keymap for the editor
            // suggestion mode plugin factory function with init values
            suggestionModePlugin({
                username: 'example user',
                inSuggestionMode: true, // start in suggestion mode - toggled below
                data: {
                    // put any custom ata here that you want added as attrs to the hover tooltip
                    exampleattr: 'these get added to the attrs of the the hover tooltip',
                },
            }),
        ],
    });
    // Create the editor view
    const view = new EditorView(document.querySelector('#editor'), { state });
    // Add event listeners for the controls
    (_a = document
        .querySelector('#toggleSuggestionMode')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', (e) => {
        setSuggestionMode(view, e.target.checked);
    });
    (_b = document
        .querySelector('#acceptAllSuggestions')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        acceptAllSuggestions(view.state, view.dispatch);
    });
    (_c = document
        .querySelector('#rejectAllSuggestions')) === null || _c === void 0 ? void 0 : _c.addEventListener('click', () => {
        rejectAllSuggestions(view.state, view.dispatch);
    });
});
