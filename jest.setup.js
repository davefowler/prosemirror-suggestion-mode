// Mock DOM elements since we're running in Node
class MockElement {
  constructor() {
    this.className = ''
    this.textContent = ''
    this.children = []
  }
  
  appendChild(child) {
    this.children.push(child)
  }
}

global.document = {
  createElement: () => new MockElement()
}
