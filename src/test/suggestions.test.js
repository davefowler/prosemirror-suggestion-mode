import { EditorState } from "prosemirror-state"
import { schema } from "../schema"
import { suggestionsPlugin, suggestionsPluginKey } from "../suggestions"
import { history } from "prosemirror-history"
import { ChangeSet } from "prosemirror-changeset"
import { DecorationSet } from "prosemirror-view"

describe('ProseMirror Suggestions Plugin', () => {
    let state
    let view

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
            expect(pluginState.suggestionMode).toBe(true)
            expect(pluginState.username).toBe('Anonymous')
        })

        test('should have proper initial metadata', () => {
            const pluginState = suggestionsPluginKey.getState(state)
            expect(pluginState.metadata).toEqual(expect.objectContaining({
                user: 'Anonymous',
                timestamp: expect.any(Number)
            }))
        })
    })

    describe('Change Tracking', () => {
        test('should track text insertion with changeset', () => {
            const tr = state.tr.insertText(' test', 11)
            const newState = state.apply(tr)
            
            // Verify changeset creation
            const decorations = suggestionsPlugin.spec.props.decorations(newState)
            expect(decorations).toBeInstanceOf(DecorationSet)
            
            // Verify insertion is tracked
            const decos = []
            decorations.find(0, newState.doc.content.size, spec => {
                decos.push(spec)
                return false
            })
            
            // Verify the changeset contains the insertion
            const changes = decorations.find()
            expect(changes.length).toBeGreaterThan(0)
            expect(newState.doc.textContent).toBe('Hello world test')
            
            // Verify metadata
            const change = changes[0]
            expect(change.spec.metadata).toBeDefined()
            expect(change.spec.metadata.user).toBe('Anonymous')
        })

        test('should track text deletion with changeset', () => {
            const tr = state.tr.delete(6, 11)
            const newState = state.apply(tr)
            
            const decorations = suggestionsPlugin.spec.props.decorations(newState)
            expect(decorations).toBeInstanceOf(DecorationSet)
            
            // Verify deletion is tracked
            const decos = []
            decorations.find(0, newState.doc.content.size, spec => {
                decos.push(spec)
                return false
            })
            
            // Verify the changeset contains the deletion
            const changes = decorations.find()
            expect(changes.length).toBeGreaterThan(0)
            expect(newState.doc.textContent).toBe('Hello ')
            
            // Verify the deleted content is tracked
            const change = changes[0]
            expect(change.spec.metadata).toBeDefined()
            expect(change.spec.metadata.deletedText).toBe('world')
        })
    })

    describe('Plugin State Management', () => {
        test('should toggle suggestion mode', () => {
            const tr = state.tr.setMeta(suggestionsPlugin, {
                suggestionMode: false,
                username: 'Anonymous'
            })
            const newState = state.apply(tr)
            
            const pluginState = suggestionsPluginKey.getState(newState)
            expect(pluginState.suggestionMode).toBe(false)
        })

        test('should toggle deleted text visibility', () => {
            const tr = state.tr.setMeta(suggestionsPlugin, {
                showDeletedText: false
            })
            const newState = state.apply(tr)
            
            const pluginState = suggestionsPluginKey.getState(newState)
            expect(pluginState.showDeletedText).toBe(false)
        })
    })

    describe('Changeset Operations', () => {
        test('should create valid changesets', () => {
            const tr = state.tr.insertText(' test', 11)
            const oldDoc = state.doc
            const newState = state.apply(tr)
            
            const changeset = ChangeSet.create(oldDoc, newState.doc)
            expect(changeset).toBeDefined()
            expect(typeof changeset.getChanges).toBe('function')
        })

        test('should store metadata with changes', () => {
            const tr = state.tr.insertText(' test', 11)
            const newState = state.apply(tr)
            
            const decorations = suggestionsPlugin.spec.props.decorations(newState)
            const decos = []
            decorations.find(0, newState.doc.content.size, spec => {
                decos.push(spec)
                return false
            })
            
            const changeDeco = decos.find(d => d.spec && d.spec.class === 'suggestion-add')
            expect(changeDeco).toBeDefined()
            expect(changeDeco.spec.metadata).toEqual(expect.objectContaining({
                user: expect.any(String),
                timestamp: expect.any(Number)
            }))
        })
    })
})
