import { z } from 'zod';
import { LANGUAGES, DENTAL_CATEGORIES } from '../config/constants.js';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  preferredLanguage: z.enum(Object.values(LANGUAGES)).optional().default('en'),
  role: z.enum(['user', 'admin']).optional().default('user'),
  adminCode: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  preferredLanguage: z.enum(Object.values(LANGUAGES)).optional(),
  oralHealthProfile: z.object({
    ageGroup: z.enum(['child', 'teen', 'adult', 'senior', 'unspecified']).optional(),
    brushingFrequencyPerDay: z.number().min(0).max(5).optional(),
    flossingHabit: z.enum(['daily', 'weekly', 'rarely', 'never']).optional(),
    lastDentalVisit: z.enum(['less_than_6_months', '6_to_12_months', 'over_1_year', 'never']).optional(),
    hasDenturesOrBraces: z.boolean().optional(),
    tobaccoOrBetelNutUse: z.boolean().optional()
  }).optional()
});

export const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  chatId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(2000),
  language: z.enum(Object.values(LANGUAGES)).optional().default('en'),
  useVoice: z.boolean().optional().default(false)
});

export const symptomAssessmentSchema = z.object({
  primaryConcern: z.string().min(2, 'Primary concern is required'),
  symptoms: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      category: z.string().optional(),
      severity: z.enum(['mild', 'moderate', 'severe']).optional().default('moderate')
    })
  ).min(1, 'Please select at least one symptom'),
  duration: z.enum(['less_than_24_hours', '1_to_3_days', '1_to_2_weeks', 'over_2_weeks', 'months']),
  painScore: z.number().min(0).max(10),
  painType: z.enum(['none', 'dull_ache', 'sharp_shooting', 'throbbing', 'sensitivity_hot_cold', 'pain_on_chewing']).optional().default('none'),
  location: z.enum(['upper_teeth', 'lower_teeth', 'gums', 'tongue_cheeks', 'jaw_tmj', 'entire_mouth', 'unspecified']).optional().default('unspecified'),
  language: z.enum(Object.values(LANGUAGES)).optional().default('en'),
  additionalNotes: z.string().max(1000).optional()
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Category name must be at least 2 characters').max(100, 'Category name cannot exceed 100 characters'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional().default('')
});

export const knowledgeDocumentSchema = z.object({
  title: z.string().min(3).max(200),
  category: z.string().min(2, 'Category is required').max(100),
  language: z.enum(Object.values(LANGUAGES)).optional().default('en'),
  summary: z.string().min(10).max(500),
  content: z.string().min(30),
  tags: z.array(z.string()).optional().default([]),
  symptomsAddressed: z.array(z.string()).optional().default([]),
  preventiveTips: z.array(z.string()).optional().default([]),
  warningSigns: z.array(z.string()).optional().default([]),
  whenToSeeDentist: z.string().optional(),
  sourceReference: z.object({
    organization: z.string().optional(),
    url: z.string().optional(),
    publishedYear: z.number().optional()
  }).optional(),
  isPublished: z.boolean().optional().default(true)
});

export const feedbackSchema = z.object({
  conversationId: z.string().optional(),
  assessmentId: z.string().optional(),
  rating: z.number().min(1).max(5),
  category: z.enum(['chat_accuracy', 'educational_value', 'ease_of_use', 'language_clarity', 'bug_report', 'general']).optional().default('general'),
  comment: z.string().max(1000).optional()
});
