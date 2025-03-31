import { Plugin, Transaction, EditorState } from 'prosemirror-state';
import {
  ReplaceStep,
  AddMarkStep,
  RemoveMarkStep,
  ReplaceAroundStep,
  Transform,
  Mapping,
  Step,
} from 'prosemirror-transform';
import {
  SuggestionModePluginState,
  suggestionPluginKey,
  suggestionTransactionKey,
} from './key';
import {
  SuggestionHoverMenuRenderer,
  hoverMenuFactory,
  SuggestionHoverMenuOptions,
} from './hoverMenu';
import { createDecorations } from './decorations';
import { initSuggestionHoverListeners } from './hoverHandlers';
import { findNonStartingPos } from './helpers/nodePosition';

type AnyStep = ReplaceStep | AddMarkStep | RemoveMarkStep | ReplaceAroundStep;

// Plugin options interface
export interface SuggestionModePluginOptions {
  inSuggestionMode?: boolean; // starting status of suggestion mode
  username?: string;
  data?: Record<string, any>;
  hoverMenuRenderer?: SuggestionHoverMenuRenderer;
  hoverMenuOptions?: SuggestionHoverMenuOptions;
}

// Create the suggestions plugin
export const suggestionModePlugin = (
  options: SuggestionModePluginOptions = {}
) => {
  // If custom options but no renderer is provided, use default renderer with custom options
  const renderHoverMenu =
    options.hoverMenuRenderer ||
    hoverMenuFactory(options?.hoverMenuOptions || {});

  // Store listeners for cleanup
  let currentListeners: WeakMap<HTMLElement, any> | null = null;

  return new Plugin({
    key: suggestionPluginKey,

    // After a transaction is applied we add our suggestion marks to it
    // This will not impact undo/redo as ProseMirror's history plugin
    // automatically combines related transactions that happen close together in time
    // this is chosen over wrapping dispatchTransaction because it will keep a clean set of steps
    // and be less likely to interfere with other plugins.
    appendTransaction(
      transactions: readonly Transaction[],
      oldState: EditorState,
      newState: EditorState
    ) {
      // handle when a selection is deleted
      const pluginState = this.getState(oldState);

      let tr = newState.tr;
      let changed = false;

      // For handling multiple transforming steps in this dispatch
      // we need to keep track of the intermediate doc inbetween each step
      // so we can get the correct slice
      // Mapping is not enough because if you for instance delete a range,
      // and then delete another range around that first range
      // you can't just get the second deleted slice with simple mapping

      let intermediateTr = new Transform(oldState.doc);
      let lastStep: AnyStep | null = null;

      // After transactions are applied, apply transactions needed for the suggestion marks
      transactions.forEach((transaction, trIndex) => {
        // If the transaction is part of undo/redo history, skip it
        if (transaction.getMeta('history$')) return;

        // Get the meta for this transaction from transaction metadata, with global meta defaults
        // Transaction only meta gets global meta defaults
        const transactionMeta = transaction.getMeta(suggestionTransactionKey);
        const mergedData = {
          ...pluginState.data,
          ...transactionMeta?.data,
        };
        const meta = {
          ...pluginState,
          ...transactionMeta,
          data: mergedData,
        };
        // If we're not in suggestion mode do nothing
        if (!meta.inSuggestionMode) return;
        // if this is a transaction that we created in this plugin, ignore it
        if (meta && meta.skipSuggestionOperation) return;

        const username = meta.username;

        // Process each step in the transaction
        // This works for all 4 types of steps: ReplaceStep, AddMarkStep, RemoveMarkStep, ReplaceAroundStep
        transaction.steps.forEach((step: AnyStep, stepIndex: number) => {
          // update intermediateState if there was a previous step
          if (lastStep) intermediateTr.step(lastStep);
          lastStep = step;
          // Each transaction has two optional parts:
          //   1. removedSlice - content that should be marked as suggestion_delete
          //   2. addedSlice - content that should be marked as suggestion_insert
          const removedSlice = intermediateTr.doc.slice(
            step.from,
            step.to,
            false
          );

          // we don't actually use/need the addedSlice, we just need its size to mark it
          // in all but the ReplaceStep, the removedSlice is the same size as the addedSlice
          let addedSliceSize =
            step instanceof ReplaceStep ? step.slice.size : removedSlice.size;
          let extraInsertChars = 0;
          if (step instanceof ReplaceAroundStep) {
            // TODO this extrainsertchars is wrong
            addedSliceSize = step.gapTo - step.gapFrom + step.slice.size;
          }
          // Mark our next transactions as an internal suggestion operation so it won't be intercepted again
          tr.setMeta(suggestionTransactionKey, {
            skipSuggestionOperation: true,
          });

          // Check if we're inside an existing suggestion mark
          const $pos = intermediateTr.doc.resolve(step.from);
          const marksAtPos = $pos.marks();
          const suggestionMark = marksAtPos.find(
            (m) =>
              m.type.name === 'suggestion_insert' ||
              m.type.name === 'suggestion_delete'
          );
          let from = step.from;
          if (suggestionMark) {
            if (addedSliceSize > 1) {
              // a paste has happened in the middle of a suggestion mark
              // make sure it has the same mark as the surrounding text
              tr.addMark(from, from + addedSliceSize, suggestionMark);
              changed = true;
            }
            // We are already inside a suggestion mark so we don't need to do anything
            return;
          }

          if (removedSlice.size > 0) {
            // DELETE - content was removed.
            // We need to put it back and add a suggestion_delete mark on it

            const isBackspace =
              (step instanceof ReplaceStep ||
                step instanceof ReplaceAroundStep) &&
              step.slice.size === 0 &&
              newState.selection.from === step.from;

            // first map its position to the new doc
            // grab all the unprocessed steps left in the transaction into a mapping
            const mapToNewDocPos: Mapping = transactions
              .slice(trIndex)
              .reduce((acc, tr, i) => {
                const startStep = i === 0 ? stepIndex : 0;
                tr.steps.slice(startStep).forEach((s) => {
                  acc.appendMap(s.getMap());
                });
                return acc;
              }, new Mapping());

            // map to the new doc position
            from = mapToNewDocPos.map(step.from);
            // then map to what we've done in suggestion transactions so far
            from = tr.mapping.map(from);

            const $from = tr.doc.resolve(from);
            from = findNonStartingPos($from);

            if (removedSlice.openEnd + removedSlice.openStart > 0) {
              let currentPos = 0;
              const pilcrowPositions: number[] = [];
              removedSlice.content.forEach((node, offset, index) => {
                if (
                  index >=
                  removedSlice.content.childCount - removedSlice.openEnd
                )
                  // Don't add pilcrows for open ended nodes
                  return;

                // If it's a block node, add its end position
                if (node.isBlock) {
                  pilcrowPositions.push(currentPos + node.nodeSize - 2); // -2 to get inside the closing tag
                }
                currentPos += node.nodeSize;
              });
              // First insert the slice normally
              tr.replace(from, from, removedSlice);

              // Then insert pilcrows at the end of each block
              let extraChars = 0;
              pilcrowPositions.forEach((pos) => {
                tr.insertText('¶', from + pos + extraChars);
                extraChars += 1;
              });

              // console.log('last child', removedSlice.content.lastChild);
              const endsWithText =
                removedSlice.content.lastChild?.textContent.length > 0;
              // console.log('has text at end?', endsWithText);
              if (removedSlice.openEnd > 0 && !endsWithText) {
                // if the last open node is empty, add a zero width space to be marked
                // console.log('adding zero width space');
                tr.insertText('\u200B', from + currentPos + extraChars);
                extraChars += 1;
              }

              // Add mark with expanded size to cover the pilcrows
              tr.addMark(
                from,
                from + removedSlice.size + extraChars,
                newState.schema.marks.suggestion_delete.create({
                  username,
                  data: meta.data,
                })
              );
            } else {
              // Normal case without block boundaries
              tr.replace(from, from, removedSlice);
              tr.addMark(
                from,
                from + removedSlice.size,
                newState.schema.marks.suggestion_delete.create({
                  username,
                  data: meta.data,
                })
              );
            }

            if (isBackspace) {
              // place the cursor at the front if there was a backspace
              tr.setSelection(tr.selection.constructor.create(tr.doc, from));
            }

            changed = true;
          }

          if (addedSliceSize > 0) {
            // ReplaceAroundStep has an insert property that is the number of extra characters inserted
            // for things like numbers in a list item

            const addedFrom = from + removedSlice.size;
            const addedTo = addedFrom + addedSliceSize + extraInsertChars;
            // just mark it, it was already inserted before appendTransaction
            tr.addMark(
              addedFrom,
              addedTo,
              newState.schema.marks.suggestion_insert.create({
                username,
                data: meta.data,
              })
            );
            changed = true;
          }
        });
      });

      // Return the transaction if there were changes; otherwise return null
      return changed ? tr : null;
    },

    state: {
      init(): SuggestionModePluginState {
        return {
          inSuggestionMode: options.inSuggestionMode || false,
          username: options.username || 'Anonymous',
          data: options.data || {},
        };
      },

      apply(
        tr: Transaction,
        value: SuggestionModePluginState
      ): SuggestionModePluginState {
        // If there's global metadata associated with this transaction, merge it into the current state
        const meta = tr.getMeta(suggestionPluginKey);
        const data = {
          ...value.data,
          ...meta?.data,
        };
        if (meta) {
          return {
            ...value,
            ...meta,
            data,
          };
        }
        // Otherwise, return the existing state as-is
        return value;
      },
    },

    props: {
      decorations(state: EditorState) {
        if (options.hoverMenuOptions?.disabled) return null;
        return createDecorations(state, renderHoverMenu);
      },
    },

    view(view) {
      if (options.hoverMenuOptions?.disabled) return null;
      // Initialize listeners when the view is created
      setTimeout(() => {
        currentListeners = initSuggestionHoverListeners(view);
      }, 0);

      return {
        update(view, prevState) {
          // Re-initialize listeners when the decorations might have changed
          if (view.state.doc !== prevState.doc) {
            setTimeout(() => {
              currentListeners = initSuggestionHoverListeners(view);
            }, 0);
          }
        },
        destroy() {
          // Cleanup would happen automatically with WeakMap
          currentListeners = null;
        },
      };
    },
  });
};
