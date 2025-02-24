import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin, suggestionsPluginKey } from "../suggestions"
import { history } from "prosemirror-history"
import { ChangeSet } from "prosemirror-changeset"

describe('ProseMirror Suggestions Plugin', () => {
    let state

    beforeEach(() => {
        state = EditorState.create({
            schema,
            plugins: [history(), suggestionsPlugin],
            doc: schema.node("doc", null, [
                schema.node("paragraph", null, [
                    schema.text("Hello world")
                ])
            ])
        })
    })

    test('should initialize with suggestion mode enabled', () => {
        const pluginState = suggestionsPluginKey.getState(state)
        expect(pluginState.suggestionMode).toBe(true)
        expect(pluginState.metadata.user).toBe('Anonymous')
    })

    test('should track text insertion', () => {
        const tr = state.tr.insertText(' test', 11) // Insert at end of "Hello world"
        const newState = state.apply(tr)
        
        // Verify plugin state remains correct
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        // Verify the document content
        expect(newState.doc.textContent).toBe('Hello world test')
    })

    test('should track text deletion', () => {
        // Delete "world"
        const tr = state.tr.delete(6, 11)
        const newState = state.apply(tr)
        
        // Verify plugin state remains correct
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        // Verify the document content
        expect(newState.doc.textContent).toBe('Hello ')
    })

    test('should toggle suggestion mode', () => {
        const tr = state.tr.setMeta(suggestionsPlugin, {
            suggestionMode: false,
            username: 'Anonymous'
        })
        const newState = state.apply(tr)
        
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(false)
    })
})
