const config = {
  // TypeScript/JavaScript files: format and lint
  '*.{ts,tsx,js,jsx,mjs}': ['prettier --write', 'eslint --fix'],

  // JSON, CSS, MD: just format
  '*.{json,css,md}': ['prettier --write'],
}

export default config
