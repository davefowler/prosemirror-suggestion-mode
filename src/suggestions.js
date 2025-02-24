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
        .suggestion-delete-hover {
            display: none;
            position: absolute;
            top: 0;
            right: 0;
            background-color: #ff3333;
            color: white;
        }
    `
    document.head.appendChild(style)
}


// Insertion inline decoration
function createInsertionDecoration(change) {
    return Decoration.inline(change.fromB, change.toB, { class: 'suggestion-add' });
}

// Deletion widget decoration
function createDeletionDecoration(change, originalDoc, showDeletedText) {
    // needs the original doc to get the deleted text using fromA and toA
    const deletedText = originalDoc.textBetween(change.fromA, change.toA, '', '\n')
    return Decoration.widget(change.fromB, () => {
        const container = document.createElement('span');
        container.className = 'suggestion-delete';
        container.setAttribute('data-deleted-text', deletedText)
        if (showDeletedText) {
            console.log('showDeletedText is true', change)
            container.textContent = deletedText
        }
        return container;
    });
}

export const suggestionsPlugin = new Plugin({
    key: suggestionsPluginKey,

    view() {
        injectStyles()
        return {}
    },

    state: {
        init(_, { doc, suggestions = { suggestionMode: false, showDeletedText: false, metaData: { user: 'Anonymous', timestamp: Date.now() } } }) {
            return {
                changeSet: ChangeSet.create(doc),
                suggestionMode: suggestions.suggestionMode,
                showDeletedText: suggestions.showDeletedText,
                metadata: suggestions.metaData
            }
        },
        
        apply(tr, value, oldState, newState) {
            const meta = tr.getMeta(suggestionsPlugin);
            const showDeletedText = meta && meta.showDeletedText !== undefined ? meta.showDeletedText : value.showDeletedText;
            const suggestionMode = meta && meta.suggestionMode !== undefined ? meta.suggestionMode : value.suggestionMode;

            if (!tr.docChanged || !suggestionMode) return { ...value, showDeletedText, suggestionMode };

            const stepMaps = tr.steps.map(step => step.getMap());
            const data = { user: value.username, timestamp: Date.now() };
            const updatedChangeSet = value.changeSet.addSteps(newState.doc, stepMaps, data);
            
            updatedChangeSet.changes.forEach(change => {
                const changeType = change.fromA === change.toA ? 'Insertion' : 'Deletion';
                console.log(`${changeType} detected:`, change);
            });

            return {
                ...value,
                changeSet: updatedChangeSet,
                showDeletedText,
                suggestionMode
            };
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
                    decorations.push(createInsertionDecoration(change))
                } else {
                    // Deletion
                    console.log('change.deleted', change.deleted, change, showDeletedText)
                    decorations.push(createDeletionDecoration(change, changeSet.startDoc, showDeletedText ))
                }
            })

            return DecorationSet.create(state.doc, decorations)
        }
    }
})
