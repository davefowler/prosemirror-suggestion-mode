module.exports = {
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest.setup.js'],
}
