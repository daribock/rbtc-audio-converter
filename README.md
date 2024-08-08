# ESLint-Prettier-Husky Configuration Template for Node.js Projects

This project is a configuration template for integrating ESLint, Prettier, and
Husky into Node.js projects. It provides pre-configured settings for these
tools, which can be easily copied into any Node.js project.

ESLint is used for identifying and reporting on patterns found in
ECMAScript/JavaScript code. Prettier is an opinionated code formatter, ensuring
that all outputted code conforms to a consistent style. Husky is used to ensure
that all commits meet the project's standards by running linters before each
commit.

## Requirements

- Node.js >= 21
- npm >= 10

## Installation

1. Clone the repository:
   `git clone git@github.com:darikletter/nodejs-eslint-prettier-husky.git`
2. Install dependencies: `npm install`

## Usage

Simply copy the files from this project template to your Node.js project.

```bash
cp -R /path-to-template/* /path-to-your-project/
```

## Notes

### 1. Enable Git hooks

```sh
  npx husky install
  npx husky add .husky/commit-msg 'npm run commit-msg'
  npx husky add .husky/pre-commit 'npm run pre-commit'
```

### 2. Why is my git pre-commit hook not executable by default?

- Please execute the below command on terminal to hook get executable by
  default.
- Because files are not executable by default; they must be set to be
  executable.

```bash
chmod ug+x .husky/*
chmod ug+x .git/hooks/*
```

### 3. Project release

Releasing is done via
[release-please-action](https://github.com/google-github-actions/release-please-action).

## Contribution

Happy to get your feedback, but also feel free to raise a pull request. 🤗

## License

This project is licensed under the MIT. See the LICENSE.md file for details.
