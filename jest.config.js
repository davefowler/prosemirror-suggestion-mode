export default {
  transform: {},
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
}
