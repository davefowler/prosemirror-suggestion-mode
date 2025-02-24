import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import { Schema, DOMParser } from "prosemirror-model"
import { schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { baseKeymap } from "prosemirror-commands"
import { keymap } from "prosemirror-keymap"
import { history } from "prosemirror-history"
import { suggestionsPlugin, suggestionsPluginKey } from "./suggestions.js"

const mySchema = schema

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
    window.view = new EditorView(document.querySelector("#editor"), {state})

    // Initialize the suggestions state
    view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
        inSuggestingMode: document.querySelector("#toggleSuggestionMode").checked,
        showDeletedText: document.querySelector("#showDeletedText").checked,
        metaData: { user: 'Anonymous', timestamp: Date.now() }
    }))

    // Add event listeners for the controls
    document.querySelector("#toggleSuggestionMode").addEventListener("change", (e) => {
        console.log('Checkbox changed:', e.target.checked); // Debugging log
        const state = suggestionsPluginKey.getState(view.state)
        console.log('Current suggestionMode state:', state.inSuggestingMode); // Debugging log
        view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
            ...state,
            inSuggestingMode: e.target.checked,
        }))
    })

    document.querySelector("#showDeletedText").addEventListener("change", (e) => {
        const state = suggestionsPluginKey.getState(view.state)
        console.log('changing showDeletedText to', e.target.checked)
        view.dispatch(view.state.tr.setMeta(suggestionsPlugin, {
            ...state,
            showDeletedText: e.target.checked
        }))
    })
})
