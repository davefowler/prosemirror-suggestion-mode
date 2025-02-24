// Mock minimal DOM environment for ProseMirror
class MockElement {
  constructor() {
    this.className = ''
    this.textContent = ''
    this.children = []
    this.style = { cssText: '' }
    this.nodeType = 1
    this.nodeName = 'div'
    this.contentEditable = 'true'
    this.classList = {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    }
  }
  
  appendChild() { return new MockElement() }
  insertBefore() { return new MockElement() }
  getBoundingClientRect() {
    return { left: 0, right: 0, top: 0, bottom: 0, height: 0, width: 0 }
  }
}

// Mock window
global.window = {
  getComputedStyle: () => ({
    getPropertyValue: () => ''
  }),
  document: {
    createElement: () => new MockElement(),
    createTextNode: () => new MockElement(),
    createRange: () => ({
      setEnd: () => {},
      setStart: () => {},
      getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
      getClientRects: () => []
    }),
    getElementsByTagName: () => ([{ appendChild: () => {} }]),
    documentElement: new MockElement(),
    body: new MockElement()
  }
}

// Set document to window.document
global.document = global.window.document

// Mock selection
global.getSelection = () => ({
  rangeCount: 0,
  type: 'None',
  addRange: () => {},
  removeAllRanges: () => {},
  getRangeAt: () => ({})
})

// Mock MutationObserver
global.MutationObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
}
