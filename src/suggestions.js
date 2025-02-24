import { Plugin, PluginKey } from "prosemirror-state"
import { ChangesetTracker } from "./changesetTracker"
import { ChangesetDecorator } from "./changesetDecorator"

export const suggestionsPluginKey = new PluginKey("suggestions")

// Create instances
const tracker = new ChangesetTracker()
const decorator = new ChangesetDecorator()

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
        // handle when a selection is deleted
        const pluginState = this.getState(oldState)
        if (!pluginState.suggestionMode) return null

        let tr = newState.tr
        let changed = false
        
        transactions.forEach(transaction => {
            // todo remove this getMeta stuff not needed
            // Skip if this is a suggestion transaction
            if (transaction.getMeta(this)) {
                console.log('skipping suggestion transaction', transaction)
                return
            }

            transaction.steps.forEach(step => {
                if (step instanceof ReplaceStep) {
                    const from = step.from
                    const to = step.to
                    const text = oldState.doc.textBetween(from, to, " ")
                    const newText = step.slice.content.textBetween(0, step.slice.content.size, " ")

                    console.log('replace step', step, 'text is', text, 'newText is', newText)
                    if (from === to) {
                        // This case will be handled in handleTextInput
                        console.log('skipping replace step', step, 'text is', text, 'newText is', newText)
                        return false
                    }
                    // Re-insert the old text and add a suggestion_delete
                    tr.setMeta(this, true)
                    tr.insertText(text, from, from)
                    const markTo = from + text.length
                    console.log('inserting mark on', text, 'at', from, 'to', markTo)
                    tr.addMark(from, markTo, newState.schema.marks.suggestion_delete.create({
                        createdAt: Date.now(),
                        username: pluginState.username,
                        data: {...pluginState.data, uniqueId: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}
                    }))
                    
                    // set the selection to the beginning of the text
                    if (newText.length > 0) {
                        tr.insertText(newText, from, from)
                        tr.addMark(from, from + newText.length, newState.schema.marks.suggestion_add.create({
                            createdAt: Date.now(),
                            username: pluginState.username,
                            data: pluginState.data,
                        }))
                    }
                    tr.setSelection(view.state.selection.constructor.near(tr.doc.resolve(from+newText.length)))

                    console.log('added suggestion_delete mark at', from, 'to', from + text.length)
                    changed = true
                }
            })
        })

        // Return the transaction if there were changes; otherwise return null
        return changed ? tr : null
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
            console.log('handleKeyDown: suggestionMode is', state.suggestionMode, 'and event.key is', event.key)
            if (!state.suggestionMode) return false

            // Handle delete and backspace
            if (event.key === "Delete" || event.key === "Backspace") {
                event.preventDefault();
                
                const tr = view.state.tr
                const {$from, $to} = view.state.selection
                console.log('handleKeyDown: deleting', $from.pos, $to.pos)
                let delFrom = $from.pos
                let delTo = $to.pos
                
                if ($from.pos === $to.pos) {
                    delFrom = event.key === "Backspace" ? $from.pos - 1 : $from.pos
                    delTo = event.key === "Backspace" ? $from.pos : $from.pos + 1
                }
                if (delFrom < 0 || delTo > view.state.doc.content.size) return false;

                // Check if any part of the selected range is inside a suggestion_add mark
                let isInsideAddMark = false;
                view.state.doc.nodesBetween(delFrom, delTo, (node, pos) => {
                    const marks = node.marks || [];
                    if (marks.some(m => m.type === view.state.schema.marks.suggestion_add)) {
                        isInsideAddMark = true;
                        return false; // let it continue and perform the delete
                    }
                });

                if (isInsideAddMark) {
                    console.log('Selection is inside an add mark');
                    // Perform a regular delete, not a suggestion_delete
                    return false; // let it continue and perform the delete
                }

                // check if a suggestion_delete mark exists just after this selection
                const $delPos = view.state.doc.resolve(delTo)
                const node = $delPos.nodeAfter;
                const marks = node ? node.marks : [];
                const existingMark = marks.find(m => m.type === view.state.schema.marks.suggestion_delete);
                
                // Additional debugging output
                console.log('Marks at position', $delPos.pos, ':', marks);
                console.log('Existing suggestion_delete mark:', existingMark);
                console.log('the letter at position', $delPos.pos, 'is', node ? node.text : 'N/A', node ? node.type : 'N/A');
                
                if (existingMark) {
                    let markFrom = $delPos.pos;
                    let markTo = $delPos.pos;

                    // Find the start of the mark
                    while (markFrom > 0) {
                        const $pos = view.state.doc.resolve(markFrom - 1);
                        if (!$pos.nodeAfter || !$pos.nodeAfter.marks.some(m => m.eq(existingMark))) {
                            break;
                        }
                        markFrom--;
                    }

                    // Find the end of the mark
                    while (markTo < view.state.doc.content.size) {
                        const $pos = view.state.doc.resolve(markTo);
                        if (!$pos.nodeAfter || !$pos.nodeAfter.marks.some(m => m.eq(existingMark))) {
                            break;
                        }
                        markTo++;
                    }

                    console.log('Existing mark range:', markFrom, 'to', markTo);
                    // You can now use markFrom and markTo as needed
                

                    // Expand the existing mark
                    tr.removeMark(
                        markFrom,
                        markTo,
                        view.state.schema.marks.suggestion_delete
                    )
                    console.log('removed mark from', markFrom, 'to', markTo)
                    // extend the del range to include the existing mark
                    delFrom =  Math.min(markFrom, delFrom)
                    delTo = Math.max(markTo, delTo)
                }

                // create a new suggestion_delete mark
                tr.addMark(
                    delFrom,
                    delTo,
                    view.state.schema.marks.suggestion_delete.create({
                        createdAt: Date.now(),
                        username: state.username,
                        data: state.data
                        
                    })
                )
                console.log('created suggestion_delete mark in range', delFrom, delTo)

                // Move cursor appropriately
                if (event.key === "Backspace") {
                    tr.setSelection(view.state.selection.constructor.near(tr.doc.resolve(delFrom)))
                } else {
                    tr.setSelection(view.state.selection.constructor.near(tr.doc.resolve(delTo)))
                }

                view.dispatch(tr)
                return true // delete handled.  returning true to stop further processing
            }
            return false
        },

        handleTextInput(view, from, to, text) {
            const state = this.getState(view.state)
            if (!state.suggestionMode) return false


            // todo meta stuff may not be needed
            const meta = view.state.tr.getMeta(suggestionsPlugin)
            console.log('meta is', meta)
            // 2) If we set skipHandleTextInput, skip this entire handler:
            if (meta && meta.skipHandleTextInput) {
              console.log('skipHandleTextInput is true, skipping handleTextInput', from, to, text)
              return false
            }
            console.log('1. handleTextInput', from, to, text.length, 'text is:', text)

            // Check if the input text matches the text being deleted
            const replacedText = view.state.doc.textBetween(from, to);
            if (text === replacedText) {
                console.log('Ignoring redundant input:', text);
                return true;  // ignore the redundant input
            }

            const tr = view.state.tr
            console.log('setting skipHandleTextInput meta')
            tr.setMeta(suggestionsPlugin, { skipHandleTextInput: true })

            // check if this input is inside an existing suggestion_add or suggestion_delete mark
            const $pos = view.state.doc.resolve(from)
            const node = $pos.nodeAfter;
            const marks = node ? node.marks : [];
            const existingMark = marks.find(m => m.type === view.state.schema.marks.suggestion_add || m.type === view.state.schema.marks.suggestion_delete);

            if (existingMark) {
                console.log('handleTextInput: input is already inside an existing suggestion_add or suggestion_delete mark.')
                return false; // allow the input to be processed
            }
            
            // check if there is a suggestion_add mark immediately before this input
            const $prevPos = view.state.doc.resolve(from)
            const prevNode = $prevPos.nodeBefore;
            const prevMarks = prevNode ? prevNode.marks : [];
            const prevExistingMark = prevMarks.find(m => m.type === view.state.schema.marks.suggestion_add);

            // Insert the text

            let newTo = from + text.length
            let newFrom = from

            if (prevExistingMark) {
                console.log('prevExistingMark found at', $prevPos.pos)
                // find the start of the prevExistingMark
                const markTo = $prevPos.pos;
                let markFrom = markTo;
                while (markFrom > 0) {
                    const $pos = view.state.doc.resolve(markFrom - 1);
                    if (!$pos.nodeAfter || !$pos.nodeAfter.marks.some(m => m.eq(prevExistingMark))) {
                        break;
                    }
                    markFrom--;
                }

                console.log('removing prevExistingMark range:', markFrom, 'to', markTo)
                // remove the prevExistingMark
                tr.removeMark(markFrom, markTo, view.state.schema.marks.suggestion_add)

                // extend the suggestion_add range to include the existing mark
                newFrom =  Math.min(markFrom, from)
                newTo = Math.max(markTo, from + text.length)
                console.log('extended suggestion_add range to:', newFrom, 'to', newTo)
            }

            console.log('inserting text', text, 'at', from, 'to', to)
            tr.insertText(text, from, to)


            console.log('creating new suggestion_add mark at', newFrom, 'to', newTo)
            // Create new mark with current timestamp and username
            const addMark = view.state.schema.marks.suggestion_add.create({
                createdAt: Date.now(),
                username: state.username,
                data: state.data
            })
            tr.addMark(newFrom, newTo, addMark)
            console.log('replaced text?', replacedText)

            if (replacedText.length > 0) {
                // Apply mark to the newly inserted text
                const replaceFrom = from + text.length
                console.log('inserting back in replaced text', replacedText, 'at', replaceFrom, 'to', replaceFrom)
                tr.insertText(replacedText, replaceFrom, replaceFrom)

                const deletedMark = view.state.schema.marks.suggestion_delete.create({
                    createdAt: Date.now(),
                    username: state.username,
                    data: state.data
                })
                console.log('adding deleted mark at', replaceFrom, 'to', replaceFrom + replacedText.length)
                tr.addMark(replaceFrom, replaceFrom + replacedText.length, deletedMark)

                // set the selection to the end of the new text
                tr.setSelection(view.state.selection.constructor.near(tr.doc.resolve(replaceFrom)))
            }

            view.dispatch(tr)
            return true; // input handled.  returning true to stop further processing
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
