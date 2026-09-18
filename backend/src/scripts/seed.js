import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { Conversation } from '../models/Conversation.js';
import { Assessment } from '../models/Assessment.js';
import { Feedback } from '../models/Feedback.js';
import { AnalyticsEvent } from '../models/AnalyticsEvent.js';
import { SEED_DENTAL_DOCUMENTS } from '../utils/seedData.js';
import { processAndIndexDocument } from '../services/ragService.js';
import { EMBEDDING_DIMENSION } from '../services/embeddingService.js';
import { ROLES, RISK_TIERS } from '../config/constants.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedDatabase = async () => {
  const isForceMode = process.argv.includes('--force') || process.argv.includes('--clean');

  try {
    console.log('🌱 Starting Resilient Database Seeding...');
    if (isForceMode) {
      console.log('⚠️ Running in FORCE mode: existing collections and embeddings will be replaced.');
    } else {
      console.log('✨ Running in IDEMPOTENT mode: documents with valid embeddings will be preserved without extra API calls.');
    }

    await connectDB();

    // 1. Seed Users (Upsert pattern to preserve valid IDs)
    console.log('👤 Ensuring default admin and demo users exist...');
    let adminUser = await User.findOne({ email: 'admin@dentalaware.org' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Dr. Neha Sharma (Admin)',
        email: 'admin@dentalaware.org',
        password: 'Admin@12345',
        role: ROLES.ADMIN,
        preferredLanguage: 'en',
        oralHealthProfile: {
          ageGroup: 'adult',
          brushingFrequencyPerDay: 2,
          flossingHabit: 'daily',
          lastDentalVisit: 'less_than_6_months'
        }
      });
      console.log(`✅ Created Admin: admin@dentalaware.org (Password: Admin@12345)`);
    } else {
      console.log(`👤 Found existing Admin: admin@dentalaware.org`);
    }

    let demoUser = await User.findOne({ email: 'user@dentalaware.org' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Aarav Patel (User)',
        email: 'user@dentalaware.org',
        password: 'User@12345',
        role: ROLES.USER,
        preferredLanguage: 'en',
        oralHealthProfile: {
          ageGroup: 'adult',
          brushingFrequencyPerDay: 2,
          flossingHabit: 'weekly',
          lastDentalVisit: '6_to_12_months'
        }
      });
      console.log(`✅ Created Demo User: user@dentalaware.org (Password: User@12345)`);
    } else {
      console.log(`👤 Found existing Demo User: user@dentalaware.org`);
    }

    // 2. Seed Knowledge Base Documents & RAG Vector Chunks
    console.log('📚 Seeding dental knowledge documents and checking vector chunks...');
    if (isForceMode) {
      await KnowledgeDocument.deleteMany({});
      try {
        await KnowledgeDocument.collection.dropIndexes();
      } catch {
        // Ignore if collection was empty
      }
    }
    await KnowledgeDocument.syncIndexes();

    let newlyIndexedCount = 0;
    let reusedCount = 0;
    const failedDocs = [];

    const totalDocs = SEED_DENTAL_DOCUMENTS.length;
    let docIndex = 0;

    for (const docData of SEED_DENTAL_DOCUMENTS) {
      docIndex++;
      const prefix = `  [${docIndex}/${totalDocs}]`;

      try {
        let existingDoc = await KnowledgeDocument.findOne({ slug: docData.slug });

        const hasValidEmbeddings =
          existingDoc &&
          Array.isArray(existingDoc.chunks) &&
          existingDoc.chunks.length > 0 &&
          existingDoc.chunks.every(
            (c) => Array.isArray(c.embedding) && c.embedding.length === EMBEDDING_DIMENSION
          );

        if (hasValidEmbeddings && !isForceMode) {
          // Update metadata/content fields if needed, while keeping existing chunks and embeddings
          Object.assign(existingDoc, {
            title: docData.title,
            category: docData.category,
            language: docData.language,
            summary: docData.summary,
            content: docData.content,
            tags: docData.tags,
            symptomsAddressed: docData.symptomsAddressed,
            preventiveTips: docData.preventiveTips,
            warningSigns: docData.warningSigns,
            whenToSeeDentist: docData.whenToSeeDentist,
            sourceReference: docData.sourceReference
          });
          await existingDoc.save();
          reusedCount++;
          console.log(`⏩ ${prefix} Reused (Already Indexed with ${existingDoc.chunks.length} valid embeddings): "${docData.title.substring(0, 45)}..."`);
          continue;
        }

        const doc = existingDoc || new KnowledgeDocument({
          ...docData,
          createdBy: adminUser._id
        });

        if (existingDoc) {
          Object.assign(doc, docData);
        }

        console.log(`📄 ${prefix} Indexing & generating embeddings for: "${docData.title.substring(0, 45)}..."`);
        await processAndIndexDocument(doc, { forceReindex: isForceMode });
        newlyIndexedCount++;
        console.log(`  ✅ ${prefix} Indexed: "${doc.title.substring(0, 45)}..." (${doc.chunks.length} chunks generated).`);

        // Pacing pause between documents to maintain steady API rate
        if (docIndex < totalDocs) {
          await sleep(1000);
        }
      } catch (err) {
        console.error(`  ❌ ${prefix} Failed to index document "${docData.title}":`, err.message);
        failedDocs.push({ title: docData.title, error: err.message });
      }
    }

    console.log(`\n📊 Knowledge Base Seeding Result:`);
    console.log(`   - Newly Indexed Documents: ${newlyIndexedCount}`);
    console.log(`   - Reused/Preserved Documents: ${reusedCount}`);
    if (failedDocs.length > 0) {
      console.warn(`   - ⚠️ Failed Documents (${failedDocs.length}):`, failedDocs.map(f => f.title).join(', '));
    }

    // 3. Seed Sample Assessments
    console.log('\n🩺 Seeding sample symptom assessments...');
    await Assessment.deleteMany({});

    await Assessment.create({
      userId: demoUser._id,
      language: 'en',
      primaryConcern: 'Cold Sensitivity in Lower Left Molars',
      symptoms: [
        { id: 'sensitivity_cold', label: 'Sharp pain with cold water', category: 'Sensitivity', severity: 'moderate' },
        { id: 'mild_gum_redness', label: 'Slight gum irritation', category: 'Gums', severity: 'mild' }
      ],
      duration: '1_to_2_weeks',
      painScore: 4,
      painType: 'sensitivity_hot_cold',
      location: 'lower_teeth',
      redFlagsTriggered: [],
      riskTier: RISK_TIERS.LOW,
      educationalSummary: 'Mild to moderate dentin hypersensitivity likely due to early enamel wear or slight gum recession.',
      possibleConditionsToDiscuss: [
        {
          name: 'Dentinal Hypersensitivity',
          description: 'Microscopic tubules exposed to thermal triggers.',
          educationalNote: 'Potassium nitrate desensitizing toothpaste is often recommended.'
        }
      ],
      preventiveSelfCareTips: [
        'Use soft-bristled brush with gentle circular strokes',
        'Avoid iced beverages or immediate brushing after citrus fruits'
      ],
      recommendedQuestionsForDentist: [
        'Is there any cavity or root exposure causing this cold sensitivity?',
        'Would in-office fluoride varnish help protect this area?'
      ],
      urgencyTimeline: 'routine_6_month',
      disclaimerAcknowledged: true
    });

    await Assessment.create({
      userId: demoUser._id,
      language: 'en',
      primaryConcern: 'Persistent Red Sore On Inner Cheek',
      symptoms: [
        { id: 'ulcer_inner_cheek', label: 'Non-healing sore on cheek', category: 'Mucosa', severity: 'severe' }
      ],
      duration: 'over_2_weeks',
      painScore: 7,
      painType: 'dull_ache',
      location: 'tongue_cheeks',
      redFlagsTriggered: [
        {
          code: 'non_healing_ulcer_over_2_weeks',
          description: 'Mouth ulcer lasting more than 14 days requires clinical examination and biopsy screening.',
          urgentActionRequired: true
        }
      ],
      riskTier: RISK_TIERS.HIGH,
      educationalSummary: 'High priority alert: Any oral ulcer lasting longer than 14 days must be examined in person by a dental specialist.',
      possibleConditionsToDiscuss: [
        {
          name: 'Chronic Traumatic Ulcer or Mucosal Lesion',
          description: 'Tissue abnormality requiring biopsy investigation to rule out dysplasia.',
          educationalNote: 'Clinical visualization and possible histopathology are standard protocol.'
        }
      ],
      preventiveSelfCareTips: [
        'Rinse gently with warm saline',
        'Do not apply acidic pastes or alcohol solutions directly to the wound'
      ],
      recommendedQuestionsForDentist: [
        'Is a biopsy or soft tissue screening necessary for this persistent lesion?',
        'Are sharp tooth margins or restorations traumatizing the cheek mucosa?'
      ],
      urgencyTimeline: 'schedule_within_24_48h',
      disclaimerAcknowledged: true
    });

    console.log(`✅ Seeded sample assessments.`);

    // 4. Seed Sample Conversations
    console.log('💬 Seeding sample conversations...');
    await Conversation.deleteMany({});

    const gumDoc = await KnowledgeDocument.findOne({ category: 'Gum Disease (Gingivitis & Periodontitis)' });

    await Conversation.create({
      userId: demoUser._id,
      title: 'Bleeding gums when brushing',
      primaryTopic: 'Gum Disease (Gingivitis & Periodontitis)',
      language: 'en',
      rating: 5,
      feedbackComment: 'Very helpful explanation of modified Bass technique and scaling.',
      messages: [
        {
          role: 'user',
          content: 'Why do my gums bleed whenever I brush in the morning?',
          language: 'en',
          timestamp: new Date(Date.now() - 3600000 * 24 * 3)
        },
        {
          role: 'assistant',
          content: `### 💡 Educational Overview
Bleeding gums during brushing is commonly the first sign of **Gingivitis**—an early, fully reversible stage of gum disease triggered by plaque biofilm accumulating at the gumline.

#### 🔍 Potential Related Conditions (For Discussion):
- **Plaque-Induced Gingivitis**: Irritation from bacterial toxins causing fragile capillaries.
- **Early Periodontitis**: If untreated, inflammation reaches the bone supporting the tooth.
- **Hard Brushing Technique**: Using medium/hard bristles with aggressive horizontal scrubbing.

#### ⚠️ Warning Signs to Watch:
- Spontaneous bleeding without brushing.
- Gums pulling away from teeth or loose teeth.
- Pus discharge between teeth.

#### 📋 Questions for Your Dentist:
- *"Do I have calculus (tartar) buildup that requires professional ultrasonic scaling?"*
- *"Can you show me the optimal 45-degree angle brushing technique for my gum health?"*

---
*⚠️ Educational Disclaimer: This platform is designed exclusively for oral health awareness and education. It does not provide medical diagnosis, treatment planning, or prescriptions. Always consult a qualified dental professional for personal medical evaluations.*`,
          language: 'en',
          warningLevel: 'none',
          disclaimerShown: true,
          sources: gumDoc
            ? [
                {
                  documentId: gumDoc._id,
                  title: gumDoc.title,
                  category: gumDoc.category,
                  sourceUrl: gumDoc.sourceReference?.url || 'https://www.efp.org/for-patients/',
                  organization: gumDoc.sourceReference?.organization || 'European Federation of Periodontology (EFP)',
                  relevanceScore: 0.92
                }
              ]
            : [],
          timestamp: new Date(Date.now() - 3600000 * 24 * 3 + 5000)
        }
      ]
    });

    // 5. Seed Sample Feedbacks
    console.log('⭐ Seeding sample feedback...');
    await Feedback.deleteMany({});

    await Feedback.create({
      userId: demoUser._id,
      rating: 5,
      category: 'educational_value',
      comment: 'Excellent awareness platform! Clear explanation of why antibiotics should not be taken without a dentist exam.',
      isReviewedByAdmin: true
    });

    await Feedback.create({
      userId: demoUser._id,
      rating: 5,
      category: 'language_clarity',
      comment: 'Hindi and Marathi guides are very clear and helpful for regional awareness.',
      isReviewedByAdmin: true
    });

    // 6. Seed Analytics Events
    console.log('📊 Seeding analytics events...');
    await AnalyticsEvent.deleteMany({});

    const eventTopics = [
      'Gum Disease (Gingivitis & Periodontitis)',
      'Tooth Decay & Cavities',
      'Sensitivity & Enamel Erosion',
      'Oral Cancer Awareness & Red Flags',
      'Pediatric Dental Hygiene',
      'Halitosis & Daily Hygiene'
    ];

    const languagesList = ['en', 'en', 'en', 'hi', 'hi', 'mr'];

    for (let i = 0; i < 25; i++) {
      const topic = eventTopics[i % eventTopics.length];
      const lang = languagesList[i % languagesList.length];
      const daysAgo = Math.floor(i / 4);
      const createdAt = new Date(Date.now() - daysAgo * 24 * 3600000);

      await AnalyticsEvent.create({
        eventType: i % 2 === 0 ? 'chat_message' : 'symptom_assessment',
        userId: demoUser._id,
        topic,
        language: lang,
        createdAt,
        metadata: {
          simulated: true,
          riskTier: i % 4 === 0 ? RISK_TIERS.HIGH : (i % 2 === 0 ? RISK_TIERS.MODERATE : RISK_TIERS.LOW)
        }
      });
    }

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`- 2 Users (Admin & User verified)`);
    console.log(`- ${totalDocs - failedDocs.length}/${totalDocs} Dental Knowledge Documents with Vector Chunks`);
    console.log(`- 2 Sample Assessments with Risk Tiers & Red Flags`);
    console.log(`- 1 Active Conversation with RAG Citations`);
    console.log(`- 2 User Feedback entries`);
    console.log(`- 25 Analytics Events`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Database Seeding Fatal Error:', error);
    process.exit(1);
  }
};

seedDatabase();
