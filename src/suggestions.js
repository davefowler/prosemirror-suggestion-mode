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

        // Only process relevant transactions
        const relevant = transactions.some(tr => 
            tr.docChanged || tr.selectionSet || tr.storedMarksSet
        )
        if (!relevant) return null

        let tr = newState.tr

        // Compare old and new doc to find changes
        const changes = []
        newState.doc.descendants((node, pos) => {
            const oldNode = oldState.doc.nodeAt(pos)
            if (!oldNode || node.text !== oldNode.text) {
                changes.push({
                    from: pos,
                    to: pos + (node.text?.length || 0),
                    type: 'insertion'
                })
            }
        })

        // Handle deletions by comparing old doc positions
        oldState.doc.descendants((node, pos) => {
            const newNode = newState.doc.nodeAt(pos)
            if (!newNode) {
                changes.push({
                    from: pos,
                    to: pos + (node.text?.length || 0),
                    type: 'deletion',
                    text: node.text
                })
            }
        })

        // Apply marks for each change
        changes.forEach(change => {
            if (change.type === 'insertion') {
                tr = tr.addMark(
                    change.from,
                    change.to,
                    newState.schema.marks.suggestion_add.create({
                        username: pluginState.username,
                        timestamp: Date.now()
                    })
                )
            } else if (change.type === 'deletion') {
                // Create a deletion widget at the position
                const deletionMark = newState.schema.marks.suggestion_delete.create({
                    username: pluginState.username,
                    timestamp: Date.now(),
                    deletedText: change.text
                })
                tr = tr.addMark(change.from, change.from + 1, deletionMark)
            }
        })

        return tr
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
