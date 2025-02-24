import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin, suggestionsPluginKey } from "../suggestions"
import { history } from "prosemirror-history"

describe('ProseMirror Suggestions Plugin', () => {
    let state

    beforeEach(() => {
        state = EditorState.create({
            schema,
            plugins: [history(), suggestionsPlugin]
        })
    })

    test('should initialize with suggestion mode enabled', () => {
        const pluginState = suggestionsPluginKey.getState(state)
        expect(pluginState.suggestionMode).toBe(true)
    })

    test('should track text insertion', () => {
        const tr = state.tr.insertText('Hello', 0)
        const newState = state.apply(tr)
        
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        const decorations = suggestionsPlugin.spec.props.decorations(newState)
        expect(decorations).toBeDefined()
    })

    test('should track text deletion', () => {
        // First insert some text
        let tr = state.tr.insertText('Hello World', 0)
        let intermediateState = state.apply(tr)
        
        // Then delete some text
        tr = intermediateState.tr.delete(0, 5)
        const newState = intermediateState.apply(tr)
        
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        const decorations = suggestionsPlugin.spec.props.decorations(newState)
        expect(decorations).toBeDefined()
    })
})
