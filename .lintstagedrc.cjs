module.exports = {
  "./packages/core/**/*.ts": [() => "pnpm run check", "eslint --cache --fix", "prettier --write"],
};
