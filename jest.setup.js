// Mock DOM elements since we're running in Node
class MockElement {
  constructor() {
    this.className = ''
    this.textContent = ''
    this.children = []
    this.style = {}
    this.nodeType = 1
    this.nodeName = 'div'
  }
  
  appendChild(child) {
    this.children.push(child)
  }

  getBoundingClientRect() {
    return { left: 0, right: 0, top: 0, bottom: 0 }
  }
}

class MockSelection {
  constructor() {
    this.rangeCount = 0
    this.type = 'None'
  }

  addRange() {}
  removeAllRanges() {}
}

global.document = {
  createElement: () => new MockElement(),
  createTextNode: () => new MockElement(),
  createRange: () => ({
    setEnd: () => {},
    setStart: () => {},
    getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0 }),
    getClientRects: () => []
  }),
  getElementsByTagName: () => ([{ appendChild: () => {} }])
}

global.window = {
  getSelection: () => new MockSelection()
}

global.MutationObserver = class {
  constructor() {}
  observe() {}
  disconnect() {}
}
