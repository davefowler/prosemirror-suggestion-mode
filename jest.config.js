export default {
  transform: {},
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
}
