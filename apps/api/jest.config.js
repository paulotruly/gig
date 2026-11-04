const base = require('./jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/', '/test/integration/'],
};
