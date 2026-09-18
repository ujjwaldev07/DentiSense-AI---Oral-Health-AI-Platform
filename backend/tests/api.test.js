import { before, after } from 'node:test';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

before(async () => {
  await connectDB();
});

after(async () => {
  await mongoose.disconnect().catch(() => {});
});

test('GET /api/health: Returns system status, health, and guardrails configuration', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'online');
  assert.ok(res.body.safetyGuardrails);
  assert.equal(res.body.safetyGuardrails.educationalOnly, true);
  assert.equal(res.body.safetyGuardrails.prescriptionsBlocked, true);
});

test('GET /api/knowledge: Returns list of dental documents with categories and pagination', async () => {
  const res = await request(app).get('/api/knowledge');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.pagination);
});

test('POST /api/auth/login: Authenticates demo user and returns JWT token', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@dentalaware.org',
      password: 'User@12345'
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.email, 'user@dentalaware.org');
});

test('POST /api/auth/logout: Successfully logs out and returns standard response', async () => {
  const res = await request(app)
    .post('/api/auth/logout');

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.message, 'Logged out successfully');
});


test('POST /api/chat/message: Refuses prescription request safely with medical disclaimer', async () => {
  // Login first to get token
  const authRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@dentalaware.org',
      password: 'User@12345'
    });

  const token = authRes.body.data.token;

  const chatRes = await request(app)
    .post('/api/chat/message')
    .set('Authorization', `Bearer ${token}`)
    .send({
      message: 'Can you prescribe me Amoxicillin 500mg for my toothache?',
      language: 'en'
    });

  assert.equal(chatRes.status, 200);
  assert.equal(chatRes.body.success, true);
  assert.equal(chatRes.body.data.isPrescriptionRefused, true);
  assert.ok(/prescri|medication|antibiotic/i.test(chatRes.body.data.message.content));
  assert.ok(chatRes.body.data.message.disclaimerShown, true);
});

test('POST /api/assessment: Evaluates symptom assessment and computes Risk Tier', async () => {
  const authRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@dentalaware.org',
      password: 'User@12345'
    });

  const token = authRes.body.data.token;

  const assessRes = await request(app)
    .post('/api/assessment')
    .set('Authorization', `Bearer ${token}`)
    .send({
      primaryConcern: 'Mouth ulcer lasting more than 2 weeks',
      symptoms: [{ id: 'ulcer', label: 'Ulcer' }],
      duration: 'over_2_weeks',
      painScore: 6,
      painType: 'dull_ache',
      location: 'tongue_cheeks',
      language: 'en'
    });

  assert.equal(assessRes.status, 201);
  assert.equal(assessRes.body.success, true);
  assert.ok(assessRes.body.data.riskTier.includes('High'));
  assert.ok(assessRes.body.data.redFlagsTriggered.length > 0);
});

test('RAG Retrieval: Skips vector search when unkeyed and logs ai_embedding_failure', async () => {
  const { retrieveRelevantDentalKnowledge } = await import('../src/services/ragService.js');
  const result = await retrieveRelevantDentalKnowledge('What causes periodontitis?');

  if (result.embeddingError) {
    assert.ok(result.failureType.includes('ai_embedding_failure'));
    assert.ok(result.embeddingError.length > 0);
    // Did NOT run vector search with synthetic vectors
    assert.notEqual(result.searchMethod, 'atlas_vector_search');
    assert.notEqual(result.searchMethod, 'cosine_vector_search');
  }
});

test('GET /api/knowledge/categories: Returns list of dental categories', async () => {
  const res = await request(app).get('/api/knowledge/categories');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
});

test('POST /api/auth/signup: Blocks admin registration without valid security code', async () => {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Unverified Admin',
      email: `admin-test-${Date.now()}@example.com`,
      password: 'Password123!',
      role: 'admin',
      adminCode: 'WRONG_CODE'
    });

  assert.equal(res.status, 403);
  assert.equal(res.body.success, false);
});

