# Contributing to Terminal Quest

First off, thank you for considering contributing to Terminal Quest! 🎮

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report, please check the [existing issues](https://github.com/mlynarskim/Terminal-Quest/issues) to avoid duplicates.

When creating a bug report, please include:
- **Clear title** - e.g., `[Bug] Decrypt fails on Base64 files in /system`
- **Steps to reproduce** - numbered list
- **Expected behavior** - what should happen
- **Actual behavior** - what happens instead
- **Environment** - OS, browser, game version (from `stats`)
- **Screenshots/GIFs** - if applicable

### Suggesting Features

Feature requests are welcome! Please:
- Check existing issues/PRs first
- Explain the **problem** you're solving, not just the solution
- Consider scope - small, focused features are easier to review
- Be open to discussion and iteration

### Pull Requests

1. **Fork** the repository
2. **Create a branch** - `feat/feature-name` or `fix/bug-description`
3. **Make your changes** following the guidelines below
4. **Run tests** - `npm test && npm run lint && npm run build`
5. **Submit PR** with clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Terminal-Quest.git
cd Terminal-Quest

# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## Coding Standards

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation changes
- `style` - formatting, missing semicolons, etc.
- `refactor` - code restructuring without behavior change
- `test` - adding/updating tests
- `chore` - maintenance, dependencies, config

**Examples:**
```
feat(ciphers): add Vigenere cipher support
fix(processes): prevent process spawn during storm
docs(readme): add contributing section
test(ciphers): add Base64 decode tests
```

### Code Style

- **ESLint** + **Prettier** - run `npm run lint` and `npm run format`
- **TypeScript** for type safety (`.ts`/`.tsx` preferred, but `.js`/`.jsx` accepted)
- **No unused variables** - `no-unused-vars` with `argsIgnorePattern: '^_'`
- **Catch blocks** - always use `catch { }` without `(e)` parameter
- **No `var`** - use `const`/`let`
- **Async/await** over Promise chains

### Testing

- **Unit tests** with Vitest - place in `src/game/*.test.js` or `src/hooks/*.test.js`
- **E2E tests** with Playwright - place in `e2e/*.spec.ts`
- **Test naming** - `describe('feature', () => { it('should do X', () => { ... }) })`
- **Coverage** - aim for meaningful coverage, not just numbers

### File Structure

```
src/
├── components/        # React components
├── game/              # Game logic (pure functions, testable)
│   ├── *.js          # Modules
│   ├── *.test.js     # Unit tests
├── hooks/             # React hooks
├── lib/               # Utilities (audio, etc.)
└── main.jsx          # Entry point
```

### Game Logic Guidelines

- **Pure functions** preferred - easier to test
- **State mutations** only through `useGameState` actions
- **No direct DOM manipulation** in game logic
- **Constants** in `src/game/constants.js`
- **New features** → new module in `src/game/` + tests

## Review Process

1. **Automated checks** must pass (tests, lint, build)
2. **Maintainer review** - at least one approval required
3. **CI checks** must pass
4. **Squash and merge** preferred

## Recognition

Contributors will be added to the [Contributors](https://github.com/mlynarskim/Terminal-Quest/graphs/contributors) page and mentioned in release notes.

## Questions?

Open a [Discussion](https://github.com/mlynarskim/Terminal-Quest/discussions) or ping @mlynarskim in a PR/issue.

---

Thank you for contributing! 🚀