import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { DOMParser } from "prosemirror-model"
import { schema as basicSchema } from "prosemirror-schema-basic"
import { baseKeymap } from "prosemirror-commands"
import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { suggestionsPlugin, suggestionsPluginKey, SuggestionsPluginState, SuggestionsMeta, ChangeMetadata } from "./suggestions"

// Export all components for library usage
export { schema } from './schema';
export { 
  suggestionsPlugin, 
  suggestionsPluginKey,
  SuggestionsPluginState,
  SuggestionsMeta,
  ChangeMetadata
} from './suggestions';

const mySchema = basicSchema;

// Declare global window property for the editor view
declare global {
  interface Window {
    view: EditorView;
  }
}

// Initialize the editor with the suggestions plugin
window.addEventListener("load", () => {
    // Create the initial editor state with some starter content
    const state = EditorState.create({
        schema: mySchema,
        doc: mySchema.node("doc", null, [
            mySchema.node("paragraph", null, [
                mySchema.text("We choose to go to the Moon in this decade and do the other things, not because they are easy, but because they are hard, because that goal will serve to organize and measure the best of our energies and skills, because that challenge is one that we are willing to accept, one we are unwilling to postpone, and one which we intend to win, and the others, too.")
            ]),
            mySchema.node("paragraph", null, [
                mySchema.text("We set sail on this new sea because there is new knowledge to be gained, and new rights to be won, and they must be won and used for the progress of all people. For space science, like nuclear science and all technology, has no conscience of its own.")
            ]),
            mySchema.node("paragraph", null, [
                mySchema.text("Whether it will become a force for good or ill depends on man, and only if the United States occupies a position of pre-eminence can we help decide whether this new ocean will be a sea of peace or a new terrifying theater of war.")
            ])
        ]),
        plugins: [
            history(),
            keymap(baseKeymap),
            suggestionsPlugin
        ]
    })

    // Create the editor view
    const editorElement = document.querySelector("#editor");
    if (!editorElement) {
        console.error("Editor element not found");
        return;
    }
    
    window.view = new EditorView(editorElement, {state})

    // Initialize the suggestions state
    const toggleElement = document.querySelector("#toggleSuggestionMode") as HTMLInputElement;
    const showDeletedElement = document.querySelector("#showDeletedText") as HTMLInputElement;
    
    if (toggleElement && showDeletedElement) {
        window.view.dispatch(window.view.state.tr.setMeta(suggestionsPlugin, {
            inSuggestingMode: toggleElement.checked,
            showDeletedText: showDeletedElement.checked,
            metadata: { user: 'Anonymous', timestamp: Date.now() }
        }))

        // Add event listeners for the controls
        toggleElement.addEventListener("change", (e) => {
            console.log('Checkbox changed:', (e.target as HTMLInputElement).checked);
            const state = suggestionsPluginKey.getState(window.view.state);
            if (state) {
                console.log('Current suggestionMode state:', state.inSuggestingMode);
                window.view.dispatch(window.view.state.tr.setMeta(suggestionsPlugin, {
                    ...state,
                    inSuggestingMode: (e.target as HTMLInputElement).checked,
                }))
            }
        })

        showDeletedElement.addEventListener("change", (e) => {
            const state = suggestionsPluginKey.getState(window.view.state);
            if (state) {
                console.log('changing showDeletedText to', (e.target as HTMLInputElement).checked)
                window.view.dispatch(window.view.state.tr.setMeta(suggestionsPlugin, {
                    ...state,
                    showDeletedText: (e.target as HTMLInputElement).checked
                }))
            }
        })
    } else {
        console.error("Control elements not found");
    }
})
