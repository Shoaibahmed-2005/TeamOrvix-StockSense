import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

// NOTE: setup.ts truncates all tables between each test for isolation.
// Therefore every test that needs a user must create one inside the test itself.

const BASE_USER = {
  fullName: 'Auth Test User',
  loginId:  'authtestuser',
  email:    'auth+test@stocksense.test',
  password: 'Password123!',
};

async function createAndLogin(overrides?: Partial<typeof BASE_USER>) {
  const user = { ...BASE_USER, ...overrides };
  const signupRes = await request(app).post('/api/auth/signup').send(user);
  return { user, cookie: signupRes.headers['set-cookie'] as string | string[] };
}

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns a cookie', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(BASE_USER)
      .expect(201);

    expect(res.body.user.email).toBe(BASE_USER.email);
    expect(res.body.user.fullName).toBe(BASE_USER.fullName);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email (creates user then tries again)', async () => {
    await request(app).post('/api/auth/signup').send(BASE_USER).expect(201);
    await request(app).post('/api/auth/signup').send(BASE_USER).expect(409);
  });

  it('rejects short password', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ ...BASE_USER, email: 'other@stocksense.test', password: 'short' })
      .expect(422);
  });

  it('rejects invalid email', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ ...BASE_USER, email: 'not-an-email' })
      .expect(422);
  });
});

describe('POST /api/auth/login', () => {
  it('returns user and sets cookie for valid credentials', async () => {
    await request(app).post('/api/auth/signup').send(BASE_USER).expect(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: BASE_USER.email, password: BASE_USER.password })
      .expect(200);

    expect(res.body.user.email).toBe(BASE_USER.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects wrong password', async () => {
    await request(app).post('/api/auth/signup').send(BASE_USER).expect(201);

    await request(app)
      .post('/api/auth/login')
      .send({ email: BASE_USER.email, password: 'WrongPassword!' })
      .expect(401);
  });

  it('rejects unknown email', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@stocksense.test', password: BASE_USER.password })
      .expect(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .expect(200);

    expect(res.body.message).toBe('Logged out');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a cookie', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('returns user when authenticated', async () => {
    const { cookie } = await createAndLogin();

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(meRes.body.user.email).toBe(BASE_USER.email);
  });
});
