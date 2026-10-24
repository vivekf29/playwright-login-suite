# Playwright login suite

A small TypeScript suite you can run locally and from Jenkins. It checks the Sauce Demo login screen, including cases that must fail, and it checks the DummyJSON HTTP API. The same run writes an HTML report for people and a JUnit XML file for Jenkins.

This repository does not deploy a website. Jenkins checks out the code, installs what the tests need, runs them, and stores the report. That is continuous integration for a test suite.

## Run it

Requirements: Node.js 20 and a network connection. Git and Jenkins are only needed for the pipeline.

```powershell
npm ci
npx playwright install chromium
npm test
npm run report
```

| Script | What it runs |
| --- | --- |
| `npm test` | UI and API projects |
| `npm run test:ui` | Sauce Demo only |
| `npm run test:api` | DummyJSON only |
| `npm run report` | Opens the last HTML report |

The last local run recorded 13 tests, 0 failures, in `test-results/junit.xml`.

## Map of the project

```text
playwright.config.ts     runner, projects, reporters
src/pages/LoginPage.ts   screen actions for the login page
src/data/users.ts        public Sauce Demo and DummyJSON users
src/fixtures/api.ts      browser-backed HTTP client for DummyJSON
tests/ui/login.spec.ts   five login checks
tests/api/auth.spec.ts   five auth checks
tests/api/products.spec.ts
Jenkinsfile              the pipeline Jenkins executes
```

`node_modules/`, `playwright-report/`, and `test-results/` are generated. They are gitignored. Jenkins creates them again on every build.

## How the runner is organized

`playwright.config.ts` is the entry point. `@playwright/test` loads it, finds files under `tests/`, and starts worker processes.

Two projects share one config and write one report:

- `ui` opens Chromium at `https://www.saucedemo.com`. `testMatch` limits it to `tests/ui`.
- `api` matches `tests/api` and sets `baseURL` to `https://dummyjson.com`. It uses one worker.

`testIdAttribute: 'data-test'` tells `getByTestId()` to read Sauce Demo's attribute. The site uses `data-test`, not the Playwright default `data-testid`.

`trace: 'on-first-retry'` saves a trace only when a retry happens, so a passing run stays small and a flaky failure still has evidence. `screenshot: 'only-on-failure'` does the same for pictures.

`CI=true` changes three settings:

- `forbidOnly` fails the build if someone left `test.only` in the code. That would otherwise skip every other test and still look green.
- `retries: 1` reruns a failed test once. A second failure is a real failure.
- `workers: 1` on the whole run, plus the API project already limits itself to one worker. One worker is slower and easier to debug on a shared machine.

Locally those CI switches stay off, except the API project, which always uses one worker. DummyJSON stalls when many logins are sent together.

## UI tests and the page object

A page object is a class that owns the locators and actions for one screen. The spec says what the user is trying to do. The page object says how the screen is built.

`LoginPage` finds the username box, password box, Login button, and error banner once. `login()` fills both fields and clicks. `expectError()` waits until the banner is visible and contains the expected text. Waiting is inside the assertion. There is no `sleep`.

The valid-login test is the happy path:

1. Open `/` (the config turns that into `https://www.saucedemo.com/`).
2. Sign in as `standard_user` / `secret_sauce`.
3. Assert the URL contains `inventory.html`.
4. Assert the heading text is `Products`.

Checking the URL and the heading is stronger than checking only one of them. A redirect to an error page could change the URL without showing products, and a bug could leave the user on the login page.

## Negative cases

A negative case proves the product refuses bad input. The assertion is the error, and the user must not reach the inventory.

| Input | Expected banner |
| --- | --- |
| `locked_out_user` / `secret_sauce` | Sorry, this user has been locked out. |
| `invalid_user` / `wrong_password` | Username and password do not match any user in this service |
| empty username, real password | Username is required |
| real username, empty password | Password is required |

The locked-out test also asserts the URL is not the inventory page. An app can show an error and still navigate. Both facts matter.

Users and expected strings live in `src/data/users.ts`. The spec stays a list of behaviors. When a message changes, you update one object.

Sauce Demo publishes these usernames. They are demo credentials, not a secret, so they are in the repo on purpose.

## API tests

The API tests do not click anything. They send HTTP and assert the status code and the JSON body.

Auth, in `tests/api/auth.spec.ts`:

| Call | Expected result |
| --- | --- |
| `POST /auth/login` with `emilys` / `emilyspass` | `200`, a non-empty `accessToken`, and the same username |
| wrong password | `400` and `Invalid credentials` |
| username only | `400` and `Username and password required` |
| `GET /auth/me` with `Authorization: Bearer <token>` | `200` and the same `id` and username as the login response |
| `GET /auth/me` with no token | `401` and `Access Token is required` |

Products, in `tests/api/products.spec.ts`:

| Call | Expected result |
| --- | --- |
| `GET /products` | `200`, a non-empty `products` array, and `total` greater than 0 |
| `GET /products/1` | `200`, `id` 1, a non-empty title, and a numeric price |
| `GET /products/999999` | `404` and a message that contains `not found` |

Assert the status before you read meaning into the body. A `500` with a JSON body is still a failure. Assert a few fields that the caller depends on, not the entire payload. A new optional field should not break the test. A missing `accessToken` should.

`emilys` / `emilyspass` is a public DummyJSON sample user.

### Why the API fixture launches Chromium

Playwright has two HTTP clients. The usual `request` fixture uses a standalone client. On this machine that client intermittently never receives a response from DummyJSON, which is behind Cloudflare. The same calls through Chromium's network stack return in about a second.

`src/fixtures/api.ts` launches Chromium once per worker and opens a fresh browser context for each test. Tests call `api.post` and `api.get` on that context. Each test gets a new context so a login cookie from one test cannot authorize the next test. The "no token" case would be a false pass if the cookie leaked.

The API project still does not open a page. It only borrows the browser's HTTP stack.

## Reports

Every run uses three reporters:

- `list` prints one line per test in the terminal.
- `html` writes `playwright-report/`. Open it with `npm run report`. It shows the test, the error, the screenshot, and the trace when those exist.
- `junit` writes `test-results/junit.xml`. Jenkins reads this file and draws the pass/fail chart. It does not know how to read Playwright's HTML on its own.

`open: 'never'` stops Playwright from launching a browser at the end of a Jenkins build. A service account has no desktop to show it on.

## Jenkins

The job is a Pipeline named `playwright-login-suite`. Its definition is `Jenkinsfile` in this repo, loaded from SCM, so the steps are reviewed with the tests.

What each part does:

- `agent any` runs on this Jenkins controller. There is no separate agent.
- `timeout` stops a stuck browser or a hung download after 20 minutes.
- `CI=true` turns on the stricter Playwright settings above.
- `PATH` starts with `C:\Program Files\nodejs`. The Jenkins Windows service does not inherit your user PATH, so `npm` would otherwise be missing.
- Checkout uses the Git URL configured on the job.
- `npm ci` installs the exact versions in `package-lock.json`. `npm install` can float to newer packages. CI should not.
- `npx playwright install chromium` downloads the browser into the Jenkins account's cache. Your user cache is a different folder, so a browser you installed by hand is invisible to the service.
- `npx playwright test` returns a non-zero exit code when a test fails, which fails the stage.
- `post { always }` runs after a green or red build. `junit` publishes `test-results/junit.xml`. `archiveArtifacts` stores the HTML report and the raw results on the build.

GitHub cannot call this Jenkins, because Jenkins is only on localhost. Open the job and click Build Now. Polling SCM every few minutes is optional and is not required for the demo.

The archived HTML report often will not render inside Jenkins. Jenkins serves each file as a download, and the report page needs its sibling CSS and script files. Download the archive, or run `npm run report` against a local `playwright-report` folder. If the HTML Publisher plugin is installed, the job can also publish the folder so the report opens inside Jenkins.

## Short answers you can say out loud

**What is this suite?** Thirteen Playwright tests. Five drive the Sauce Demo login page. Eight call DummyJSON and check status codes and JSON. Jenkins runs the same command and keeps the report.

**What is a page object?** A class that hides locators. Specs describe behavior. When the login button's markup changes, one class changes, not every test.

**What is a negative test?** A test whose expected result is rejection. Empty fields, a wrong password, a locked user, a missing token, and an unknown product id are negative cases. The bug is a success response.

**How is API testing different from UI testing here?** The UI test opens Chromium, fills a form, and asserts the next page. The API test sends HTTP and asserts status and body. The API test is faster and checks the contract directly. It does not prove the login screen is wired up. You want both.

**What does CI do here?** On Build Now, Jenkins clones the public repo, installs dependencies from the lockfile, installs Chromium, runs `npx playwright test`, and publishes JUnit plus the HTML files. A failing test fails the build.

**Why is the repo public?** This Jenkins has no GitHub credential. A public repo can be cloned with no token. The only credentials in the repo are public demo users.
