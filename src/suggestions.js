import { Plugin, PluginKey } from "prosemirror-state"
import { ChangesetTracker } from "./changesetTracker.js"
import { ChangesetDecorator } from "./changesetDecorator.js"

export const suggestionsPluginKey = new PluginKey("suggestions")

// Create instances
const tracker = new ChangesetTracker()
const decorator = new ChangesetDecorator()

// Initialize tracker session
tracker.startSession({
    user: 'Anonymous',
    timestamp: Date.now()
})

export const suggestionsPlugin = new Plugin({
    key: suggestionsPluginKey,

    appendTransaction(transactions, oldState, newState) {
        const pluginState = this.getState(oldState)
        if (!pluginState.suggestionMode) return null

        // Record changes in the tracker
        const change = tracker.recordChange(oldState, newState)
        if (!change) return null

        // Get decorations from the decorator
        const decorations = decorator.createDecorations(newState.doc, change)
        
        // Store decorations in the transaction metadata
        return newState.tr.setMeta(this, { decorations })
    },

    state: {
        init() {
            return {
                suggestionMode: true,
                username: 'Anonymous',
                showDeletedText: true,
                metadata: {
                    user: 'Anonymous',
                    timestamp: Date.now()
                }
            }
        },
        
        apply(tr, value) {
            // If there's metadata associated with this transaction, merge it into the current state
            const meta = tr.getMeta(suggestionsPlugin);
            if (meta) {
                return {
                    ...value,
                    ...meta
                }
            }
            // Otherwise, return the existing state as-is
            return value
        }
    },

    props: {
        decorations(state) {
            const pluginState = this.getState(state)
            decorator.setShowDeletedText(pluginState.showDeletedText)
            return decorator.createDecorations(state.doc, tracker.changeset)
        }
    }
})
