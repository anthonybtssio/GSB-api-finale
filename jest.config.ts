import type {Config} from 'jest';

const config: Config = {
  // Utilise ts-jest pour compiler les fichiers TypeScript
  preset: 'ts-jest',
  // Environnement Node.js (pas navigateur)
  testEnvironment: 'node',
  // Dossiers où chercher les tests
  roots: ['<rootDir>/src'],
  // Patterns de fichiers de test
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }],
  },
  // Nettoyer automatiquement les mocks avant chaque test
  clearMocks: true,
  // Collecter la couverture de code
  collectCoverage: true,
  // Fichiers à inclure dans la couverture
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/__tests__/**',
  ],
  // Dossier de sortie pour la couverture
  coverageDirectory: 'coverage',
  // Provider de couverture
  coverageProvider: 'v8',
  // Résoudre les imports ESM avec extension .js vers .ts
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Extensions de fichiers reconnues
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Afficher les détails des tests
  verbose: true,
};

export default config;
