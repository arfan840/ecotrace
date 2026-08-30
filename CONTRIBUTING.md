# Contributing to EcoTrace

Thank you for contributing to EcoTrace! Please adhere to the following workflow and code guidelines to ensure seamless onboarding and build success.

## Branching Strategy & Cadence
- Always branch off `main` for new changes.
- Branch names should follow standard semantic naming:
  - `feat/feature-name`
  - `fix/bug-fix-name`
  - `docs/documentation-changes`
  - `refactor/code-restructuring`

## Pre-commit Verification
Before opening a Pull Request, verify that all linting, build, and coverage metrics pass locally.

### 1. Code Style Linting
Verify syntax quality guidelines:
```bash
npm run lint
```

### 2. Code Coverage and Tests
Run unit tests and verify statement, branch, functions, and lines coverage criteria:
```bash
npm run coverage
```
The Vitest run enforces:
- **Statements:** min 60%
- **Branches:** min 50%
- **Functions:** min 60%
- **Lines:** min 60%

### 3. Production Build
Assert that production bundlers compile without warnings or Rolldown errors:
```bash
npm run build
```

## Pull Request Submission
- Verify that your commit history includes self-contained feature increments paired directly with test additions.
- Ensure the CI build run is green before requesting review.
