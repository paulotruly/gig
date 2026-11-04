/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@gig/shared/contracts$': '<rootDir>/../../packages/shared/src/contracts/index.ts',
    '^@gig/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    '^@gig/db$': '<rootDir>/../../packages/db/src/index.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
};
