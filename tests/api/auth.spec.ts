import { apiUser } from '../../src/data/users';
import { expect, test } from '../../src/fixtures/api';

test.describe.configure({ mode: 'serial' });

test.describe('DummyJSON auth API', () => {
  test('valid login returns an access token', async ({ api }) => {
    const response = await api.post('/auth/login', { data: apiUser });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.accessToken.length).toBeGreaterThan(0);
    expect(body.username).toBe(apiUser.username);
    expect(body.refreshToken).toEqual(expect.any(String));
  });

  test('wrong password is rejected', async ({ api }) => {
    const response = await api.post('/auth/login', {
      data: { username: apiUser.username, password: 'wrong-password' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Invalid credentials');
  });

  test('missing password is rejected', async ({ api }) => {
    const response = await api.post('/auth/login', {
      data: { username: apiUser.username },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message).toBe('Username and password required');
  });

  test('authenticated profile matches the logged-in user', async ({ api }) => {
    const login = await api.post('/auth/login', { data: apiUser });
    expect(login.status()).toBe(200);
    const session = await login.json();

    const me = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    expect(me.status()).toBe(200);
    const profile = await me.json();
    expect(profile.username).toBe(session.username);
    expect(profile.id).toBe(session.id);
  });

  test('profile without a token is rejected', async ({ api }) => {
    const response = await api.get('/auth/me');

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toBe('Access Token is required');
  });
});
