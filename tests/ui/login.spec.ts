import { expect, test } from '@playwright/test';
import { sauceErrors, sauceUsers } from '../../src/data/users';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('Sauce Demo login', () => {
  test('valid user reaches the inventory page', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(sauceUsers.standard.username, sauceUsers.standard.password);

    await expect(page).toHaveURL(/inventory\.html/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });

  test('locked-out user sees the lock message', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(sauceUsers.lockedOut.username, sauceUsers.lockedOut.password);

    await loginPage.expectError(sauceErrors.lockedOut);
    await expect(page).not.toHaveURL(/inventory\.html/);
  });

  test('wrong password is rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(sauceUsers.invalid.username, sauceUsers.invalid.password);

    await loginPage.expectError(sauceErrors.mismatch);
  });

  test('empty username is rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login('', sauceUsers.standard.password);

    await loginPage.expectError(sauceErrors.usernameRequired);
  });

  test('empty password is rejected', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.open();
    await loginPage.login(sauceUsers.standard.username, '');

    await loginPage.expectError(sauceErrors.passwordRequired);
  });
});
