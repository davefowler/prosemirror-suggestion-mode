import ist from 'ist';

import {
  eq,
  doc,
  p,
  sdel,
  sadd,
  testSuggestionTransform,
  schema,
} from '../helpers/builderWithPlugin';
import { suggestionTransactionKey } from '../../src/key';

describe('Basic document tests', () => {
  it('creates a simple document', () => {
    const d = doc(p('hello'));
    ist(d.textContent, 'hello');
  });

  it('compares two documents', () => {
    const d1 = doc(p('hello'));
    const d2 = doc(p('hello'));
    ist(d1, d2, eq);
  });
});

describe('Basic suggestion edit tests', () => {
  it('should add a suggestion mark to a document', () => {
    const d1 = doc(p('hello <a>'));
    const d2 = doc(p('hello ', sadd('world')));
    testSuggestionTransform(
      d1,
      d2,
      (tr) => {
        tr.setMeta(suggestionTransactionKey, {
          inSuggestionMode: true,
        });
        tr.insert(tr.doc.tag.a, schema.text('world'));
      },
      true
    );
  });

  it('should add a suggestion mark on a single character', () => {
    const d1 = doc(p('hello <a>'));
    const d2 = doc(p('hello ', sadd('w')));
    testSuggestionTransform(
      d1,
      d2,
      (tr) => {
        tr.insert(tr.doc.tag.a, schema.text('w'));
      },
      true
    );
  });

  it('should not add a suggestion mark if suggestion mode is off', () => {
    const d1 = doc(p('hello <a>'));
    const d2 = doc(p('hello world'));
    testSuggestionTransform(d1, d2, (tr) => {
      tr.setMeta(suggestionTransactionKey, {
        inSuggestionMode: false,
      });
      tr.insert(tr.doc.tag.a, schema.text('world'));
    });
  });
});
