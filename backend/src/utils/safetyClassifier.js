/**
 * DentiSense AI - Inquiry Intent & Safety Classifier
 * Categorizes dental inquiries into 10 structured categories to control RAG retrieval,
 * prompt conditioning, response length, and safety alerts.
 */

export const INQUIRY_CATEGORIES = {
  GENERAL_EDUCATION: 'general_education',
  SYMPTOM_EDUCATION: 'symptom_education',
  DIAGNOSIS_REQUEST: 'diagnosis_request',
  MEDICATION_REQUEST: 'medication_request',
  EMERGENCY_SYMPTOM: 'emergency_symptom',
  PROCEDURE_QUESTION: 'procedure_question',
  CHILD_DENTAL_HEALTH: 'child_dental_health',
  OUT_OF_SCOPE: 'out_of_scope',
  KNOWLEDGE_BASE_QUESTION: 'knowledge_base_question',
  FOLLOW_UP_QUESTION: 'follow_up_question'
};

// Patterns for medication, antibiotic, dosage, prescription requests
const MEDICATION_PATTERNS = [
  /\b(prescribe|prescription|prescriptions)\b/i,
  /\b(antibiotic|antibiotics|painkiller|painkillers|antimicrobial)\b/i,
  /\b(amoxicillin|metronidazole|ibuprofen|paracetamol|penicillin|augmentin|tylenol|advil|combiflam|ketorol)\b/i,
  /\b(dosage|dose|doses|how many mg|how much mg|\b\d+\s*mg\b)\b/i,
  /\b(tablet|tablets|pill|pills|capsule|capsules|injection|syrup)\b/i,
  /\b(friend['’]?s\s+(antibiotic|prescription|medicine|pill)|someone\s+else['’]?s\s+med)/i,
  /\b(leftover\s+(antibiotic|medication|pill))\b/i,
  /\b(दवा|एंटीबायोटिक|गोली|खुराक|औषध|गोळ्या)\b/i
];

// Patterns for diagnosis requests (asking AI to definitively diagnose)
const DIAGNOSIS_PATTERNS = [
  /\b(what\s+is\s+(the\s+)?(exact\s+)?(dental\s+)?diagnosis)\b/i,
  /\b(diagnose\s+(me|my|this|condition|tooth|mouth|teeth))\b/i,
  /\b(what\s+condition\s+do\s+i\s+have)\b/i,
  /\b(what\s+disease\s+do\s+i\s+have)\b/i,
  /\b(tell\s+me\s+(what|my)\s+diagnosis)\b/i,
  /\b(give\s+me\s+(a|the|my)\s+diagnosis)\b/i,
  /\b(based\s+only\s+on\s+this\s+message.*diagnos)/i,
  /\b(निदान|रोग निदान|काय आजार आहे)\b/i
];

// Patterns asking AI to guarantee, promise, confirm, or rule out conditions (especially cancer/tumors)
const GUARANTEE_RULEOUT_PATTERNS = [
  /\b(guarantee|promise|certify)\s+(that\s+)?(i\s+)?(do\s+not|don['’]?t|have|won['’]?t)\b/i,
  /\b(rule\s*out|confirm\s+(that\s+)?(i\s+)?(do\s+not|don['’]?t|have))\b/i,
  /\b(are\s+you\s+(sure|certain)\s+(that\s+)?(i\s+)?(don['’]?t|do\s+not|have))\b/i,
  /\bcan\s+you\s+(tell|say|guarantee|confirm|promise)\s+(that\s+)?(i\s+)?(don['’]?t|do\s+not|have)\b/i,
  /\b(do\s+i\s+have|could\s+this\s+be|could\s+i\s+have|is\s+it)\s+(oral\s+)?(cancer|tumou?r|carcinoma|malignan\w*)\b/i
];

const CANCER_KEYWORDS = [
  'cancer', 'tumor', 'tumour', 'carcinoma', 'malignancy', 'malignant',
  'कैंसर', 'कर्कट रोग', 'कर्करोग'
];

const EMERGENCY_PATTERNS = [
  /\b(difficulty\s+(breathing|to\s+breathe)|hard\s+to\s+breathe|choking|airway)\b/i,
  /\b(difficulty\s+(swallowing|to\s+swallow)|cannot\s+swallow|hard\s+to\s+swallow)\b/i,
  /\b((face|facial|cheek|jaw|eye)\s+(is\s+)?(swollen|swelling)|(swollen|swelling)\s+(face|cheek|jaw|eye|in\s+my\s+face)).*(fever|neck|throat|rapid|spreading|badly)\b/i,
  /\b(fever).*(swollen|swelling|infection|abscess)\b/i,
  /\b(knocked\s*out|avulsed|fell\s*out\s+completely).*(tooth|teeth)\b/i,
  /\b(uncontrolled\s+bleeding|bleeding\s+won['’]?t\s+stop|heavy\s+bleeding)\b/i,
  /\b(सांस लेने में (तकलीफ|कठिनाई)|चेहरे पर सूजन.*बुखार|गिळताना त्रास|श्वास घेण्यास त्रास)\b/i
];

// Patterns for questions specifically inquiring about the knowledge base or sources
const KNOWLEDGE_BASE_PATTERNS = [
  /\b(knowledge\s*base|in\s+your\s+knowledge\s*base|using\s+my\s+knowledge\s*base)\b/i,
  /\b(source\s+of\s+your\s+answer|what\s+is\s+the\s+source|cited\s+source|where\s+did\s+you\s+get\s+this)\b/i,
  /\b(not\s+in\s+(the|your)\s+knowledge\s*base|outside\s+(the|your)\s+knowledge\s*base)\b/i,
  /\b(citation|references\s+used|literature\s+source)\b/i
];

// Patterns for dental procedures & treatments
const PROCEDURE_PATTERNS = [
  /\b(root\s*canal|rct|extraction|tooth\s*removal|scaling|cleaning|filling|composite|implant|braces|aligners|crown|bridge|veneer|denture)\b/i,
  /\b(procedure|surgery|biopsy|how\s+is\s+.*(done|performed))\b/i
];

// Patterns for pediatric / child dental care
const CHILD_PATTERNS = [
  /\b(baby|infant|toddler|child|kid|children|milk\s*teeth|primary\s*teeth|teething|pediatric)\b/i,
  /\b(बच्चे|बाल|लहान मूल|दात येणे)\b/i
];

// Patterns for out of scope / unrelated topics
const OUT_OF_SCOPE_PATTERNS = [
  /\b(weather|stock\s*market|bitcoin|crypto|python|javascript|code|recipe|car\s*repair|movie|politics|flight\s*ticket)\b/i,
  /\b(who\s+won\s+the|sports\s*score|write\s+(a\s+)?program|solve\s+(a\s+)?math)\b/i
];

// Patterns for short follow-up prompts
const FOLLOW_UP_PATTERNS = [
  /^(tell\s+me\s+more|elaborate|explain\s+further|what\s+about\s+that|why\s+is\s+that|and\s+then\?|continue)$/i
];

/**
 * Classifies an incoming inquiry and determines retrieval & safety handling.
 * @param {string} text - User prompt message
 * @param {Array} history - Previous conversation messages
 * @returns {Object} classification result
 */
export const classifyUserInquiry = (text = '', history = []) => {
  const trimmed = text.trim();

  // 1. Emergency Check (Highest Clinical Priority)
  const isEmergency = EMERGENCY_PATTERNS.some(regex => regex.test(trimmed));
  if (isEmergency) {
    return {
      category: INQUIRY_CATEGORIES.EMERGENCY_SYMPTOM,
      isEmergency: true,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: false,
      preferredCategory: 'Emergency & Urgent Dental Care',
      safetyAlert: null
    };
  }

  // 2. Medication / Prescription Check (High Safety Priority)
  const isMedicationRequest = MEDICATION_PATTERNS.some(regex => regex.test(trimmed));
  if (isMedicationRequest) {
    return {
      category: INQUIRY_CATEGORIES.MEDICATION_REQUEST,
      isEmergency: false,
      isMedicationRequest: true,
      isDiagnosisRequest: false,
      skipRAG: true, // Do not retrieve unrelated disease/cancer documents for medication refusal
      preferredCategory: null,
      safetyAlert: 'Medication and dosage guidance requires a licensed healthcare professional.'
    };
  }

  // 3. Diagnosis & Guarantee / Rule-Out Check
  const isGuaranteeOrRuleOut = GUARANTEE_RULEOUT_PATTERNS.some(regex => regex.test(trimmed));
  const isDirectDiagnosis = DIAGNOSIS_PATTERNS.some(regex => regex.test(trimmed));
  const mentionsCancer = CANCER_KEYWORDS.some(kw => trimmed.toLowerCase().includes(kw));

  if (isGuaranteeOrRuleOut || isDirectDiagnosis) {
    const isCancerGuarantee = mentionsCancer;
    const hasDetailedSymptoms = /\b(pain|ache|hurts|swelling|bleeding|sensitive|ulcer|hole|broken|loose|sore|lump|patch)\b/i.test(trimmed);
    const hasPersistentLesion = /(persistent|over\s*(2|two)\s*weeks|longer\s*than\s*(2|two)\s*weeks|more\s*than\s*(2|two)\s*weeks|14\s*days|not\s*heal\w*|hasn['’]?t\s*healed|month)/i.test(trimmed);

    return {
      category: INQUIRY_CATEGORIES.DIAGNOSIS_REQUEST,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: true,
      isGuaranteeOrRuleOut,
      isCancerGuaranteeRequest: isCancerGuarantee,
      isGenericDiagnosis: !hasDetailedSymptoms,
      // For cancer guarantee inquiries without persistent lesions, skip RAG to prevent accidental oral-cancer document injection
      skipRAG: isCancerGuarantee ? !hasPersistentLesion : !hasDetailedSymptoms,
      preferredCategory: isCancerGuarantee && hasPersistentLesion ? 'Oral Cancer Awareness & Red Flags' : null,
      safetyAlert: null
    };
  }

  // 4. Knowledge Base & Source Meta-inquiry
  const isKBQuestion = KNOWLEDGE_BASE_PATTERNS.some(regex => regex.test(trimmed));
  if (isKBQuestion) {
    return {
      category: INQUIRY_CATEGORIES.KNOWLEDGE_BASE_QUESTION,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      isKnowledgeBaseQuestion: true,
      skipRAG: false,
      preferredCategory: null,
      safetyAlert: null
    };
  }

  // 5. Out of Scope Check
  const isOutOfScope = OUT_OF_SCOPE_PATTERNS.some(regex => regex.test(trimmed));
  if (isOutOfScope) {
    return {
      category: INQUIRY_CATEGORIES.OUT_OF_SCOPE,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: true,
      preferredCategory: null,
      safetyAlert: null
    };
  }

  // 6. Child / Pediatric Dental Health
  const isChild = CHILD_PATTERNS.some(regex => regex.test(trimmed));
  if (isChild) {
    return {
      category: INQUIRY_CATEGORIES.CHILD_DENTAL_HEALTH,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: false,
      preferredCategory: 'Pediatric Dental Care',
      safetyAlert: null
    };
  }

  // 7. Dental Procedure Question
  const isProcedure = PROCEDURE_PATTERNS.some(regex => regex.test(trimmed));
  if (isProcedure) {
    return {
      category: INQUIRY_CATEGORIES.PROCEDURE_QUESTION,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: false,
      preferredCategory: null,
      safetyAlert: null
    };
  }

  // 8. Follow-up Question Check
  const isFollowUp = FOLLOW_UP_PATTERNS.some(regex => regex.test(trimmed)) || (trimmed.length < 25 && history.length > 0);
  if (isFollowUp && history.length > 0) {
    return {
      category: INQUIRY_CATEGORIES.FOLLOW_UP_QUESTION,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: false,
      preferredCategory: null,
      safetyAlert: null
    };
  }

  // 9. Symptom Education Check (User describes a symptom like bleeding gums, sensitive teeth, ulcer)
  const isSymptom = /\b(bleed|bleeding|pain|ache|aching|hurts|swollen|swelling|ulcer|sore|sensitive|sensitivity|numb|loose)\b/i.test(trimmed);
  if (isSymptom) {
    return {
      category: INQUIRY_CATEGORIES.SYMPTOM_EDUCATION,
      isEmergency: false,
      isMedicationRequest: false,
      isDiagnosisRequest: false,
      skipRAG: false,
      preferredCategory: null,
      safetyAlert: null
    };
  }

  // 10. Default: General Dental Education
  return {
    category: INQUIRY_CATEGORIES.GENERAL_EDUCATION,
    isEmergency: false,
    isMedicationRequest: false,
    isDiagnosisRequest: false,
    skipRAG: false,
    preferredCategory: null,
    safetyAlert: null
  };
};
