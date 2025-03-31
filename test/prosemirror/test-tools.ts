import {
  suggestionPluginKey,
  applySuggestion,
  TextSuggestion,
  createApplySuggestionCommand,
  suggestionTransactionKey,
} from '../../src';
import {
  doc,
  p,
  sdel,
  testSuggestionTransform,
  createEditorView,
  createEditorState,
} from '../helpers/builderWithPlugin';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';

/**
 * Helper function to test applying a suggestion to a ProseMirror document
 *
 * @param initialDoc - The initial document content
 * @param suggestion - The suggestion to apply
 * @param expectedContent - The expected document content after applying the suggestion
 * @param expectedResult - Whether the applySuggestion operation is expected to succeed
 * @param dryRun - Whether to run in dry run mode
 * @returns The EditorView after applying the suggestion
 */
const testApplySuggestion = (
  initialDoc: Node,
  suggestion: TextSuggestion,
  expectedContent?: string,
  expectedResult: boolean = true,
  dryRun: boolean = false
): EditorView => {
  const view = createEditorView(initialDoc, false); // suggestion mode is off for regular inserts!
  const result = applySuggestion(view, suggestion, 'testUser', dryRun);

  // Validate the operation result matches expectations
  expect(result).toBe(expectedResult);

  if (expectedContent !== undefined) {
    expect(view.state.doc.textContent).toBe(expectedContent);
  }

  return view;
};

describe('applySuggestion tool tests', () => {
  let originalConsoleWarn: typeof console.warn;

  beforeEach(() => {
    originalConsoleWarn = console.warn;
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  test('transaction after applySuggestion should not be inSuggestionMode', () => {
    const d = doc(p('hello there'));
    const view = testApplySuggestion(
      d,
      {
        textToReplace: 'there',
        textReplacement: 'world',
      },
      'hello thereworld',
      true
    );
    expect(view.state.tr.getMeta(suggestionPluginKey)?.inSuggestionMode).toBe(
      undefined
    );

    // Create a transaction and store it
    const tr = view.state.tr.delete(0, 3);
    // Dispatch the transaction we just created
    view.dispatch(tr);

    expect(tr.doc.textContent).toBe('llo thereworld');
  });

  test('should handle suggestions with empty textToReplace if there is text before or after', () => {
    testApplySuggestion(
      doc(p('hello there')),
      {
        textBefore: 'hello ',
        textToReplace: '',
        textReplacement: 'new text',
        reason: 'test reason',
      },
      'hello new textthere',
      true
    );
  });

  test('should return false if textToReplace is undefined', () => {
    testApplySuggestion(
      doc(p('hello there')),
      {
        textToReplace: undefined as unknown as string,
        textReplacement: 'new text',
      },
      'hello there',
      false
    );
  });

  test('should return false if textToReplace, textBefore and textAfter are empty but the document is not empty', () => {
    testApplySuggestion(
      doc(p('non empty document')),
      {
        textToReplace: '',
        textReplacement: 'new text',
      },
      'non empty document',
      false
    );

    // but work if the document is empty
    testApplySuggestion(
      doc(p('')),
      {
        textToReplace: '',
        textReplacement: 'new text',
      },
      'new text',
      true
    );
  });

  test('it should apply a reason if provided', () => {
    const view = testApplySuggestion(
      doc(p('hello there')),
      {
        textToReplace: 'there',
        textReplacement: 'world',
        reason: 'we want to say hi to the world',
      },
      'hello thereworld',
      true
    );

    // check that the reason is a data attr on the suggestion_insert mark
    const pos14$ = view.state.doc.resolve(14);
    const suggestionAddMark = pos14$
      .marks()
      .find((mark) => mark.type.name === 'suggestion_insert');
    expect(suggestionAddMark?.attrs.data.reason).toBe(
      'we want to say hi to the world'
    );
  });

  test('it should apply if the content is all whitespace', () => {
    testApplySuggestion(
      doc(p('\u200B')),
      {
        textToReplace: '',
        textReplacement: 'works with zero space text',
      },
      'works with zero space text\u200B',
      true
    );
  });

  test('command should support dry run mode', () => {
    // First test dry run mode - should check if applicable without applying
    const view = testApplySuggestion(
      doc(p('hello there')),
      {
        textToReplace: 'there',
        textReplacement: 'world',
      },
      'hello there', // content should remain unchanged in dry run
      true, // expectedResult
      true // dryRun
    );

    // Now apply for real to the same view
    const result = applySuggestion(
      view,
      {
        textToReplace: 'there',
        textReplacement: 'world',
      },
      'testUser'
    );

    // Verify operation was successful and content changed
    expect(result).toBe(true);
    expect(view.state.doc.textContent).toBe('hello thereworld');
  });

  test('dry run mode should return false if no matches are found', () => {
    testApplySuggestion(
      doc(p('hello there')),
      {
        textToReplace: 'nonexistent', // This text doesn't exist in the document
        textReplacement: 'world',
      },
      'hello there', // content should remain unchanged
      false, // expectedResult - should fail because no match
      true // dryRun
    );
  });

  test('dry run should return false if multiple matches are found', () => {
    testApplySuggestion(
      doc(p('hello there there')),
      {
        textToReplace: 'there',
        textReplacement: 'world',
      },
      'hello there there', // content should remain unchanged
      false, // expectedResult - should fail because multiple matches
      true // dryRun
    );
  });
});
