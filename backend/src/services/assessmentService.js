import { RISK_TIERS } from '../config/constants.js';
import { retrieveRelevantDentalKnowledge } from './ragService.js';

export const evaluateSymptomAssessment = (data) => {
  const {
    primaryConcern,
    symptoms = [],
    duration,
    painScore = 0,
    painType = 'none',
    location = 'unspecified',
    language = 'en'
  } = data;

  const redFlagsTriggered = [];
  let riskScore = 0;

  // Pain scoring
  if (painScore >= 8) {
    riskScore += 40;
  } else if (painScore >= 5) {
    riskScore += 25;
  } else if (painScore >= 2) {
    riskScore += 10;
  }

  // Duration scoring & Red flag evaluation
  if (duration === 'over_2_weeks' || duration === 'months') {
    riskScore += 25;
  } else if (duration === '1_to_2_weeks') {
    riskScore += 15;
  } else if (duration === '1_to_3_days') {
    riskScore += 10;
  }

  // Symptom specific scoring & Red Flag detection
  const symptomIds = symptoms.map(s => (typeof s === 'string' ? s : s.id || s.label || '').toLowerCase());

  // 1. Non-healing ulcer > 2 weeks
  const hasUlcer = symptomIds.some(s => s.includes('ulcer') || s.includes('sore') || s.includes('patch') || s.includes('छाला') || s.includes('अल्सर'));
  if (hasUlcer && (duration === 'over_2_weeks' || duration === 'months')) {
    redFlagsTriggered.push({
      code: 'non_healing_ulcer_over_2_weeks',
      description: 'Mouth ulcer or sore present for more than 14 days requires clinical evaluation and biopsy screening to rule out mucosal abnormalities.',
      urgentActionRequired: true
    });
    riskScore += 50;
  }

  // 2. Severe swelling
  const hasSwelling = symptomIds.some(s => s.includes('swell') || s.includes('facial') || s.includes('सूजन') || s.includes('सुजलेला'));
  if (hasSwelling) {
    riskScore += 30;
    if (painScore >= 6 || duration === '1_to_3_days') {
      redFlagsTriggered.push({
        code: 'acute_facial_swelling',
        description: 'Facial or jaw swelling with pain suggests active odontogenic infection or abscess requiring prompt clinical intervention.',
        urgentActionRequired: true
      });
    }
  }

  // 3. Dental trauma / Avulsion
  const hasTrauma = symptomIds.some(s => s.includes('knock') || s.includes('trauma') || s.includes('avulsion') || s.includes('broken') || s.includes('टूट') || s.includes('पडला'));
  if (hasTrauma) {
    redFlagsTriggered.push({
      code: 'dental_trauma_avulsion',
      description: 'Knocked-out or fractured teeth require immediate emergency dental care within 30-60 minutes.',
      urgentActionRequired: true
    });
    riskScore += 60;
  }

  const hasLooseTeeth = symptomIds.some(s => s.includes('loose') || s.includes('mobility') || s.includes('हिलना') || s.includes('हालणे'));
  if (hasLooseTeeth) {
    riskScore += 25;
  }

  const hasBleeding = symptomIds.some(s => s.includes('bleed') || s.includes('रक्त') || s.includes('खून'));
  if (hasBleeding) {
    riskScore += 15;
  }

  // Determine Risk Tier
  let riskTier = RISK_TIERS.LOW;
  let urgencyTimeline = 'routine_6_month';

  if (redFlagsTriggered.length > 0 || riskScore >= 60) {
    riskTier = RISK_TIERS.HIGH;
    urgencyTimeline = redFlagsTriggered.some(r => r.code === 'dental_trauma_avulsion' || r.code === 'acute_facial_swelling')
      ? 'immediate_emergency_visit'
      : 'schedule_within_24_48h';
  } else if (riskScore >= 25) {
    riskTier = RISK_TIERS.MODERATE;
    urgencyTimeline = 'schedule_within_week';
  }

  // Educational Conditions to Discuss (Non-Diagnostic Wording)
  const possibleConditionsToDiscuss = [];
  if (hasUlcer) {
    possibleConditionsToDiscuss.push({
      name: 'Aphthous Ulcer / Oral Mucosal Lesion',
      description: 'These symptoms can be associated with localized mucosal irritation, mechanical trauma, or aphthous stomatitis.',
      educationalNote: 'Soothing warm water rinses help mild ulcers, but sores persisting over 14 days require in-person dental screening.'
    });
  }
  if (hasSwelling || painScore >= 6) {
    possibleConditionsToDiscuss.push({
      name: 'Periapical Abscess / Pulpitis',
      description: 'These symptoms can be associated with deep bacterial penetration into the tooth pulp chamber.',
      educationalNote: 'A dental radiograph (X-ray) is required to inspect root canal involvement.'
    });
  }
  if (hasBleeding || hasLooseTeeth) {
    possibleConditionsToDiscuss.push({
      name: 'Gingivitis or Chronic Periodontitis',
      description: 'These symptoms can be associated with microbial plaque accumulation along the gingival margin.',
      educationalNote: 'Professional scaling and root planing are standard clinical treatments.'
    });
  }
  if (possibleConditionsToDiscuss.length === 0) {
    possibleConditionsToDiscuss.push({
      name: 'Enamel Demineralization / Dentin Sensitivity',
      description: 'These symptoms can be associated with exposed microscopic dentinal tubules reacting to thermal triggers.',
      educationalNote: 'Fluoride remineralization toothpaste and soft-bristled brushing help soothe sensitivity.'
    });
  }

  // Self-care tips
  const preventiveSelfCareTips = [
    'Rinse with warm salt water (1/2 tsp in a cup of lukewarm water) 3 times daily to soothe irritated tissues.',
    'Use a soft-bristled toothbrush with gentle circular strokes; avoid harsh horizontal scrubbing.',
    'Avoid extreme hot, cold, or sugary foods to prevent aggravating nerve sensitivity.',
    'Maintain daily interdental cleaning using dental floss or interdental brushes.'
  ];

  // Recommended questions for dentist
  const recommendedQuestionsForDentist = [
    'What is the underlying cause of my symptom based on your physical examination and radiographs?',
    'Do you recommend taking a periapical or bitewing X-ray to inspect the tooth roots and bone level?',
    'What preventive or restorative treatment options do you recommend for my teeth?'
  ];

  if (redFlagsTriggered.length > 0) {
    recommendedQuestionsForDentist.unshift('Is there an active infection or lesion that requires urgent intervention or specialist referral?');
  }

  // Educational summary text using strictly non-diagnostic language
  const educationalSummary = `Based on your reported concern (${primaryConcern}), duration (${duration.replace(/_/g, ' ')}), and pain severity (${painScore}/10), these symptoms can be associated with a ${riskTier}. This tool is strictly educational and does not constitute a medical diagnosis. Please consult a dentist for clinical examination.`;

  return {
    riskTier,
    urgencyTimeline,
    redFlagsTriggered,
    possibleConditionsToDiscuss,
    preventiveSelfCareTips,
    recommendedQuestionsForDentist,
    educationalSummary
  };
};
