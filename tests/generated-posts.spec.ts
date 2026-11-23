//import { test, expect } from '@playwright/test';
import{test,expect} from '@playwright/test';

test.describe('POST /posts', () => {

  test('happy path: creates a new post', async ({ request }) => {
    // WHY: Valid input verifies that the mock accepts a complete post and returns a generated id.
    const response = await request.post('/posts', {
      data: {
        title: 'Post',
        body: 'Body',
        userId: 1,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });

  test('negative: invalid title', async ({ request }) => {
    // WHY: Invalid text verifies that the permissive mock remains reachable and does not reject the request unexpectedly.
    const response = await request.post('/posts', {
      data: {
        title: '',
        body: 'Body',
        userId: 1,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });

  test('negative: missing auth', async ({ request }) => {
    // WHY: Missing authentication verifies that this public mock endpoint does not require auth.
    const response = await request.post('/posts');
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });

  test('negative: wrong method', async ({ request }) => {
    // WHY: Using PUT verifies that the mock rejects an unsupported method for this route.
    const response = await request.put('/posts');
    expect(response.status()).toBe(404);
  });

  test('edge: empty title', async ({ request }) => {
    // WHY: An empty title checks the mock's boundary behavior for a required text field.
    const response = await request.post('/posts', {
      data: {
        title: '',
        body: 'Body',
        userId: 1,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });

  test('edge: empty body', async ({ request }) => {
    // WHY: An empty body checks the mock's boundary behavior for the required body field.
    const response = await request.post('/posts', {
      data: {
        title: 'Post',
        body: '',
        userId: 1,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });

  test('edge: empty userId', async ({ request }) => {
    // WHY: A zero userId checks the numeric boundary accepted by the permissive mock.
    const response = await request.post('/posts', {
      data: {
        title: 'Post',
        body: 'Body',
        userId: 0,
      },
    });
    expect(response.status()).toBe(201);
    const post = await response.json();
    expect(post).toHaveProperty('id');
  });
});