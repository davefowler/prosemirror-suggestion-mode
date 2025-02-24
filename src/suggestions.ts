import { Plugin, PluginKey, Transaction, EditorState } from "prosemirror-state"
import { ChangeSet, Change } from "prosemirror-changeset"
import { Decoration, DecorationSet } from "prosemirror-view"
import { Node } from "prosemirror-model"

export interface SuggestionsMeta {
  showDeletedText?: boolean;
  inSuggestingMode?: boolean;
  username?: string;
  metadata?: {
    user: string;
    timestamp: number;
  };
}

export interface SuggestionsPluginState {
  changeSet: ChangeSet;
  inSuggestingMode: boolean;
  showDeletedText: boolean;
  metadata: {
    user: string;
    timestamp: number;
  };
  username?: string;
}

export interface ChangeMetadata {
  user: string;
  timestamp: number;
  deletedText?: string;
}

export const suggestionsPluginKey = new PluginKey<SuggestionsPluginState>("suggestions")

function injectStyles(): void {
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
function createInsertionDecoration(change: Change): Decoration {
    return Decoration.inline(change.fromB, change.toB, { 
      class: 'suggestion-add',
      metadata: change.meta as ChangeMetadata
    });
}

// Deletion widget decoration
function createDeletionDecoration(change: Change, originalDoc: Node, showDeletedText: boolean): Decoration {
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
    }, { 
      metadata: { 
        ...(change.meta as ChangeMetadata), 
        deletedText 
      } 
    });
}

export const suggestionsPlugin = new Plugin<SuggestionsPluginState>({
    key: suggestionsPluginKey,

    view() {
        injectStyles()
        return {}
    },

    state: {
        init(_, { doc }): SuggestionsPluginState {
            return {
                changeSet: ChangeSet.create(doc),
                inSuggestingMode: false, // Default value
                showDeletedText: true,  // Default value
                metadata: { user: 'Anonymous', timestamp: Date.now() } // Default metadata
            }
        },
        
        apply(tr: Transaction, value: SuggestionsPluginState, oldState: EditorState, newState: EditorState): SuggestionsPluginState {
            const meta = tr.getMeta(suggestionsPlugin) as SuggestionsMeta | undefined;
            const showDeletedText = meta && meta.showDeletedText !== undefined ? meta.showDeletedText : value.showDeletedText;
            const inSuggestingMode = meta && meta.inSuggestingMode !== undefined ? meta.inSuggestingMode : value.inSuggestingMode;

            if (!tr.docChanged || !inSuggestingMode) return { ...value, showDeletedText, inSuggestingMode: inSuggestingMode };

            const stepMaps = tr.steps.map(step => step.getMap());
            const data = { user: value.username || 'Anonymous', timestamp: Date.now() };
            const updatedChangeSet = value.changeSet.addSteps(newState.doc, stepMaps, data);
            
            updatedChangeSet.changes.forEach(change => {
                const changeType = change.fromA === change.toA ? 'Insertion' : 'Deletion';
                console.log(`${changeType} detected:`, change);
            });

            return {
                ...value,
                changeSet: updatedChangeSet,
                showDeletedText,
                inSuggestingMode
            };
        }
    },

    props: {
        decorations(state: EditorState): DecorationSet | undefined {
            const pluginState = this.getState(state)
            if (!pluginState) return undefined;
            
            const { changeSet, showDeletedText } = pluginState
            const decorations: Decoration[] = []

            changeSet.changes.forEach(change => {
                if (change.fromA === change.toA) {
                    // Insertion
                    decorations.push(createInsertionDecoration(change))
                } else {
                    // Deletion
                    console.log('change.deleted', change.deleted, change, showDeletedText)
                    decorations.push(createDeletionDecoration(change, changeSet.startDoc, showDeletedText))
                }
            })

            return DecorationSet.create(state.doc, decorations)
        }
    }
})
