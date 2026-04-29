# A Lean Automated Testing Environment for a Next.js Email Assistant: An Experience Report

## Abstract

This report describes how I added an automated test environment to a small Next.js email assistant. The environment uses Vitest for unit and component tests, Playwright for one browser smoke test, coverage and JUnit reports, and a Jenkins pipeline for continuous integration. The main benefits were fast feedback, repeatable tests, and safer testing of email behavior without sending real emails. The main challenges were dependency setup, mocking a third-party email client, installing the Playwright browser, and handling local server permissions. The final process is lean because it keeps the test suite small, supports changed-test runs during development, and stores useful test results without adding a large manual testing phase.

## 1. Introduction

Web applications can break in many small ways. A change can affect business logic, user interface behavior, external services, database access, or build configuration. The email assistant in this report has all of these parts. It stores contacts, logs email messages, sends welcome emails, sends assistant replies, and lets a user send broadcast emails. Testing this manually every time would be slow and easy to forget.

Automated testing helps by turning important expectations into executable checks. Still, automated testing can also become wasteful. A test suite that is too slow, too large, or too dependent on external services may discourage developers from running it. The aim of this work was therefore to create a lean test environment: small enough to run often, useful enough to catch important problems, and integrated into the normal development process.

The project was a Next.js application with TypeScript, ESLint, Drizzle, SQLite, Postmark, and a small set of React components. Before this work, it had no automated test runner. The work added the first test setup, the first test process, and a Jenkins pipeline.

Three test techniques were selected. First, unit tests were used for server-side logic, such as broadcast validation and email payload creation. These tests are fast and can mock external services. Second, component testing was used for a React component that shows contact information. Third, one Playwright end-to-end smoke test was used to start the app in a browser and check that the main workflow is visible. This follows the general idea of the test pyramid: use many cheap tests close to the code and fewer expensive browser tests [1].

The tools were integrated with npm scripts, a Vitest config file, a Playwright config file, generated reports, and a Jenkinsfile. A developer can run tests in watch mode, run the full unit suite, or run only changed tests. Jenkins installs dependencies, runs linting and unit tests in parallel, then runs the browser smoke test. Test results are stored in the `reports/` directory.

Several practical lessons were observed. The Vitest suite ran in less than one second. The Playwright smoke test ran in a few seconds after Chromium was installed. Most of the work was not writing assertions. Instead, it was making the environment stable: fixing a dependency version, writing correct mocks, installing the browser, and making sure generated coverage files were not linted as source code.

The rest of this report is organized as follows. Section 2 presents related work. Section 3 describes the method and test process. Section 4 presents the results. Section 5 discusses benefits and drawbacks using lean testing principles. Section 6 concludes the report.

## 2. Related Work

Automated tests are often grouped by cost and scope. Cohn's test automation pyramid recommends many unit tests, fewer integration tests, and a small number of user interface tests [1]. Unit tests are usually faster and easier to maintain. End-to-end tests cover more of the system, but they are slower and more sensitive to environment problems. Google also describes tests as small, medium, and large depending on what resources they use [2].

Vitest was chosen for unit and component tests. Vitest is a test runner that works well with Vite, TypeScript, JSX, mocking, coverage, and watch mode [3]. The official Next.js testing guide also describes using Vitest with React Testing Library [4]. The guide notes that async Server Components are better tested with end-to-end tests. For that reason, this report uses a component test for a synchronous component and a Playwright test for the running app.

React Testing Library encourages tests that check what users can see and do, instead of checking internal implementation details [5]. This matched the contact-list component test, which checks visible names and status text.

Playwright was chosen for browser testing because it can automate real browsers and is supported by the Next.js testing guide [6]. The current setup uses only Chromium to keep the first version simple. More browsers can be added later if cross-browser behavior becomes important.

Continuous integration means that changes are integrated often and checked by an automated build and test process [7]. Jenkins Pipeline supports this by storing the process in a `Jenkinsfile`, so the pipeline can be reviewed and changed together with the code [8].

Lean software development treats testing as part of delivering value, not as a separate late phase. Poppendieck and Poppendieck describe lean software development through ideas such as removing waste, learning quickly, delivering fast, empowering the team, and building quality in [9]. DORA also connects strong delivery performance with practices such as continuous delivery, automated testing, and continuous integration [10]. These ideas guided the test process in this project.

## 3. Methodology

### 3.1 Project Baseline

The project started as a small Next.js email assistant with no test runner. The source code was organized into `app/`, `components/`, and `lib/`. The project already had scripts for development, build, linting, and database migration.

Some parts of the application should not be used directly in fast tests. For example, tests should not send real email through Postmark. They should also not depend on a real production database or external AI service. Because of this, isolation and mocking were important requirements.

The project also had a local instruction to read the installed Next.js documentation before changing code. The testing guides in `node_modules/next/dist/docs/01-app/02-guides/testing/` were checked before implementation. They supported the choice of Vitest for unit tests and Playwright for end-to-end tests.

### 3.2 Tool Integration

The following development dependencies were added: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/dom`, `@vitest/coverage-v8`, and `@playwright/test`. The `package-lock.json` file was kept so Jenkins can use `npm ci`.

Vitest was configured in `vitest.config.mts`. The config uses the React plugin, TypeScript path resolution, a `jsdom` environment, a setup file, JUnit output, and V8 coverage reports. Coverage is written to `reports/vitest/coverage`, and JUnit output is written to `reports/vitest/junit.xml`.

The setup file, `test/setup.ts`, restores mocks and environment variables after each test. This matters because some tests set values such as `POSTMARK_SERVER_TOKEN` and `SENDER_EMAIL`. Cleaning them after each test prevents one test from affecting another.

Playwright was configured in `playwright.config.ts`. It uses `tests/e2e` as the test folder and writes artifacts under `reports/playwright/artifacts`. It starts the app with `npm run dev -- --hostname 127.0.0.1` and uses `http://127.0.0.1:3000` as the base URL. Only Chromium is enabled in the first version.

The npm scripts were extended as follows:

```text
test                 -> vitest
test:unit           -> vitest run
test:unit:changed   -> vitest run --changed origin/main
test:unit:ci        -> vitest run --coverage
test:e2e            -> playwright test
test:ci             -> npm run lint && npm run test:unit:ci && npm run test:e2e
```

The changed-test command is the test optimization technique. It compares the current work with `origin/main` and runs tests affected by changed files. The full CI command still runs the complete suite before merge.

The Jenkinsfile has three main stages. The `Install` stage runs `npm ci`. The `Fast feedback` stage runs linting and Vitest in parallel. The `E2E smoke` stage installs Chromium and runs Playwright. After the run, Jenkins publishes JUnit files from `reports/**/junit.xml` and archives all files under `reports/**`.

### 3.3 Test Scripts Written

Five Vitest test cases were created in three files:

- `test/broadcast.test.ts` checks that empty broadcast input is rejected and that valid contacts are passed to the email helper.
- `test/email.test.ts` checks that assistant replies include email-threading headers and that welcome emails use a fallback name.
- `test/contact-list.test.tsx` checks that the contact list renders a contact name and welcome status.

One Playwright test was created:

- `tests/e2e/home.spec.ts` starts the app and checks that the Contacts, Email log, Broadcast sections, and broadcast form controls are visible.

The number of tests is intentionally small. The goal was to build a working process and cover representative risks. More tests can be added later when new risks or defects appear.

### 3.4 Test Environment Diagram

```text
Developer workstation
  |
  | npm run test:unit:changed
  v
Vitest affected tests ----> fast local feedback

Pull request / main update
  |
  v
Jenkinsfile
  |
  +--> npm ci
  |
  +--> parallel:
  |      - npm run lint
  |      - npm run test:unit:ci -> reports/vitest/junit.xml, coverage
  |
  +--> npx playwright install chromium
  |
  +--> npm run test:e2e -> reports/playwright/*
  |
  v
Archived reports and JUnit results
```

### 3.5 Test Process and Lean Fit

During normal development, the developer runs `npm run test:unit:changed`. This gives fast feedback without running unnecessary tests. Before committing a change that affects shared behavior, the developer runs `npm run test:unit`. If the change affects startup, routing, or visible workflow behavior, the developer also runs `npm run test:e2e`.

Jenkins runs on pull requests and main-branch updates. It installs dependencies from the lockfile, runs linting and unit/component tests in parallel, and then runs the browser smoke test. Results are stored under `reports/` and archived. Because the same scripts can be run locally, the developer who introduced a failure can reproduce it.

This process supports lean testing in three ways. First, it reduces waste by avoiding real email delivery and by running changed tests locally. Second, it builds quality into the normal workflow instead of adding a late manual test phase. Third, it supports continuous improvement because the suite is small and easy to extend.

## 4. Results

### 4.1 Adoption Observations

The first dependency installation did not work. The sandboxed environment could not reach the npm registry. After network access was allowed, npm reported that `next@^16.3.0` could not be found. The local project already used Next.js `16.2.4` and `eslint-config-next` `16.2.4`, so the dependency was changed to `^16.2.4`. After that, the test dependencies installed correctly.

The first Vitest run found a problem in the test setup. The email-helper tests failed because the Postmark mock did not act like a constructor. The production code uses `new ServerClient(...)`, but the first mock was an arrow function. Replacing it with a constructible function fixed the tests. This was a test setup issue, not a production bug.

The first Playwright run also failed during setup. The sandbox blocked the local server on `0.0.0.0:3000`, so the config was changed to use `127.0.0.1`. The next run reached browser startup but failed because Chromium was not installed. Running `npx playwright install chromium` fixed that issue.

The first full CI script passed, but ESLint scanned generated coverage files and printed warnings. The ESLint config was updated to ignore `coverage/**` and `reports/**`. The `.gitignore` file was also updated to ignore generated reports. After that, the full `npm run test:ci` command completed without lint warnings.

### 4.2 Quantitative Results

Table 1 summarizes the final test suite.

```text
Table 1. Implemented automated tests

Layer                      Files   Test cases   Main purpose
Unit: server action        1       2            Broadcast validation and contact mapping
Unit: email helper         1       2            Postmark payload construction
Component                  1       1            Contact-list rendering
End-to-end smoke           1       1            App startup and main workflow visibility
Total                      4       6            Small lean regression suite
```

Table 2 summarizes the final command results.

```text
Table 2. Final observed execution results

Command                    Result   Reported duration / observation
npm run lint               Pass     No warnings after generated reports were ignored
npm run test:unit          Pass     5 Vitest tests, approximately 0.57 seconds
npm run test:unit:changed  Pass     5 affected tests, approximately 0.45 seconds
npm run test:unit:ci       Pass     Coverage enabled, approximately 0.57-0.68 seconds
npm run test:e2e           Pass     1 Playwright test, approximately 2.7 seconds
npm run test:ci            Pass     Lint, coverage, and E2E completed successfully
npx tsc --noEmit           Pass     TypeScript type check completed successfully
```

The final coverage run reported 33.66% statement coverage, 27.27% branch coverage, 35.71% function coverage, and 33.33% line coverage. Coverage was not used as a pass/fail gate. The first goal was to create a working lean environment, not to enforce a high coverage number. Still, the report helped show which areas are not yet tested, such as `app/api/inbound/route.ts`, `lib/db.ts`, and parts of `components/EmailLog.tsx`.

The active setup time was about one hour. Most of this time was spent on integration and verification, not on writing the six test cases. The main time costs were npm access, dependency version alignment, Playwright browser installation, and local server permissions.

### 4.3 Defects and Issues Identified

The final test suite did not find a confirmed production defect. It did find and help resolve four setup or process issues:

- The Next.js dependency pointed to a version range that npm could not resolve.
- The first Postmark mock did not behave like a constructor.
- Playwright needed a fixed local host and an installed Chromium browser.
- ESLint initially checked generated coverage reports.

These issues would have made the automated test process unreliable or noisy. Fixing them was needed before the tests could give useful feedback.

## 5. Discussion

### 5.1 Overall Benefits

The biggest benefit was speed. The unit and component tests run in less than one second. This makes them practical to run often. The changed-test command also helps because it avoids running unrelated tests during development.

The second benefit was isolation. Unit tests mock Postmark and database access, so they do not send real email or need a prepared database. This makes the tests safer and easier to understand. The Playwright test adds a different kind of confidence by checking that the app starts and shows the main workflow in a real browser.

The third benefit was traceability. JUnit files, coverage reports, Playwright artifacts, screenshots on failure, and traces on failure are stored in known folders. Jenkins can archive these files, so test results are easier to review later.

### 5.2 Overall Drawbacks

The main drawback was setup friction. Playwright needed a browser download. Next.js needed permission to bind a local port in the sandbox. npm also failed until the Next.js version was corrected. These problems are common, but they show that automated testing has a maintenance cost.

Another drawback is limited coverage. Six tests are enough to prove the environment and cover some important behavior, but they are not enough to prove the whole product works. The inbound route, database functions, and some UI states still need tests.

End-to-end tests are also slower and more sensitive to configuration than unit tests. For that reason, Playwright is used here as a small smoke test layer, not as the main place for detailed business-rule testing.

### 5.3 Lean Principle Discussion

**Provide continuous feedback.** The solution supports this principle well. Vitest gives very fast local feedback, and Jenkins checks each integration with linting, coverage, and a browser smoke test. This is a benefit because problems are found close to the change.

**Deliver customer value.** The tests focus on behavior that matters to users and operators: sending broadcasts, creating correct email payloads, showing contact status, and loading the main workflow. This is a benefit. The drawback is that the inbound AI reply flow is not yet tested.

**Enable face-to-face communication.** The tools do not create communication by themselves. However, reports and test files make discussions easier because developers can point to a failed test, a trace, or a coverage report. This is a benefit, but the team still needs to discuss failures actively.

**Have courage.** Fast tests make it less risky to change code. A developer can update broadcast validation or email-helper logic and run focused tests immediately. This is a benefit. The drawback is that untested areas still require care.

**Keep it simple.** The setup is simple: one unit test runner, one browser test runner, npm scripts, and one Jenkinsfile. This is a benefit because the process is easy to understand. The drawback is that a simple suite does not cover every risk.

**Practice continuous improvement.** The setup improved during adoption. The changed-test script was corrected after the first version did not behave as intended. ESLint ignores were updated after generated reports caused warnings. This is a benefit because the process can improve in small steps.

**Respond to change.** The changed-test command helps the suite react to code changes. The Playwright config can also be expanded to more browsers if needed. This is a benefit. The drawback is that future framework changes may require test configuration updates.

**Self-organize.** Developers can run the same scripts locally that Jenkins runs in CI. The Jenkinsfile is stored with the code, so the team can review and change the pipeline like normal source code. This is a benefit. The drawback is that developers must understand the scripts well enough to maintain them.

**Focus on people.** The setup reduces repeated manual checking and avoids unsafe real-email tests. It also gives short feedback, which reduces frustration. This is a benefit. A possible drawback is that flaky browser tests could annoy developers if the suite grows too much.

**Enjoy.** A fast and clear test suite is more pleasant to use. The final setup is easy to run during normal development, while the slower browser test is saved for cases where it adds value. This is a benefit. The first-time setup, especially browser installation, is less enjoyable.

## 6. Conclusions

This report described the creation of a lean automated testing environment for a Next.js email assistant. The final setup uses Vitest unit tests, React Testing Library component tests, a Playwright browser smoke test, coverage reporting, JUnit output, npm scripts, and Jenkins.

The main benefit was fast and repeatable feedback. The unit and component tests completed in less than one second, and the Playwright smoke test completed in a few seconds after the environment was ready. The changed-test command supports lean local work, while CI still runs a full verification path.

The main challenges were practical setup details: dependency version alignment, network access, constructor-based mocks, local server permissions, browser installation, and generated report handling. Fixing these issues made the environment more reliable.

The current suite is small and should be seen as a foundation. Useful next steps are tests for the inbound email route, database behavior with isolated test data, and more UI states. The main lesson is that lean automated testing is not only about adding tests. It is about creating a feedback system that developers can run often and trust when it fails.

## References

[1] M. Cohn, *Succeeding with Agile: Software Development Using Scrum*. Addison-Wesley, 2009.

[2] Google Testing Blog, "Test Sizes," 2010. Available: https://testing.googleblog.com/2010/12/test-sizes.html

[3] Vitest, "Next Generation Testing Framework." Available: https://vitest.dev/

[4] Vercel, "Testing: Vitest," Next.js Documentation, 2026. Available: https://nextjs.org/docs/app/guides/testing/vitest

[5] Testing Library, "Guiding Principles." Available: https://testing-library.com/docs/guiding-principles/

[6] Vercel, "Testing: Playwright," Next.js Documentation, 2026. Available: https://nextjs.org/docs/app/guides/testing/playwright

[7] M. Fowler, "Continuous Integration," 2024. Available: https://martinfowler.com/articles/continuousIntegration.html

[8] Jenkins, "Pipeline." Available: https://www.jenkins.io/doc/book/pipeline/

[9] M. Poppendieck and T. Poppendieck, *Lean Software Development: An Agile Toolkit*. Addison-Wesley Professional, 2003.

[10] DORA, "Capabilities: Continuous Delivery." Available: https://dora.dev/capabilities/continuous-delivery/
