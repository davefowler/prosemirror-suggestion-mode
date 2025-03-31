import { EditorState } from 'prosemirror-state';
import { EditorView, Decoration } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { suggestionModePlugin } from '../../src/plugin';
import { suggestionPluginKey, suggestionTransactionKey } from '../../src/key';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { addSuggestionMarks } from '../../src/schema';
import {
  createDecorations,
  decorateSuggestionGroup,
} from '../../src/decorations';
import {
  hoverMenuFactory,
  SuggestionHoverMenuRenderer,
} from '../../src/hoverMenu';
import { setupDOMEnvironment } from '../helpers/testHelpers';

// Setup DOM environment for tests
setupDOMEnvironment();

describe('decorations integration', () => {
  let view: EditorView;
  let state: EditorState;
  let container: HTMLElement;
  let renderHoverMenu: SuggestionHoverMenuRenderer;

  // Create a schema with suggestion marks
  const schema = new Schema({
    nodes: basicSchema.spec.nodes,
    marks: addSuggestionMarks(basicSchema.spec.marks),
  });

  // Helper to create a basic editor with our plugin
  function createEditor(
    content: string = '<p>Hello world</p>',
    pluginState = {}
  ) {
    // Create container for the editor
    container = document.createElement('div');
    document.body.appendChild(container);

    // Parse the content
    const domNode = document.createElement('div');
    domNode.innerHTML = content;
    const doc = DOMParser.fromSchema(schema).parse(domNode);

    // Create the state with our plugin
    state = EditorState.create({
      doc,
      schema,
      plugins: [
        keymap(baseKeymap),
        suggestionModePlugin({ username: 'integration test user' }),
      ],
    });

    // Create the editor view
    view = new EditorView(container, { state });

    // Create hover menu renderer
    renderHoverMenu = hoverMenuFactory();

    // Configure the plugin with the desired state
    view.dispatch(
      view.state.tr.setMeta(suggestionPluginKey, {
        inSuggestionMode: true,
        username: 'testUser',
        data: { 'example-attr': 'test value' },
        ...pluginState,
      })
    );

    return view;
  }

  afterEach(() => {
    if (view) {
      view.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('createDecorations', () => {
    test('should create decorations for suggestion marks', () => {
      // Create editor with suggestion mark already applied
      createEditor(
        '<p>Hello <span class="suggestion-add" data-username="testUser">suggested</span> world</p>'
      );

      // Update the document to add suggestion marks programmatically
      const tr = view.state.tr;

      // Get position of "Hello "
      const pos = 1; // Start of paragraph content
      const textLength = 6; // "Hello " length

      // Add suggestion mark to first word
      const mark = schema.mark('suggestion_insert', {
        username: 'testUser',
        data: {},
      });
      tr.addMark(pos, pos + textLength, mark);

      view.dispatch(tr);

      // Create decorations using our function
      const decorationSet = createDecorations(view.state, renderHoverMenu);

      // Expect there to be decorations
      expect(decorationSet.find().length).toBeGreaterThan(0);

      // The decoration should be at the start position of the marked text
      const decorationsArray = decorationSet.find();
      expect(decorationsArray.some((d) => d.from === pos)).toBe(true);
    });

    test('should group adjacent marks with the same username', () => {
      createEditor('<p>Hello world</p>');

      // Add suggestion marks to two adjacent words with same username
      const tr = view.state.tr;
      const pos1 = 1; // Start of paragraph content
      const word1Length = 5; // "Hello" length
      const pos2 = pos1 + word1Length; // Start of "world"
      const word2Length = 5; // "world" length

      const mark = schema.mark('suggestion_insert', {
        username: 'testUser',
        data: {},
      });
      tr.setMeta(suggestionTransactionKey, {
        skipSuggestionOperation: true,
      });
      tr.addMark(pos1, pos1 + word1Length, mark);
      tr.addMark(pos2, pos2 + word2Length, mark);

      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Hello world');
      // Create decorations
      const decorationSet = createDecorations(view.state, renderHoverMenu);

      // Should only create one decoration for both marks since they have the same username
      const decorationsArray = decorationSet.find();
      expect(decorationsArray.length).toBe(2);
    });

    test('should create separate decorations for different usernames', () => {
      createEditor('<p>Hello world</p>');

      // Add suggestion marks to two adjacent words with different usernames
      const tr = view.state.tr;
      const pos1 = 1; // Start of paragraph content
      const word1Length = 5; // "Hello " length
      const pos2 = pos1 + word1Length + 1; // Start of "world"
      const word2Length = 5; // "world" length

      const mark1 = schema.mark('suggestion_insert', {
        username: 'tom',
        data: {},
      });
      const mark2 = schema.mark('suggestion_insert', {
        username: 'jerry',
        data: {},
      });
      tr.setMeta(suggestionTransactionKey, {
        skipSuggestionOperation: true,
      });
      tr.addMark(pos1, pos1 + word1Length, mark1);
      tr.addMark(pos2, pos2 + word2Length, mark2);

      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Hello world');

      // Create decorations
      const decorationSet = createDecorations(view.state, renderHoverMenu);

      // Get all decorations
      const decorationsArray = decorationSet.find();
      // Filter for widget decorations that have hover in their key
      // Widget decorations have from === to and a spec.key
      const hoverWidgets = decorationsArray.filter(
        (d) => d.from === d.to && (d as any).spec.key.includes('hover')
      );

      // Should have exactly 2 hover widgets (one for each username)
      expect(hoverWidgets.length).toBe(2);

      // Verify they're at the correct positions
      expect(hoverWidgets.some((d) => d.from === pos1)).toBe(true);
      expect(hoverWidgets.some((d) => d.from === pos2)).toBe(true);
    });
  });

  describe('decorateSuggestion', () => {
    test('should create a widget decoration', () => {
      // Create a decoration array
      const decos: Decoration[] = [];

      // Mock hover menu renderer
      const mockHoverMenu = jest.fn().mockImplementation(() => {
        const div = document.createElement('div');
        div.className = 'mock-hover-menu';
        return div;
      });

      // Call decorateSuggestion
      decorateSuggestionGroup(
        decos,
        5,
        10,
        { username: 'testUser' },
        mockHoverMenu
      );

      // Should have added two decorations
      expect(decos.length).toBe(2);

      // Decoration should be a widget at position 5
      expect(decos[1].from).toBe(5);
      expect(decos[1].to).toBe(5);

      // Check decoration key includes hover
      expect((decos[1] as any).spec.key).toContain('hover');
    });
  });
});
