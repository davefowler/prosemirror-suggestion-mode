import { Plugin, PluginKey } from "prosemirror-state"
import { ChangeSet } from "prosemirror-changeset"
import { Decoration, DecorationSet } from "prosemirror-view"

export const suggestionsPluginKey = new PluginKey("suggestions")

function injectStyles() {
    const style = document.createElement('style')
    style.textContent = `
        .suggestion-add {
            background-color: #e6ffe6;
            border-radius: 2px;
            border-bottom: 2px solid #00cc00;
        }
        .suggestion-delete {
            background-color: rgba(255, 0, 0, 0.3); /* Red background for deletions */
            text-decoration: line-through; 
            position: relative;
            cursor: pointer;
            text-decoration-color: #ff3333;
            border-radius: 2px;
            text-decoration-style: solid;
            text-decoration-thickness: 2px;
        }
    `
    document.head.appendChild(style)
}

export const suggestionsPlugin = new Plugin({
    key: suggestionsPluginKey,

    view() {
        injectStyles()
        return {}
    },

    state: {
        init(_, { doc }) {
            return {
                changeSet: ChangeSet.create(doc),
                suggestionMode: true,
                username: 'Anonymous',
                showDeletedText: true,
                metadata: {
                    user: 'Anonymous',
                    timestamp: Date.now()
                }
            }
        },
        
        apply(tr, value, oldState, newState) {
            if (!tr.docChanged) return value

            const stepMaps = tr.steps.map(step => step.getMap())
            const data = { user: value.username, timestamp: Date.now() }

            const updatedChangeSet = value.changeSet.addSteps(newState.doc, stepMaps, data)

            updatedChangeSet.changes.forEach(change => {
                const changeType = change.fromA === change.toA ? 'Insertion' : 'Deletion'
                console.log(`${changeType} detected:`, change)
            })

            return {
                ...value,
                changeSet: updatedChangeSet
            }
        }
    },

    props: {
        decorations(state) {
            const pluginState = this.getState(state)
            const { changeSet, showDeletedText } = pluginState
            const decorations = []

            changeSet.changes.forEach(change => {
                if (change.fromA === change.toA) {
                    // Insertion
                    decorations.push(Decoration.inline(change.fromB, change.toB, { class: 'suggestion-add' }))
                } else {
                    // Deletion
                    if (showDeletedText) {
                        // Map the positions from the old document to the new document
                        const from = state.tr.mapping.map(change.fromA)
                        const to = state.tr.mapping.map(change.toA)
                        console.log('Mapped positions:', { from, to }, 'changed from', change)
                        decorations.push(Decoration.inline(from, to, { class: 'suggestion-delete' }))
                    }
                }
            })

            return DecorationSet.create(state.doc, decorations)
        }
    }
})
