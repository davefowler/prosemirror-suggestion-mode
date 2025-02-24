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

// Create the suggestions plugin
// Default tooltip renderer that can be overridden
const defaultTooltipRenderer = (mark, type) => {
    const date = new Date(mark.attrs.createdAt).toLocaleDateString()
    let text = type === 'delete' ? `Deleted by ${mark.attrs.username} on ${date}` :
                                  `Added by ${mark.attrs.username} on ${date}`
    
    // Add custom data if present
    if (mark.attrs.data) {
        try {
            const customData = typeof mark.attrs.data === 'string' ? 
                             JSON.parse(mark.attrs.data) : 
                             mark.attrs.data
            const dataStr = Object.entries(customData)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')
            text += `\nCustom data: ${dataStr}`
        } catch (e) {
            console.warn('Failed to parse custom data in suggestion mark:', e)
        }
    }
    return text
}

export const suggestionsPlugin = new Plugin({
    key: suggestionsPluginKey,

    appendTransaction(transactions, oldState, newState) {
        const pluginState = this.getState(oldState)
        if (!pluginState.suggestionMode) return null

        // Record changes in the tracker
        const change = tracker.recordChange(oldState, newState)
        if (!change) return null

        // No need to modify the transaction - changes are tracked in the changeset
        return null
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
        },

        handleKeyDown(view, event) {
            const state = this.getState(view.state)
            if (!state.suggestionMode) return false

            // Let all key events be handled normally - changes will be tracked by appendTransaction
            return false
        },

        handleTextInput(view, from, to, text) {
            const state = this.getState(view.state)
            if (!state.suggestionMode) return false

            // Let the change happen normally - it will be tracked by appendTransaction
            return false
        },

        // todo - delete as it does nothing
        handleDOMEvents: {
            beforeinput: (view, event) => {
                console.log('beforeinput event:', {
                    inputType: event.inputType,
                    data: event.data,
                    targetRange: event.getTargetRanges(),
                    selection: view.state.selection
                });
                if (event.inputType === "deleteContentForward" 
                    || event.inputType === "deleteContentBackward") {
                    // Intercept the delete of a selected range here
                    console.log('beforeinput event:', {
                        inputType: event.inputType,
                        data: event.data,
                        targetRange: event.getTargetRanges(),
                        selection: view.state.selection
                    });
                    // If you handle it, prevent ProseMirror's default by returning true
                    return true
                }

                return false // Let ProseMirror handle other beforeinput events
            }
        }
    }
})
