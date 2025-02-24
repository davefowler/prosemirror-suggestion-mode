import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin, suggestionsPluginKey } from "../suggestions"
import { history } from "prosemirror-history"
import { ChangeSet } from "prosemirror-changeset"

// Mock EditorView
class MockView {
    constructor(state) {
        this.state = state
    }
    dispatch(tr) {
        this.state = this.state.apply(tr)
    }
}

describe('ProseMirror Suggestions Plugin', () => {
    let state, view

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
        view = new MockView(state)
    })

    test('should initialize with suggestion mode enabled', () => {
        const pluginState = suggestionsPluginKey.getState(state)
        expect(pluginState.suggestionMode).toBe(true)
        expect(pluginState.metadata.user).toBe('Anonymous')
    })

    test('should track text insertion', () => {
        const tr = state.tr.insertText(' test', 11)
        const newState = state.apply(tr)
        
        // Get plugin state after change
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        // Verify the document content
        expect(newState.doc.textContent).toBe('Hello world test')

        // Verify changeset was created
        const decorations = suggestionsPlugin.spec.props.decorations(newState)
        expect(decorations).toBeDefined()
    })

    test('should track text deletion', () => {
        const tr = state.tr.delete(6, 11)
        const newState = state.apply(tr)
        
        // Get plugin state after change
        const pluginState = suggestionsPluginKey.getState(newState)
        expect(pluginState.suggestionMode).toBe(true)

        // Verify the document content
        expect(newState.doc.textContent).toBe('Hello ')

        // Verify changeset was created
        const decorations = suggestionsPlugin.spec.props.decorations(newState)
        expect(decorations).toBeDefined()
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
