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
  removeChange?: Change;
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
            background-color: rgba(255, 0, 0, 0.3);
            text-decoration: line-through; 
            position: relative;
            cursor: pointer;
            text-decoration-color: #ff3333;
            border-radius: 2px;
            text-decoration-style: solid;
            text-decoration-thickness: 2px;
            padding: 2px;
        }
        
        .suggestion-delete-compact::after {
            content: "x";
            text-align: center;
            color: #ff3333;
        }
        
        /* Custom tooltip styles */
        .suggestion-tooltip {
            visibility: hidden;
            position: absolute;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            text-align: left;
            border-radius: 4px;
            padding: 8px;
            white-space: pre-line;
            z-index: 1000;
            font-size: 12px;
            line-height: 1.4;
            width: max-content;
            max-width: 250px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s, visibility 0s linear 0.3s;
            margin: 5px;
        }
        
        /* Create an invisible buffer zone around the tooltip to make it easier to reach */
        .suggestion-delete::before {
            content: '';
            position: absolute;
            top: -20px;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 998;
        }
        
        /* Show tooltip on hover with no delay */
        .suggestion-delete:hover .suggestion-tooltip {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
            transition: opacity 0.3s, visibility 0s linear 0s;
        }
        
        /* Keep the tooltip visible when hovering over it directly */
        .suggestion-tooltip:hover {
            visibility: visible;
            opacity: 1;
            pointer-events: auto;
        }
        
        .suggestion-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #555;
        }
        
        .suggestion-button {
            padding: 4px 8px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            margin: 0 4px;
        }
        
        .suggestion-accept {
            background-color: #4caf50;
            color: white;
        }
        
        .suggestion-reject {
            background-color: #f44336;
            color: white;
        }
    `
    document.head.appendChild(style)
}

// Insertion inline decoration
function createInsertionDecoration(change: Change): Decoration {
    // The metadata is stored in the inserted spans
    const metadata = change.inserted.length > 0 ? change.inserted[0].data : null;
    
    // We'll add a data attribute for identifying this specific change
    const changeId = `${change.fromB}-${change.toB}-insert`;
    
    return Decoration.inline(change.fromB, change.toB, { 
      class: 'suggestion-add',
      'data-metadata': JSON.stringify(metadata),
      'data-change-id': changeId,
      'data-change-type': 'insertion'
    });
}

// Updated helper functions to handle accepting and rejecting changes
function acceptChange(view: any, change: Change) {
  const { state, dispatch } = view;
  
  if (change.fromA === change.toA) {
    // For insertions: keep the text but remove decoration
    const tr = state.tr;
    
    // We just need to update the changeSet by removing this change
    const meta = {
      removeChange: change
    };
    
    tr.setMeta(suggestionsPlugin, meta);
    dispatch(tr);
  } else {
    // For deletions: confirm the deletion by doing nothing
    // (The text is already marked as deleted, we just update the changeSet)
    const tr = state.tr;
    
    tr.setMeta(suggestionsPlugin, {
      removeChange: change
    });
    
    dispatch(tr);
  }
}

function rejectChange(view: any, change: Change) {
  const { state, dispatch } = view;
  
  if (change.fromA === change.toA) {
    // For insertions: remove the inserted text
    const tr = state.tr.delete(change.fromB, change.toB);
    
    // And remove this change from the changeSet
    tr.setMeta(suggestionsPlugin, {
      removeChange: change
    });
    
    dispatch(tr);
  } else {
    // For deletions: restore the text by removing the deletion marker
    const tr = state.tr;
    
    // Get the deleted text from the change's deleted spans
    const deletedText = change.deleted.reduce((text, span) => {
      // If we have deletedText stored in the data, use it
      if (span.data && span.data.deletedText) {
        return text + span.data.deletedText;
      }
      return text;
    }, "");
    
    // If we have the text, insert it back at the deletion position
    if (deletedText) {
      tr.insertText(deletedText, change.fromB);
    }
    
    // Remove this change from the changeSet
    tr.setMeta(suggestionsPlugin, {
      removeChange: change
    });
    
    dispatch(tr);
  }
}

// Update createDeletionDecoration to include more data for change recovery
function createDeletionDecoration(change: Change, originalDoc: Node, showDeletedText: boolean): Decoration {
    // needs the original doc to get the deleted text using fromA and toA
    const deletedText = originalDoc.textBetween(change.fromA, change.toA, '', '\n')
    // The metadata is stored in the deleted spans
    const metadata = change.deleted.length > 0 ? change.deleted[0].data : null;
    
    // Generate a unique identifier for this change
    const changeId = `${change.fromA}-${change.toA}-delete`;
    
    return Decoration.widget(change.fromB, (view) => {
        const container = document.createElement('span');
        container.className = 'suggestion-delete';
        container.setAttribute('data-deleted-text', deletedText);
        container.setAttribute('data-change-id', changeId);
        container.setAttribute('data-change-type', 'deletion');
        
        // Store change information as a serialized JSON string
        container.setAttribute('data-change', JSON.stringify({
            fromA: change.fromA,
            toA: change.toA,
            fromB: change.fromB,
            toB: change.toB
        }));
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'suggestion-tooltip';
        
        // Build tooltip content
        let tooltipContent = '';
        if (metadata && metadata.user) {
            tooltipContent += `Deleted by: ${metadata.user}\n`;
        }
        if (metadata && metadata.timestamp) {
            const date = new Date(metadata.timestamp);
            tooltipContent += `When: ${date.toLocaleString()}\n`;
        }
        if (!showDeletedText) {
            tooltipContent += `Deleted text: "${deletedText}"`;
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.textContent = tooltipContent.trim();
        tooltip.appendChild(infoDiv);
        
        // Add action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'suggestion-actions';
        
        const acceptButton = document.createElement('button');
        acceptButton.className = 'suggestion-button suggestion-accept';
        acceptButton.innerHTML = '✓ Accept';
        acceptButton.onclick = (e) => {
            e.stopPropagation();
            acceptChange(view, change);
        };
        
        const rejectButton = document.createElement('button');
        rejectButton.className = 'suggestion-button suggestion-reject';
        rejectButton.innerHTML = '✕ Reject';
        rejectButton.onclick = (e) => {
            e.stopPropagation();
            rejectChange(view, change);
        };
        
        actionsDiv.appendChild(acceptButton);
        actionsDiv.appendChild(rejectButton);
        tooltip.appendChild(actionsDiv);
        
        if (showDeletedText) {
            // Use a text node for the deleted text to not interfere with the tooltip
            const textNode = document.createTextNode(deletedText);
            container.appendChild(textNode);
        } else {
            container.classList.add('suggestion-delete-compact');
        }
        
        // Append tooltip last
        container.appendChild(tooltip);
        
        // Add JavaScript handler to maintain tooltip visibility when moving between elements
        container.addEventListener('mouseenter', () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
            tooltip.style.pointerEvents = 'auto';
        });
        
        return container;
    }, { 
      'data-metadata': JSON.stringify({
        ...metadata,
        deletedText 
      }),
      'data-change-id': changeId,
      'data-change-type': 'deletion'
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
            
            // Check if we're removing a change (accepting or rejecting)
            if (meta && meta.removeChange) {
                const changeToRemove = meta.removeChange;
                // Filter out the change to remove
                const filteredChanges = value.changeSet.changes.filter(change => 
                    !(change.fromA === changeToRemove.fromA && 
                      change.toA === changeToRemove.toA && 
                      change.fromB === changeToRemove.fromB && 
                      change.toB === changeToRemove.toB)
                );
                
                // Use type assertion to access internal properties
                type InternalChangeSet = {
                    config: any;
                    changes: Change[];
                };
                
                // Create a new ChangeSet with filtered changes
                const newChangeSet = Object.create(ChangeSet.prototype);
                Object.assign(newChangeSet, {
                    config: (value.changeSet as unknown as InternalChangeSet).config,
                    changes: filteredChanges
                });
                
                return {
                    ...value,
                    changeSet: newChangeSet as ChangeSet,
                    showDeletedText,
                    inSuggestingMode
                };
            }

            if (!tr.docChanged || !inSuggestingMode) return { ...value, showDeletedText, inSuggestingMode: inSuggestingMode };

            const stepMaps = tr.steps.map(step => step.getMap());
            const data = { user: value.username || 'Anonymous', timestamp: Date.now() };
            const updatedChangeSet = value.changeSet.addSteps(newState.doc, stepMaps, data);
            
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
