import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin } from "../suggestions"
import { history } from "prosemirror-history"

describe('ProseMirror Suggestions Plugin', () => {
    let state

    beforeEach(() => {
        state = EditorState.create({
            schema,
            plugins: [history(), suggestionsPlugin]
        })
    })

    test('should track text insertion', () => {
        const tr = state.tr.insertText('Hello', 0)
        const newState = state.apply(tr)
        
        // Get the suggestion plugin state
        const pluginState = suggestionsPlugin.getState(newState)
        console.log('Plugin state after insertion:', pluginState)
        
        // Get the changeset
        const tracker = suggestionsPlugin.spec.props.decorations(newState)
        console.log('Decorations after insertion:', tracker)
    })

    test('should track text deletion', () => {
        // First insert some text
        let tr = state.tr.insertText('Hello World', 0)
        let newState = state.apply(tr)
        
        // Then delete some text
        tr = newState.tr.delete(0, 5)
        newState = newState.apply(tr)
        
        // Get the suggestion plugin state
        const pluginState = suggestionsPlugin.getState(newState)
        console.log('Plugin state after deletion:', pluginState)
        
        // Get the changeset
        const tracker = suggestionsPlugin.spec.props.decorations(newState)
        console.log('Decorations after deletion:', tracker)
    })
})
