import { Plugin, PluginKey } from "prosemirror-state"
import { ChangeSet } from "prosemirror-changeset"
import { ChangesetDecorator } from "./changesetDecorator.js"

export const suggestionsPluginKey = new PluginKey("suggestions")

export const suggestionsPlugin = new Plugin({
    key: suggestionsPluginKey,

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
            return {
                ...value,
                changeSet: updatedChangeSet
            }
        }
    },

    props: {
        decorations(state) {
            const pluginState = this.getState(state)
            const decorator = new ChangesetDecorator()
            decorator.setShowDeletedText(pluginState.showDeletedText)
            return decorator.createDecorations(state.doc, pluginState.changeSet)
        }
    }
})
