module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/data-source.ts',
    '!**/migrations/**',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/transaction.service.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  // Optimisations de performance
  maxWorkers: 1,
  cache: true,
  cacheDirectory: '<rootDir>/../node_modules/.cache/jest',
  clearMocks: true,
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  // Améliorer les performances des tests
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  // Gestion mémoire
  workerIdleMemoryLimit: '512MB',
  logHeapUsage: true,
};