const base = require('./jest.base');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ['<rootDir>/test/integration'],
  globalSetup: '<rootDir>/../../packages/db/test-support/reset-test-db.js',
  testTimeout: 60000,
};
