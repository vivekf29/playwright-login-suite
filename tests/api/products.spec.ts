import { expect, test } from '../../src/fixtures/api';

test.describe.configure({ mode: 'serial' });

test.describe('DummyJSON products API', () => {
  test('product list is not empty', async ({ api }) => {
    const response = await api.get('/products');

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.products)).toBe(true);
    expect(body.products.length).toBeGreaterThan(0);
    expect(body.total).toBeGreaterThan(0);
  });

  test('a known product has id, title, and price', async ({ api }) => {
    const response = await api.get('/products/1');

    expect(response.status()).toBe(200);
    const product = await response.json();
    expect(product.id).toBe(1);
    expect(typeof product.title).toBe('string');
    expect(product.title.length).toBeGreaterThan(0);
    expect(typeof product.price).toBe('number');
  });

  test('an unknown product id returns 404', async ({ api }) => {
    const response = await api.get('/products/999999');

    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.message).toContain('not found');
  });
});
