import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPrescriptionRequest, detectRedFlags, appendDisclaimer, getSystemSafetyPrompt } from '../src/utils/safetyGuardrails.js';
import { chunkText } from '../src/utils/textChunker.js';
import { calculateCosineSimilarity } from '../src/utils/cosineSimilarity.js';
import { evaluateSymptomAssessment } from '../src/services/assessmentService.js';
import {
  generateEmbedding,
  generateMockTestEmbedding,
  clearEmbeddingCache,
  EMBEDDING_DIMENSION
} from '../src/services/embeddingService.js';
import { retrieveRelevantDentalKnowledge } from '../src/services/ragService.js';
import { generateDentalAIResponse } from '../src/services/geminiService.js';
import { RISK_TIERS } from '../src/config/constants.js';
import { ENV } from '../src/config/env.js';

test('Safety Guardrails: Should detect prescription attempts and refuse medications', () => {
  const query1 = 'Can you prescribe amoxicillin 500mg for my toothache?';
  const query2 = 'What is the dosage of paracetamol I should take?';
  const query3 = 'What causes bleeding gums?';

  assert.equal(checkPrescriptionRequest(query1), true);
  assert.equal(checkPrescriptionRequest(query2), true);
  assert.equal(checkPrescriptionRequest(query3), false);
});

test('Safety Guardrails: Should detect emergency red flags like non-healing ulcers >2 weeks', () => {
  const query = 'I have a mouth ulcer on my cheek for over 2 weeks and it is not healing';
  const redFlags = detectRedFlags(query);

  assert.ok(redFlags.length > 0);
  assert.equal(redFlags[0].code, 'non_healing_ulcer_over_2_weeks');
  assert.equal(redFlags[0].urgentActionRequired, true);
});

test('Safety Guardrails: Should append educational medical disclaimer across EN, HI, MR', () => {
  const content = 'Brush your teeth twice daily with fluoride toothpaste.';
  const enWithDisclaimer = appendDisclaimer(content, 'en');
  const hiWithDisclaimer = appendDisclaimer(content, 'hi');
  const mrWithDisclaimer = appendDisclaimer(content, 'mr');

  assert.ok(enWithDisclaimer.includes('Educational Disclaimer'));
  assert.ok(hiWithDisclaimer.includes('शैक्षणिक अस्वीकरण'));
  assert.ok(mrWithDisclaimer.includes('शैक्षणिक अस्वीकरण'));
});

test('Prompt Injection Defense: System prompt strictly isolates user inquiry and enforces safety', () => {
  const systemPrompt = getSystemSafetyPrompt('en', '<retrieved_dental_context>Gingivitis info</retrieved_dental_context>');
  assert.ok(systemPrompt.includes('PROMPT INJECTION & SAFETY ENFORCEMENT RULES'));
  assert.ok(systemPrompt.includes('NEVER DIAGNOSE A DISEASE'));
  assert.ok(systemPrompt.includes('NO PRESCRIPTIONS OR DOSAGES'));
  assert.ok(systemPrompt.includes('<user_inquiry>'));
});

test('Production Embedding Service: Throws clear error when unkeyed instead of returning synthetic fallback', async () => {
  clearEmbeddingCache();
  const originalKey = ENV.GEMINI_API_KEY;
  ENV.GEMINI_API_KEY = '';
  const text = 'How to prevent tooth decay and cavities?';

  try {
    await assert.rejects(
      async () => {
        await generateEmbedding(text);
      },
      (err) => {
        assert.ok(err.message.includes('GEMINI_API_KEY is not configured') || err.message.includes('Gemini Embedding API failure'));
        return true;
      }
    );
  } finally {
    ENV.GEMINI_API_KEY = originalKey;
    clearEmbeddingCache();
  }
});

test('Unit Test Helper: generateMockTestEmbedding generates isolated 768-dim unit-norm vector for testing', () => {
  const text = 'How to prevent tooth decay and cavities?';
  const mockVector = generateMockTestEmbedding(text);

  assert.equal(mockVector.length, EMBEDDING_DIMENSION);
  assert.equal(mockVector.length, 768);

  const sumSq = mockVector.reduce((acc, val) => acc + val * val, 0);
  const norm = Math.sqrt(sumSq);
  assert.ok(Math.abs(norm - 1.0) < 0.001);
});

test('AI Service Unavailable Fallback: Returns safe transparent notice without unsourced clinical claims', async () => {
  const originalKey = ENV.GEMINI_API_KEY;
  ENV.GEMINI_API_KEY = '';

  try {
    const response = await generateDentalAIResponse('What is quantum mechanics?', {
      language: 'en',
      isLowConfidence: true
    });

    assert.ok(response.content.includes('AI Service Temporarily Unavailable') || response.content.includes('temporarily unable to process'));
    assert.ok(response.content.includes('consult a qualified dental professional'));
    assert.equal(response.isAiFailure, true);
  } finally {
    ENV.GEMINI_API_KEY = originalKey;
  }
});

test('Text Chunker: Should chunk long dental texts into overlapping sections', () => {
  const longText = 'Paragraph 1 about caries. '.repeat(30) + '\n\n' + 'Paragraph 2 about prevention. '.repeat(30);
  const chunks = chunkText(longText, { maxChunkSize: 200, overlap: 40 });

  assert.ok(chunks.length > 1);
  assert.ok(chunks[0].chunkText.length > 0);
  assert.ok(chunks[0].tokenCount > 0);
});

test('Cosine Similarity: Should compute vector dot-product similarity accurately', () => {
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  const vecC = [0, 1, 0];

  assert.equal(calculateCosineSimilarity(vecA, vecB), 1);
  assert.equal(calculateCosineSimilarity(vecA, vecC), 0);
});

test('Assessment Service: Should evaluate high-risk when red flags or severe pain are present', () => {
  const severeAssessment = {
    primaryConcern: 'Mouth sore',
    symptoms: [{ id: 'ulcer', label: 'Ulcer' }],
    duration: 'over_2_weeks',
    painScore: 7,
    location: 'tongue_cheeks'
  };

  const evalResult = evaluateSymptomAssessment(severeAssessment);
  assert.equal(evalResult.riskTier, RISK_TIERS.HIGH);
  assert.ok(evalResult.redFlagsTriggered.length > 0);
  assert.ok(evalResult.recommendedQuestionsForDentist.length > 0);
});
