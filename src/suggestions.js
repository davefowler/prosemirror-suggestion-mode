import { Plugin, PluginKey } from "prosemirror-state"

export const suggestionsPluginKey = new PluginKey("suggestions")

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
        if (!transactions.some(tr => tr.docChanged)) return null

        let tr = newState.tr

        // Handle each transaction
        transactions.forEach(transaction => {
            transaction.steps.forEach((step, index) => {
                // Get step mapping
                const map = transaction.mapping.maps[index]
                
                if (step.slice && step.slice.content.size) {
                    // This is an insertion
                    map.forEach((oldStart, oldEnd, newStart, newEnd) => {
                        tr = tr.addMark(
                            newStart,
                            newEnd,
                            newState.schema.marks.suggestion_add.create({
                                username: pluginState.username,
                                timestamp: Date.now()
                            })
                        )
                    })
                } else if (step.from !== undefined && step.to !== undefined) {
                    // This is a deletion
                    const deletedContent = oldState.doc.textBetween(step.from, step.to)
                    if (deletedContent) {
                        tr = tr.addMark(
                            step.from,
                            step.from + 1,
                            newState.schema.marks.suggestion_delete.create({
                                username: pluginState.username,
                                timestamp: Date.now(),
                                deletedText: deletedContent
                            })
                        )
                    }
                }
            })
        })

        return tr.steps.length ? tr : null
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
        handleKeyDown(view, event) {
            const state = this.getState(view.state)
            if (!state.suggestionMode) return false

            // Handle deletion specially
            if (event.key === 'Backspace' || event.key === 'Delete') {
                const { from, to } = view.state.selection
                if (from !== to) {
                    // There is a selection to delete
                    const tr = view.state.tr
                    const deletedContent = view.state.doc.textBetween(from, to)
                    
                    // Add deletion mark
                    tr.addMark(
                        from,
                        from + 1,
                        view.state.schema.marks.suggestion_delete.create({
                            username: state.username,
                            timestamp: Date.now(),
                            deletedText: deletedContent
                        })
                    )
                    
                    view.dispatch(tr)
                    return true
                }
            }
            return false
        }
    }
})
