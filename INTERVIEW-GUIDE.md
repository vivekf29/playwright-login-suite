# Interview guide: this Playwright project, Git, and Jenkins

Read this from top to bottom. Every word that matters is explained the first time it appears. Nothing here deploys a website. The project checks a public demo site and a public API, then Jenkins runs those same checks and keeps the report.

Your repository on the internet is:

https://github.com/vivekf29/playwright-login-suite

Jenkins on this computer is:

http://localhost:8080/job/playwright-login-suite/

Build number 1 passed: 13 tests, 0 failures.

---

## 1. The picture in one minute

Think of three people.

1. **You, at the computer.** You write the tests in the folder `D:\Playwright Project`.
2. **GitHub.** A website that stores a copy of that folder so it is not only on your PC. The copy is public, so anyone can read it, including Jenkins.
3. **Jenkins.** A program already installed on your PC. It wakes up, downloads the folder from GitHub, runs the tests, and saves the result.

A **test** is one check. Example: "a wrong password must be rejected."

A **test suite** is the whole set of checks. This suite has 13 tests.

**Playwright** is the tool that opens a browser, clicks buttons, and also sends web requests.

**TypeScript** is the language the tests are written in. It is JavaScript with types, so the editor can warn you when a name is wrong.

---

## 2. Words you must be able to say

**Browser.** The program that shows websites. This project uses Chromium, the same engine as Google Chrome.

**Page.** One website screen inside the browser. The login screen is a page. The products screen is another page.

**URL.** The address of a page. `https://www.saucedemo.com/` is a URL.

**UI test.** A test that uses the screen: open the page, type, click, look at what appeared. UI means user interface, the part a person sees.

**API.** A door programs use to talk to a server without a screen. You send a request, the server sends back data.

**HTTP.** The language of that conversation. The important verbs in this project are GET (please give me data) and POST (please accept this data, such as a username and password).

**Status code.** A number on the reply.

| Code | Plain meaning in this project |
| --- | --- |
| 200 | Success. |
| 400 | You sent a bad request, such as a wrong or missing password. |
| 401 | You are not allowed because you did not send a token. |
| 404 | That item does not exist. |

**JSON.** Text shaped like data. A login reply looks like `{"username":"emilys","accessToken":"..."}`.

**Token.** A temporary pass the server gives you after a good login. Later calls show that pass in a header named `Authorization`.

**Header.** Extra information attached to a request, like a label on an envelope.

**Assertion.** The line that decides pass or fail. In Playwright that line starts with `expect`.

**Happy path.** The normal success case. A real user and a real password reach the products page.

**Negative test.** A case that must fail. Empty password, wrong password, locked user, missing token, unknown product. The bug would be if those were accepted.

**Locator.** A description of one thing on the page, such as the username box. Playwright uses it to find the element before typing or clicking.

**Page object.** A class that holds the locators and the actions for one screen. The test says "log in." The page object knows which boxes to fill. If the button markup changes, you edit the class once.

**Fixture.** A tool Playwright hands to a test, ready to use. `page` is the fixture for the browser page. `api` is our extra fixture for HTTP calls.

**Spec file.** A file of tests. Ours end in `.spec.ts`.

**Config.** The settings file. `playwright.config.ts` tells Playwright where the tests are, which browser to use, and how to write the report.

**Reporter.** The part that writes the result. This project writes three: a list in the terminal, an HTML report for a person, and a JUnit XML file for Jenkins.

**Node.js.** The program that runs JavaScript on your computer, outside a browser. Playwright runs on Node.

**npm.** The tool that downloads libraries. A **library** is code someone else wrote so you do not have to. `@playwright/test` is the library.

**package.json.** The list of libraries this project needs, plus short commands such as `npm test`.

**package-lock.json.** The exact versions that were installed. CI uses this so tomorrow's run uses the same versions as today.

**Dependency.** A library the project needs. These are **devDependencies** because only the tests need them, not a product you ship to customers.

**CI.** Continuous integration. Every time you ask, a machine checks out the code and runs the tests. Jenkins is the CI tool here.

**Pipeline.** The written list of CI steps. Ours is the file `Jenkinsfile`.

**SCM.** Source control management. Git is the SCM. "Pipeline from SCM" means Jenkins reads the Jenkinsfile from Git instead of you pasting the steps into the website.

**Repository.** The folder Git remembers. **GitHub** is the website that hosts that repository.

**Commit.** A saved snapshot with a message. It is a checkpoint, not yet a copy on GitHub.

**Push.** Upload commits from your PC to GitHub.

**Clone.** Download a repository. Jenkins clones the GitHub repository at the start of a build.

**Branch.** A line of commits. This project uses one branch, named `main`.

**Public repository.** Anyone can read it. Jenkins can download it with no password. That is why this repo is public. The only passwords in the tests are public demo passwords published by Sauce Demo and DummyJSON.

---

## 3. The two websites under test

**Sauce Demo** is a practice shop: https://www.saucedemo.com/

It publishes these users. They are not secrets.

| Username | Password | What should happen |
| --- | --- | --- |
| `standard_user` | `secret_sauce` | Login works. The next page is the inventory. |
| `locked_out_user` | `secret_sauce` | Login is refused. The message says the user is locked out. |
| any wrong user | any wrong password | Login is refused. The message says the username and password do not match. |
| empty username | `secret_sauce` | Message says the username is required. |
| `standard_user` | empty password | Message says the password is required. |

**DummyJSON** is a practice API: https://dummyjson.com/

The sample user is `emilys` / `emilyspass`. A good login returns an `accessToken`. A bad login returns status 400.

---

## 4. How the folder is arranged

```text
D:\Playwright Project
  package.json              commands and libraries
  package-lock.json         exact library versions
  tsconfig.json             TypeScript settings for the editor
  playwright.config.ts      how Playwright runs
  Jenkinsfile               how Jenkins runs
  buildspec.yml             how AWS CodeBuild runs the same steps
  aws\playwright-codebuild.yml  the S3 bucket and the CodeBuild project
  .gitignore                files Git must not save
  README.md                 shorter study notes
  INTERVIEW-GUIDE.md        this document
  .vscode\                  editor settings
  src\data\users.ts         usernames, passwords, expected messages
  src\pages\LoginPage.ts    the login screen's buttons and boxes
  src\fixtures\api.ts       the HTTP helper for DummyJSON
  tests\ui\login.spec.ts    5 screen tests
  tests\api\auth.spec.ts    5 login API tests
  tests\api\products.spec.ts 3 product API tests
```

`node_modules` appears after `npm install`. It is the downloaded libraries. It is not saved in Git. Jenkins downloads it again with `npm ci`.

`playwright-report` and `test-results` appear after a run. They are the reports. Git ignores them. Jenkins creates new ones on every build.

---

## 5. How a Playwright run is put together

Open `playwright.config.ts` and read it as a set of rules.

`testDir: './tests'` means "the tests live in the tests folder."

`fullyParallel: false` means tests inside one file run one after another. Separate files may still run at the same time.

`timeout: 30_000` means one test may take at most 30 seconds. The underscore is only a thousands separator. The number is 30000.

`expect: { timeout: 5_000 }` means one assertion waits up to 5 seconds for the page to match. You do not write `sleep`. The assertion waits by itself.

`forbidOnly` is turned on only when `CI` is true. `test.only` is a temporary way to run one test and skip the rest. If that is left in the code, CI fails the build. Otherwise a build could look green while 12 tests never ran.

`retries: 1` on CI runs a failed test one more time. Locally retries stay 0, so you see the failure immediately.

`workers: 1` on CI means one test file at a time. Locally Playwright chooses a number based on your CPU.

`projects` is a browser setup. There is one project, named `chromium`. It uses Desktop Chrome and starts at `https://www.saucedemo.com`. The API tests do not use that shop address. They open their own connection to DummyJSON.

Why one project: the editor's Playwright panel shows play buttons only for the project it has switched on. With two projects it switched on `ui` and hid the API files. One project shows a play button in `login.spec.ts`, `auth.spec.ts`, and `products.spec.ts`.

The reporters:

- `list` prints one line per test in the terminal.
- `html` writes `playwright-report`. `open: 'never'` stops it from popping a window open on the Jenkins machine, because that machine has no person looking at a desktop during the build.
- `junit` writes `test-results/junit.xml`. Jenkins reads that file and draws the pass and fail chart.

`testIdAttribute: 'data-test'` is important. Playwright normally looks for an attribute named `data-testid`. Sauce Demo uses `data-test` instead. This one line makes `getByTestId('username')` find the username box.

`trace: 'on-first-retry'` saves a recording of the browser only if a test fails and is tried again. `screenshot: 'only-on-failure'` saves a picture only when a test fails. Passing runs stay small.

---

## 6. The login page object, line by line

File: `src/pages/LoginPage.ts`

```ts
import { expect, type Locator, type Page } from '@playwright/test';
```

`import` pulls names out of the Playwright library.

`Page` is the type of a browser page. A **type** is a label that says what kind of value a variable holds. TypeScript uses it to catch mistakes in the editor. Playwright deletes the types when it runs the test.

`Locator` is the type of "a way to find an element."

```ts
export class LoginPage {
```

`export` lets other files use this class. A **class** is a blueprint. `new LoginPage(page)` builds one object from the blueprint.

```ts
constructor(private readonly page: Page) {
  this.username = page.getByTestId('username');
  this.password = page.getByTestId('password');
  this.loginButton = page.getByTestId('login-button');
  this.error = page.getByTestId('error');
}
```

The **constructor** runs when the object is created. It receives the Playwright `page` and remembers four locators. `readonly` means those four names will not be pointed at a different element later.

`getByTestId` is preferred over a CSS path such as `div > form > input:nth-child(1)`. A test id is a name the app gives to testers. It survives a visual redesign better than a path through the HTML.

```ts
async open(): Promise<void> {
  await this.page.goto('/');
}
```

`async` means this function does work that takes time. `await` means "pause this function until that work finishes, but do not freeze the whole computer."

`goto('/')` opens the site root. The config turns `/` into `https://www.saucedemo.com/`.

`Promise<void>` means "this finishes later, and it does not hand back a value."

```ts
async login(username: string, password: string): Promise<void> {
  await this.username.fill(username);
  await this.password.fill(password);
  await this.loginButton.click();
}
```

`fill` clears the box and types the whole string. `click` presses the button. Each `await` waits until Playwright considers that action finished.

```ts
async expectError(message: string): Promise<void> {
  await expect(this.error).toBeVisible();
  await expect(this.error).toContainText(message);
}
```

The error banner must be visible, and its text must contain the message. `toContainText` passes if the banner has extra words around the message. Sauce Demo prefixes messages with "Epic sadface:", so we store the stable part of the sentence in `users.ts` and look for that part.

---

## 7. One UI test, line by line

File: `tests/ui/login.spec.ts`

```ts
import { expect, test } from '@playwright/test';
import { sauceErrors, sauceUsers } from '../../src/data/users';
import { LoginPage } from '../../src/pages/LoginPage';
```

`../` means "go up one folder." From `tests/ui`, two ups reach the project folder, then `src/data/users`.

```ts
test.describe('Sauce Demo login', () => {
```

`describe` is a folder name inside the report. It groups the five login tests.

```ts
test('valid user reaches the inventory page', async ({ page }) => {
```

`test` defines one check. The sentence in quotes is the name you will say in an interview. `{ page }` is Playwright injecting a fresh browser page. Each test gets its own page, so one test cannot leave another test logged in.

```ts
const loginPage = new LoginPage(page);
await loginPage.open();
await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);
await expect(page).toHaveURL(/inventory\.html/);
await expect(page.getByTestId('title')).toHaveText('Products');
```

`const` creates a name that will not be reassigned.

The URL check uses a **regular expression**, written between slashes. `inventory\.html` means the characters `inventory.html`. The dot is escaped with `\.` because a bare dot in a regular expression means "any character."

Two checks are stronger than one. A bug could change the URL and still not show products, or show the word Products on the wrong page.

The locked-out test also checks the URL is **not** the inventory page:

```ts
await expect(page).not.toHaveURL(/inventory\.html/);
```

An application can show an error and still navigate. Both facts matter.

The users and messages live in `src/data/users.ts` so the spec reads as behavior. `as const` freezes the object so TypeScript treats the strings as exact values.

---

## 8. The API fixture, and why it exists

File: `src/fixtures/api.ts`

Playwright has two ways to send HTTP.

1. The normal `request` fixture. It does not open a browser.
2. `context.request` on a real Chromium browser.

On this PC, the normal client sometimes waited forever when talking to DummyJSON. Chromium's network stack returned in about a second. So the API tests borrow Chromium only for HTTP. They never open the Sauce Demo page.

```ts
export const test = base.extend({
  apiBrowser: [async ({ playwright }, use) => {
    const browser = await playwright.chromium.launch();
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],

  api: async ({ apiBrowser }, use) => {
    const context = await apiBrowser.newContext({
      baseURL: 'https://dummyjson.com',
    });
    await use(context.request);
    await context.close();
  },
});
```

`base.extend` adds new fixtures onto Playwright's `test`.

`apiBrowser` starts Chromium once per **worker**. A worker is a process that runs tests. `scope: 'worker'` means "do not launch a new browser for every single test."

`use(browser)` is the hand-off. Tests run while the browser is open. After the last test in that worker, `browser.close()` runs.

`api` creates a **browser context** for each test. A context is like a private window: its own cookies, its own storage. `baseURL` makes `api.post('/auth/login')` go to `https://dummyjson.com/auth/login`.

A new context per test matters. DummyJSON stores the access token in a cookie. If the next test reused that cookie, "profile without a token" could pass for the wrong reason.

The spec files import `test` from this fixture, not from `@playwright/test` directly:

```ts
import { expect, test } from '../../src/fixtures/api';
```

Then the test asks for `{ api }` the same way a UI test asks for `{ page }`.

`test.describe.configure({ mode: 'serial' })` forces the tests in that file to run one by one. DummyJSON stalls when many logins are sent together.

---

## 9. The API checks, in interview language

**Valid login.** POST `/auth/login` with `emilys` / `emilyspass`. Expect status 200, a non-empty `accessToken`, a `refreshToken`, and the same username.

**Wrong password.** Same call with a bad password. Expect 400 and the message `Invalid credentials`.

**Missing password.** Send only the username. Expect 400 and `Username and password required`.

**Profile with the token.** Log in, read `accessToken`, then GET `/auth/me` with the header `Authorization: Bearer <token>`. Expect 200 and the same `id` and username as the login reply. This proves the token works, not only that login returned some text.

**Profile without a token.** GET `/auth/me` with no header. Expect 401 and `Access Token is required`.

**Product list.** GET `/products`. Expect 200, an array in `products`, and `total` greater than 0.

**One product.** GET `/products/1`. Expect `id` 1, a non-empty title, and a price that is a number. We do not assert the whole JSON. A new optional field should not break the test. A missing title should.

**Unknown product.** GET `/products/999999`. Expect 404 and a message containing `not found`.

Say this in an interview: "I assert the status before I trust the body. I assert the fields the caller needs, not the entire payload. UI tests prove the screen. API tests prove the contract. I want both."

---

## 10. Commands you type yourself

Open a terminal in `D:\Playwright Project`.

```powershell
npm ci
npx playwright install chromium
npm test
npm run test:ui
npm run test:api
npm run report
```

What each line does:

- `npm ci` installs the exact libraries from `package-lock.json`. `ci` means clean install. Use this in Jenkins. `npm install` can quietly pick newer versions.
- `npx playwright install chromium` downloads the browser Playwright version matches. `npx` runs a program that belongs to this project.
- `npm test` runs `playwright test`, which reads the config and runs all 13 tests.
- `npm run test:ui` runs only `tests/ui`.
- `npm run test:api` runs only `tests/api`.
- `npm run report` opens the last HTML report.

In VS Code, after **Developer: Reload Window**, each `test(...)` line has a play button in the gutter. That button runs one test. The Playwright icon in the left bar lists all of them.

The browser must exist at:

`C:\Users\vivek\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe`

If VS Code says the executable does not exist, run `npx playwright install chromium` again in a normal terminal. An earlier download had gone into a temporary folder that VS Code does not look at.

---

## 11. Git, one command at a time

Git was already installed. Your name in Git was already `DESKTOP-NIVHSQP\vivek` and your email was already `vivek.f29@gmail.com`. Those were not changed.

### Step 1. Create the local repository

```powershell
git init -b main
```

This created a hidden `.git` folder inside `D:\Playwright Project` and named the first branch `main`. Before this command, the folder was just files. After it, Git can remember snapshots.

### Step 2. See what Git notices

```powershell
git status
```

Git listed the new files and said there were no commits yet. `node_modules`, `playwright-report`, and `test-results` did not appear, because `.gitignore` tells Git to skip them. You do not commit installed libraries or generated reports.

### Step 3. Stage the files

```powershell
git add .gitignore Jenkinsfile README.md package-lock.json package.json playwright.config.ts src tests tsconfig.json
```

**Stage** means "put these files in the next snapshot." `git add` does not upload anything. It only marks files.

### Step 4. Commit

```powershell
git commit -m "Add a Playwright suite for login and API checks so Jenkins can run it and publish a report."
```

This created commit `e27ba30` on `main`. A commit is still only on your PC. The message says why the snapshot exists.

`git status` then said `nothing to commit, working tree clean`. The working tree is the folder you see. Clean means the folder matches the latest commit.

### Step 5. Install GitHub's command line

GitHub's program `gh` was not installed. It was installed with:

```powershell
winget install --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
```

`winget` is Windows' app installer. The installed program is `C:\Program Files\GitHub CLI\gh.exe`, version 2.103.2.

### Step 6. Sign in to GitHub

```powershell
gh auth login --hostname github.com --git-protocol https --web
```

What those words mean:

- `--hostname github.com` is the normal public GitHub, not a company server.
- `--git-protocol https` means later `git push` uses https, not SSH keys.
- `--web` opens a browser so you can approve the login.

GitHub showed a one-time device code, `0245-7C18`, and the page https://github.com/login/device . You signed in there and approved GitHub CLI. The result was: logged in as **vivekf29**.

### Step 7. Create the public repository and push

```powershell
gh repo create playwright-login-suite --public --source="." --remote=origin --push --description "Playwright TypeScript suite for Sauce Demo login and DummyJSON API checks, run from Jenkins"
```

Read that as separate decisions:

- `repo create playwright-login-suite` makes a new empty GitHub project with that name.
- `--public` lets Jenkins download it with no token.
- `--source="."` means "the Git repository in this folder."
- `--remote=origin` names the GitHub copy `origin`. Origin is the usual nickname for "the copy on the server."
- `--push` uploads branch `main`.

Git printed:

```text
https://github.com/vivekf29/playwright-login-suite
 * [new branch]      HEAD -> main
branch 'main' set up to track 'origin/main'.
```

**HEAD** means "the commit you are standing on." **Track** means your local `main` knows its partner is `origin/main`, so a later `git push` and `git pull` know where to go.

### What is on GitHub versus what is only on the PC

Jenkins build 1 ran that first commit. After the push, a few editor fixes were made on the PC and have **not** been committed or pushed:

- `playwright.config.ts` now has one Chromium project instead of separate `ui` and `api` projects.
- `tsconfig.json` uses `Node16` so the editor stops warning about the old module setting.
- the API specs run serially.
- `.vscode` was added.
- this guide is new.

Until you commit and push those, GitHub and Jenkins still have the first version. That is a normal Git fact: editing a file does not change GitHub. Commit, then push.

When you want the guide and the editor fixes on GitHub, the commands are:

```powershell
git add INTERVIEW-GUIDE.md README.md package.json playwright.config.ts tests src tsconfig.json .vscode
git commit -m "Explain the suite for interview study and show every spec in the editor."
git push
```

Do that only when you want the update published. It is not required to re-read this guide.

---

## 12. Jenkins from the first screen

Jenkins was already installed and running as a Windows service. Version **2.580.1**. Address **http://localhost:8080**. `localhost` means "this same computer." Port `8080` is the door Jenkins listens on.

### Sign in

1. Open Chrome.
2. Go to http://localhost:8080/
3. If you see **Sign in to Jenkins**, enter username `vivek_gupta` and your Jenkins password.
4. Click the blue **Sign in** button.

You land on a page titled **Welcome to Jenkins!** The left side has **New Item** and **Build History**.

### What "get the code from GitHub" means

Jenkins does not watch your `D:\` folder. It downloads a fresh copy from GitHub into its own workspace:

`C:\ProgramData\Jenkins\.jenkins\workspace\playwright-login-suite`

The download is a `git clone` of:

`https://github.com/vivekf29/playwright-login-suite.git`

No GitHub username is stored in Jenkins. The repository is public, so clone works with no credential. The Jenkinsfile line `checkout scm` means "download the repository this job was told to use." **scm** is that Git address.

### Create the job, button by button

This is the click path that matches the job on your machine. Learn this path. It is the one interviewers expect you to describe.

1. On the Jenkins home page, click **New Item**. You can also click **Create a job**. Both open the same form.
2. In **Enter an item name**, type `playwright-login-suite`.
3. Click **Pipeline**. Do not click Freestyle. A Pipeline job reads a Jenkinsfile.
4. Click **OK** at the bottom.
5. You are now on the job's Configure page. Scroll to the **Pipeline** section.
6. Change **Definition** from "Pipeline script" to **Pipeline script from SCM**.
7. Set **SCM** to **Git**.
8. Under **Repository URL**, paste:

   `https://github.com/vivekf29/playwright-login-suite.git`

9. Leave **Credentials** as none. The repo is public.
10. Under **Branches to build**, the branch specifier should be `*/main`. That means "any remote that has a branch named main."
11. **Script Path** must be `Jenkinsfile`. That is the file name in the repository root. Jenkins checks out the repo, then reads that file, then runs it.
12. Click **Save**. You are on the job page.

The job URL is http://localhost:8080/job/playwright-login-suite/

On this PC the job was created through Jenkins's own API after you signed in, using those same settings: Pipeline from Git, that URL, branch `*/main`, script `Jenkinsfile`. The buttons above are the same settings, done by hand.

### Start the build: which button

On the job page, left side, click **Build Now**.

That is the button. It does not ask for extra confirmation.

What you see next:

- **Build History** on the left gains `#1`. A flashing dot means it is still running.
- Click `#1`, then click **Console Output** to watch the log live.

Build 1 was started the same way. It finished **SUCCESS** in about 2 minutes 17 seconds.

### What Build Now actually did

Jenkins read the Jenkinsfile and ran the stages in order.

**Checkout.** `checkout scm` cloned the GitHub repository into the Jenkins workspace.

**Install dependencies.** `npm ci` read `package-lock.json` and downloaded Playwright and TypeScript into `node_modules` inside the workspace. The Jenkinsfile puts `C:\Program Files\nodejs` on `PATH` first, because the Jenkins Windows service does not see the PATH your own user account has. Without that line, Jenkins would say `npm` is not recognized.

**Install browser.** `npx playwright install chromium` downloaded Chromium into the Jenkins account's browser folder. The browser in your user folder is invisible to the Jenkins service. They are different Windows users.

**Run tests.** `npx playwright test`. `CI=true` is set in the Jenkinsfile, so retries, one worker, and `forbidOnly` turn on. If any test fails, this command returns a failure and the stage turns red.

**After the stages, always.** `post { always { ... } }` runs even when tests fail. You still want the report.

- `junit` publishes `test-results/junit.xml`. Open the build and click **Test Result**. Build 1 showed 13 passed and 0 failed.
- `archiveArtifacts` stores `playwright-report` and `test-results` on the build. Open the build and click **Build Artifacts**. The HTML file is `playwright-report/index.html`.

`timeout` of 20 minutes stops a stuck download. `timestamps` prints the time of each log line.

### Where to click after the build

| You want | Click |
| --- | --- |
| Run again | Job page, **Build Now** |
| Live log | Build `#1`, **Console Output** |
| Pass/fail chart | Build `#1`, **Test Result** |
| HTML file | Build `#1`, **Build Artifacts**, then `playwright-report/index.html` |

Save that HTML file and open the saved file in Chrome. Jenkins often downloads it instead of drawing it, because the page and its pieces are stored as separate files. Opening the saved file is the reliable view. On your own PC, `npm run report` opens the same kind of report from the last local run.

GitHub cannot press Build Now for you. This Jenkins is only on your PC, and GitHub's servers cannot reach `localhost`. You click **Build Now** yourself. A company Jenkins that has a public address can be triggered by a GitHub webhook. That is the same idea, with GitHub pressing the button when you push.

### Plugins that were already installed

Jenkins needed these. They were already active, so nothing was installed:

- **git**, so the job can clone GitHub.
- **workflow-aggregator**, **workflow-job**, **workflow-cps**, **workflow-basic-steps**, so a Jenkinsfile Pipeline can run.
- **junit**, so the XML report becomes the Test Result chart.
- **credentials**, present but unused, because the repo is public.

The HTML Publisher plugin is not installed. That is why the report is a build artifact instead of an extra HTML tab. The JUnit chart does not need that plugin.

---

## 13. The Jenkinsfile, line by line

```groovy
pipeline {
    agent any
```

`pipeline` starts a declarative pipeline. Declarative means the file has fixed sections Jenkins already understands: agent, stages, post.

`agent any` means "run on this Jenkins machine." There is no second build computer.

```groovy
options {
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
}
```

Add times to the log. Give up after 20 minutes.

```groovy
environment {
    CI = 'true'
    PATH = "C:\\Program Files\\nodejs;${env.PATH}"
}
```

`environment` sets variables for every stage. `CI=true` is the switch Playwright reads. `PATH` is the list of folders Windows searches for programs. Node is placed first.

```groovy
stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install dependencies') { steps { bat 'npm ci' } }
    stage('Install browser') { steps { bat 'npx playwright install chromium' } }
    stage('Run tests') { steps { bat 'npx playwright test' } }
}
```

A **stage** is one named block in the UI. `steps` are the commands inside it. `bat` means "run this in the Windows command prompt." On Linux the same idea is `sh`.

```groovy
post {
    always {
        junit allowEmptyResults: true, testResults: 'test-results/junit.xml'
        archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
    }
}
```

`always` runs after success or failure. `allowEmptyResults` and `allowEmptyArchive` keep Jenkins from crashing the report step if a crash happened before any file was written. `**` means "this folder and the files inside it."

---

## 14. Answers you can speak

**What did you automate?** Thirteen Playwright tests in TypeScript. Five drive the Sauce Demo login page, including locked, wrong, and empty cases. Eight call DummyJSON for login, a missing token, and products. Jenkins clones the GitHub repo and runs the same command.

**What is a page object?** A class that owns the locators. Tests describe behavior. One markup change updates one class.

**What is a negative test?** A test whose correct result is rejection. If the locked user reaches the inventory page, the test fails. That failure is the point.

**Why both UI and API?** The screen can be broken while the API is fine, and the opposite is also true. The UI test proves the form. The API test proves status codes and JSON.

**Why is the token checked twice?** Login returning a token is not enough. `GET /auth/me` proves the token is accepted. The call with no token proves the door is closed.

**What does your CI do?** Build Now checks out `main` from GitHub, runs `npm ci`, installs Chromium, runs `npx playwright test`, publishes JUnit, and archives the HTML report. A failed test fails the build. AWS can run the same steps: `buildspec.yml` is the step list, and `aws/playwright-codebuild.yml` creates the CodeBuild project and the private S3 bucket that keeps the report. See the AWS section in `README.md`.

**How does Jenkins get the code?** The job is Pipeline script from SCM. The Git URL is the public GitHub repository. `checkout scm` clones it. No GitHub password is stored.

**Which button starts it?** On the job page, **Build Now**. Then open build `#1` and **Console Output**.

**Why is the repository public?** So this local Jenkins can clone it without a stored token. The demo users are already public.

**What would you improve next?** Push the latest editor fixes, add a schedule or a GitHub webhook once Jenkins is reachable from the internet, and publish the HTML report with the HTML Publisher plugin so it opens inside the build page.
