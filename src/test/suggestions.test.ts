import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin, suggestionsPluginKey } from "../suggestions"
import { history } from "prosemirror-history"
import { ChangeSet } from "prosemirror-changeset"
import { DecorationSet, EditorView } from "prosemirror-view"

describe('ProseMirror Suggestions Plugin', () => {
    let state: EditorState
    let view: { state: EditorState; dispatch: (tr: any) => void }

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
        // Mock view for testing
        view = {
            state,
            dispatch: (tr) => {
                state = state.apply(tr)
                view.state = state
            }
        }
    })

    describe('Initialization', () => {
        test('should initialize with suggestion mode enabled', () => {
            const pluginState = suggestionsPluginKey.getState(state)
            expect(pluginState?.inSuggestingMode).toBe(true)
        })

        test('should have proper initial metadata', () => {
            const pluginState = suggestionsPluginKey.getState(state)
            expect(pluginState?.metadata).toEqual(expect.objectContaining({
                user: 'Anonymous',
                timestamp: expect.any(Number)
            }))
        })
    })

    describe('Change Tracking', () => {
        test('should track text insertion with changeset', () => {
            const tr = state.tr.insertText(' test', 11)
            const newState = state.apply(tr)
            
            // Get decorations directly from the plugin
            const pluginState = suggestionsPluginKey.getState(newState);
            expect(pluginState).toBeDefined();
            
            // Create decorations manually for testing
            const decorations = suggestionsPlugin.props.decorations?.(newState);
            expect(decorations).toBeInstanceOf(DecorationSet);
            
            // Verify the document content
            expect(newState.doc.textContent).toBe('Hello world test');
            
            // Check if plugin state has changes
            expect(pluginState?.changeSet.changes.length).toBeGreaterThan(0);
            expect(changes?.length).toBeGreaterThan(0)
            expect(newState.doc.textContent).toBe('Hello world test')
            
            // Verify the plugin is tracking changes
            const change = pluginState?.changeSet.changes[0];
            expect(change).toBeDefined();
        })

        test('should track text deletion with changeset', () => {
            const tr = state.tr.delete(6, 11)
            const newState = state.apply(tr)
            
            // Get plugin state
            const pluginState = suggestionsPluginKey.getState(newState);
            expect(pluginState).toBeDefined();
            
            // Create decorations manually for testing
            const decorations = suggestionsPlugin.props.decorations?.(newState);
            expect(decorations).toBeInstanceOf(DecorationSet);
            
            // Verify the document content
            expect(newState.doc.textContent).toBe('Hello ');
            
            // Check if plugin state has changes
            expect(pluginState?.changeSet.changes.length).toBeGreaterThan(0);
            
            // Verify the change is a deletion
            const change = pluginState?.changeSet.changes[0];
            expect(change).toBeDefined();
            expect(change?.fromA).not.toBe(change?.toA);
        })
    })

    describe('Plugin State Management', () => {
        test('should toggle suggestion mode', () => {
            const tr = state.tr.setMeta(suggestionsPlugin, {
                inSuggestingMode: false,
                username: 'Anonymous'
            })
            const newState = state.apply(tr)
            
            const pluginState = suggestionsPluginKey.getState(newState)
            expect(pluginState?.inSuggestingMode).toBe(false)
        })

        test('should toggle deleted text visibility', () => {
            const tr = state.tr.setMeta(suggestionsPlugin, {
                showDeletedText: false
            })
            const newState = state.apply(tr)
            
            const pluginState = suggestionsPluginKey.getState(newState)
            expect(pluginState?.showDeletedText).toBe(false)
        })
    })

    describe('Changeset Operations', () => {
        test('should create valid changesets', () => {
            const tr = state.tr.insertText(' test', 11)
            const oldDoc = state.doc
            const newState = state.apply(tr)
            
            const changeset = ChangeSet.create(oldDoc)
            changeset.addSteps(newState.doc, tr.mapping.maps)
            expect(changeset).toBeDefined()
            expect(changeset.changes).toBeDefined()
        })

        test('should store data with changes', () => {
            const tr = state.tr.insertText(' test', 11)
            const newState = state.apply(tr)
            
            const pluginState = suggestionsPluginKey.getState(newState);
            expect(pluginState).toBeDefined();
            
            // Check if plugin state has changes
            expect(pluginState?.changeSet.changes.length).toBeGreaterThan(0);
            
            // Verify the change has data
            const change = pluginState?.changeSet.changes[0];
            expect(change).toBeDefined();
            expect(change?.data).toBeDefined();
        })
    })
})
