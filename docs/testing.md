# Testing Process

## Decisions

The main test infrastructure is Vitest with React Testing Library for fast local feedback. This fits the project because most behavior is TypeScript logic, server actions, and small React components.

Playwright is added as a second technique for one browser-level smoke test. It verifies that the Next.js app can boot and that the main email-assistant workflow is visible to a real browser.

Mocks are used for external services. Postmark, database reads, and email delivery are replaced in unit tests so the suite is deterministic, cheap, and safe to run without sending email.

## Suite Optimisation

For day-to-day work, run `npm run test:unit:changed`. It uses Vitest's changed test selection against `origin/main`, so only tests affected by changed files run when possible.

For full confidence, run `npm run test:ci`. CI still runs the full unit/component suite plus the Playwright smoke test, but Jenkins stages lint and Vitest in parallel to shorten feedback time. Playwright is intentionally kept small because browser tests are slower and more brittle than unit tests.

## Commands

- `npm run test`: interactive Vitest watch mode.
- `npm run test:unit`: run all Vitest tests once.
- `npm run test:unit:changed`: run changed/affected Vitest tests against `origin/main`.
- `npm run test:unit:ci`: run Vitest with coverage and JUnit output.
- `npm run test:e2e`: run Playwright smoke tests.
- `npm run test:ci`: run lint, unit/component tests, and E2E tests.

## Process

Developers run `npm run test:unit:changed` before committing and `npm run test:unit` when changing shared behavior. When UI routing, rendering, or app startup changes, they also run `npm run test:e2e`.

Jenkins runs the `Jenkinsfile` pipeline on every pull request and main-branch update. It installs dependencies with `npm ci`, runs lint and Vitest in parallel, then runs the Playwright smoke test.

Test results are stored under `reports/`. Jenkins publishes `reports/**/junit.xml` and archives the full `reports/**` folder, including coverage, Playwright traces, screenshots, and HTML/blob reports.

## Experience Log

Benefits: Vitest was quick to integrate with the local Next 16 guidance in `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`. Mocking Postmark and database calls made server-side tests safe and repeatable. Playwright gives confidence that the app starts and the workflow is usable in a browser.

Drawbacks: Browser tests need installed Playwright browsers and are slower than unit tests. The app currently runs `db:push` before `next dev`, so E2E startup touches the local SQLite database.

Challenges and solutions: npm initially failed because `package.json` referenced `next@^16.3.0`, while the installed Next package and eslint config were `16.2.4`; aligning the dependency let npm resolve the test tooling. The App Router docs also warn that async Server Components are better covered by E2E tests, so the direct React test targets a synchronous component instead of `app/page.tsx`.
