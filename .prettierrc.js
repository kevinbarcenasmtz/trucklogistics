// .prettierrc.js
module.exports = {
    // Basic formatting
    semi: true,
    trailingComma: 'es5',
    singleQuote: true,
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    
    // React/JSX/TSX specific
    jsxSingleQuote: false,
    jsxBracketSameLine: false,
    
    // TypeScript specific
    arrowParens: 'avoid',
    bracketSpacing: true,
    endOfLine: 'lf',
    
    // File overrides for different file types
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        options: {
          parser: 'typescript',
          printWidth: 100, // Slightly wider for TS types
        },
      },
      {
        files: ['*.js', '*.jsx'],
        options: {
          parser: 'babel',
        },
      },
      {
        files: ['*.json'],
        options: {
          parser: 'json',
          trailingComma: 'none',
        },
      },
    ],
    
    // Import sorting with TypeScript support
    plugins: [
        '@trivago/prettier-plugin-sort-imports',
        'prettier-plugin-organize-imports'
    ],
    importOrder: [
      '^react$',
      '^react-native$',
      '^@react-native/(.*)$',
      '^expo/(.*)$',
      '^@expo/(.*)$',
      '<THIRD_PARTY_MODULES>',
      '^@/(.*)$',
      '^[./]',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    importOrderCaseInsensitive: true,
  };