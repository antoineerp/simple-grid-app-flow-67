
// Configuration ESLint simplifiée compatible avec Node.js 16
export default {
  root: true,
  env: {
    browser: true,
    es2020: true
  },
  extends: [
    'eslint:recommended'
  ],
  ignorePatterns: ["dist"],
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
  }
};
