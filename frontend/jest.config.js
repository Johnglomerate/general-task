/* eslint-env node */

module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: { '^.+\\.(ts|tsx)$': 'babel-jest' },
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}
