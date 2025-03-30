// If you are using a bundler you can skip this file.  Put here for simplicity in bundling/building the examples:

// Create and expose the import map
const importMap = {
    imports: {
      "prosemirror-state": "https://cdn.jsdelivr.net/npm/prosemirror-state@1.4.3/dist/index.js",
      "prosemirror-view": "https://cdn.jsdelivr.net/npm/prosemirror-view@1.31.7/dist/index.js",
      "prosemirror-model": "https://cdn.jsdelivr.net/npm/prosemirror-model@1.19.3/dist/index.js",
      "prosemirror-commands": "https://cdn.jsdelivr.net/npm/prosemirror-commands@1.5.0/dist/index.js",
      "prosemirror-keymap": "https://cdn.jsdelivr.net/npm/prosemirror-keymap@1.2.2/dist/index.js",
      "prosemirror-schema-basic": "https://cdn.jsdelivr.net/npm/prosemirror-schema-basic@1.2.2/dist/index.js",
      "prosemirror-schema-list": "https://cdn.jsdelivr.net/npm/prosemirror-schema-list@1.3.0/dist/index.js",
      "prosemirror-transform": "https://cdn.jsdelivr.net/npm/prosemirror-transform@1.7.3/dist/index.js",
      "prosemirror-menu": "https://cdn.jsdelivr.net/npm/prosemirror-menu@1.2.2/dist/index.js",
      "w3c-keyname": "https://cdn.jsdelivr.net/npm/w3c-keyname@2.2.10/index.js",
      "orderedmap": "https://cdn.jsdelivr.net/npm/orderedmap@2.0.2/dist/index.js",
      "prosemirror-suggestion-mode": "/dist/index.js",
      ".": "/dist/index.js",
      "./plugin": "/dist/plugin.js",
      "./accept-reject": "/dist/accept-reject.js",
      "./key": "/dist/key.js",
      "./utils": "/dist/utils.js"
    }
  };
  
  // Dynamically inject the import map
  const el = document.createElement('script');
  el.type = 'importmap';
  el.textContent = JSON.stringify(importMap);
  document.head.appendChild(el);