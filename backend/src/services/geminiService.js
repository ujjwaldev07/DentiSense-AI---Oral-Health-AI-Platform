import { getGeminiClient, hasGeminiApiKey } from '../config/gemini.js';
import { ENV } from '../config/env.js';
import {
  getSystemSafetyPrompt,
  checkPrescriptionRequest,
  detectRedFlags,
  appendDisclaimer
} from '../utils/safetyGuardrails.js';
import { classifyUserInquiry } from '../utils/safetyClassifier.js';
import { parseStructuredResponse } from '../utils/responseParser.js';

/**
 * Predefined safe system messages when Gemini AI generation is unavailable.
 * Never outputs unsourced clinical condition lists or speculative diagnoses.
 */
const getServiceUnavailableResponse = (language = 'en', redFlags = [], isPrescription = false, classification = {}) => {
  const isHi = language === 'hi';
  const isMr = language === 'mr';

  // 1. Dedicated Oral Cancer Reassurance & Guarantee (80-130 words, calm, non-alarming, no biopsy)
  if (classification.isCancerGuaranteeRequest) {
    if (isHi) {
      return `मैं चैट के माध्यम से यह गारंटी नहीं दे सकता कि आपको मौखिक कैंसर (Oral Cancer) है या नहीं। एक योग्य दंत चिकित्सक या डॉक्टर को व्यक्तिगत जांच और आवश्यकता पड़ने पर आगे के परीक्षणों के माध्यम से आपके लक्षणों का मूल्यांकन करना चाहिए।

यदि आपको लगातार रहने वाला छाला, असामान्य गांठ, सफेद या लाल धब्बा, सुन्नता, रक्तस्राव या निगलने में कठिनाई है, तो पेशेवर परामर्श लें। इन लक्षणों के कई सामान्य कारण हो सकते हैं और इनका मतलब स्वतः कैंसर नहीं होता।

यदि आपको कोई लक्षण नहीं है, तो नियमित दंत जांच (Routine dental check-ups) आपके मौखिक स्वास्थ्य की निगरानी का एक उपयोगी तरीका है।

शैक्षणिक टीप: DentiSense AI केवल सामान्य मौखिक स्वास्थ्य जानकारी प्रदान करता है और चिकित्सीय स्थितियों का निदान नहीं कर सकता।`;
    }

    if (isMr) {
      return `मी चॅटद्वारे तुम्हाला तोंडाचा कर्करोग (Oral Cancer) आहे किंवा नाही याची खात्री देऊ शकत नाही. एका पात्र दंतवैद्याने प्रत्यक्ष तपासणी आणि आवश्यक असल्यास पुढील चाचण्यांद्वारे मूल्यांकन केले पाहिजे.

जर तुम्हाला तोंडात बरा न होणारा व्रण, असामान्य गाठ, पांढरा किंवा लाल चट्टा, बधीरपणा किंवा गिळताना त्रास होत असल्यास डॉक्टरांची भेट घ्या. या लक्षणांची अनेक कारणे असू शकतात आणि याचा अर्थ कर्करोगच असा होत नाही.

जर तुम्हाला कोणतीही लक्षणे नसतील, तर नियमित तपासणी हा तोंडाच्या आरोग्यावर लक्ष ठेवण्याचा चांगला मार्ग आहे.

शैक्षणिक टीप: DentiSense AI केवळ सामान्य माहिती प्रदान करते आणि वैद्यकीय निदान करू शकत नाही.`;
    }

    return `I can’t guarantee that you do or do not have oral cancer through chat. A qualified dentist or doctor must evaluate your symptoms through an in-person examination and, if necessary, further testing.

If you have a persistent mouth sore, unusual lump, unexplained white or red patch, numbness, bleeding, or difficulty swallowing, arrange a professional appointment. These symptoms can have several causes and do not automatically mean cancer.

If you have no concerning symptoms, routine dental check-ups are a useful way to monitor your oral health.

Educational note: DentiSense AI provides general oral-health information and cannot diagnose medical conditions.`;
  }

  // 2. Mandatory Safety Intercept: Prescription Refusal (Concise, single-layer response)
  if (isPrescription) {
    if (isHi) {
      return `मैं एक शैक्षणिक एआई सहायक हूँ और किसी भी प्रकार की दवा, एंटीबायोटिक या खुराक निर्धारित नहीं कर सकता।

दंत संक्रमण के लिए व्यक्तिगत क्लिनिकल जांच आवश्यक है क्योंकि सही उपचार कारण, गंभीरता, एलर्जी और स्वास्थ्य इतिहास पर निर्भर करता है।

कृपया तुरंत किसी योग्य दंत चिकित्सक (Dentist) से संपर्क करें। किसी अन्य की दवा या बची हुई एंटीबायोटिक्स का उपयोग कभी न करें।

यदि आपको चेहरे या गर्दन पर सूजन, सांस लेने या निगलने में कठिनाई, या तेजी से बढ़ते लक्षण हों, तो तुरंत आपातकालीन चिकित्सा सहायता लें।`;
    }

    if (isMr) {
      return `मी एक शैक्षणिक एआय सहाय्यक आहे आणि कोणतेही औषध, अँटिबायोटिक किंवा डोस देऊ शकत नाही.

दंत संसर्गासाठी प्रत्यक्ष क्लिनिकल तपासणी आवश्यक असते कारण योग्य उपचार संसर्गाचे कारण, तीव्रता, ऍलर्जी आणि वैद्यकीय इतिहासावर अवलंबून असतात.

कृपया ताबडतोब पात्र दंतवैद्यांचा सल्ला घ्या. कोणाचेही जुने किंवा इतरांचे अँटिबायोटिक्स कधीही घेऊ नका.

चेहऱ्यावर किंवा मानेवर सूज, श्वास घेण्यास अथवा गिळण्यास त्रास झाल्यास त्वरित आपत्कालीन वैद्यकीय मदत घ्या.`;
    }

    return `I can't provide an antibiotic prescription or dosage. Dental infections need an examination because the correct treatment depends on the cause, severity, allergies, medical history, and whether drainage or dental treatment is needed.

Contact a dentist promptly. Do not use leftover antibiotics or someone else's prescription.

Seek emergency care immediately if you have facial or neck swelling, difficulty breathing or swallowing, uncontrolled bleeding, or rapidly worsening symptoms.`;
  }

  // 2. Mandatory Safety Intercept: Emergency Red Flags
  if (redFlags.length > 0) {
    if (isHi) {
      return `### 🚨 आवश्यक चेतावनी: आपातकालीन दंत परामर्श की सलाह!
आपके द्वारा बताए गए लक्षणों में चेतावनी संकेत (**Red Flag Warnings**) पाए गए हैं:
${redFlags.map(rf => `- **${rf.description}**`).join('\n')}

चेहरे पर तेजी से बढ़ती सूजन, सांस लेने में कठिनाई, या 14 दिनों से अधिक पुराना न भरने वाला छाला गंभीर स्थिति का संकेत हो सकते हैं। कृपया बिना देर किए नजदीकी अस्पताल या आपातकालीन दंत क्लिनिक में संपर्क करें।`;
    }

    if (isMr) {
      return `### 🚨 गंभीर इशारा: तातडीने दंतवैद्यांचा सल्ला घ्या!
तुमच्या लक्षणांमध्ये धोक्याचे संकेत आढळले आहेत:
${redFlags.map(rf => `- **${rf.description}**`).join('\n')}

जबड्यावर पसरलेली सूज, गिळताना त्रास किंवा २ आठवड्यांपेक्षा जुना अल्सर ही तातडीने क्लिनिकल तपासणीची लक्षणे आहेत. कृपया वेळ न घालवता त्वरित जवळच्या दंतवैद्यांशी संपर्क साधा.`;
    }

    return `### 🚨 Urgent Attention Recommended: Warning Signs Detected!
Your inquiry contains potential red-flag symptoms:
${redFlags.map(rf => `- **${rf.description}**`).join('\n')}

Rapid facial swelling, difficulty swallowing/breathing, or mouth ulcers lasting longer than 14 days require urgent clinical evaluation by a dentist or oral surgeon. Please seek in-person professional dental emergency care without delay.`;
  }

  // 3. Safe, Transparent Service Unavailable Message (No unsourced clinical speculation)
  if (isHi) {
    return `### ⚠️ सेवा अस्थायी रूप से अनुपलब्ध (Service Notice)
क्षमा करें, एआई दंत सहायक सेवा वर्तमान में तकनीकी समस्या या कनेक्शन अनुपलब्धता के कारण उत्तर उत्पन्न करने में असमर्थ है।

किसी भी प्रकार की गलत जानकारी से बचने के लिए, सिस्टम बिना प्रमाणित एआई सत्यापन के उत्तर प्रस्तुत नहीं करता है।
- कृपया कुछ समय बाद पुनः प्रयास करें।
- यदि आपको दांत में दर्द, सूजन या कोई मौखिक समस्या है, तो कृपया व्यक्तिगत जांच के लिए किसी योग्य दंत चिकित्सक (Dentist) से संपर्क करें।`;
  }

  if (isMr) {
    return `### ⚠️ सेवा तात्पुरती अनुपलब्ध (Service Notice)
क्षमस्व, तांत्रिक अडचण किंवा कनेक्शन समस्येमुळे एआय दंत सहाय्यक सध्या प्रतिसाद देऊ शकत नाही.

चुकीची माहिती टाळण्यासाठी, आमची प्रणाली असत्यापित वैद्यकीय माहिती तयार करत नाही.
- कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.
- दातांच्या दुखण्यावर किंवा उपचारांसाठी कृपया थेट पात्र दंतवैद्यांचा सल्ला घ्या.`;
  }

  return `### ⚠️ AI Service Temporarily Unavailable
The AI dental consultation assistant is currently unable to process your request due to a temporary service interruption or connection issue.

To ensure patient safety and avoid generating unsourced medical information, the platform does not produce unverified responses when the AI model is offline.

- **What you can do**: Please try submitting your inquiry again in a few moments.
- **For immediate concerns**: If you are experiencing persistent tooth pain, bleeding, or other dental symptoms, please consult a qualified dental professional for an in-person clinical examination.`;
};

const withTimeout = (promise, timeoutMs = 25000, errorMsg = 'AI generation request timed out after 25s') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs))
  ]);
};

export const getCandidateModels = () => {
  return [
    ENV.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    'gemini-3.5-flash-lite'
  ].filter((m, i, arr) => m && arr.indexOf(m) === i);
};

/**
 * Generate standard single-call AI response with structured breakdown and citations.
 */
export const generateDentalAIResponse = async (userPrompt, options = {}) => {
  const {
    language = 'en',
    retrievedContext = '',
    sources = [],
    isLowConfidence = false,
    classification: providedClassification
  } = options;

  const startTime = Date.now();
  const classification = providedClassification || classifyUserInquiry(userPrompt);
  const isPrescription = classification.isMedicationRequest || checkPrescriptionRequest(userPrompt);
  const redFlags = detectRedFlags(userPrompt);
  const isEmergency = redFlags.length > 0 || classification.category === 'emergency_symptom';
  const warningLevel = isEmergency ? 'urgent_medical_attention' : 'none';
  const safetyAlert = isPrescription
    ? 'Medication and dosage guidance requires a licensed healthcare professional.'
    : null;

  let lastAiError = null;
  const client = getGeminiClient();

  if (client && hasGeminiApiKey()) {
    const candidateModels = getCandidateModels();
    for (const modelToTry of candidateModels) {
      try {
        console.log(`[AI] Provider request started with model: ${modelToTry} | Category: ${classification.category} | Prompt: "${userPrompt.substring(0, 45)}..."`);
        const systemInstruction = getSystemSafetyPrompt(language, retrievedContext, isLowConfidence, classification);

        const userContent = `<user_inquiry>
${userPrompt}
</user_inquiry>
Language: ${language}
Category: ${classification.category}
${classification.isCancerGuaranteeRequest ? 'NOTE: The user is asking for a guarantee/confirmation regarding oral cancer. Adhere strictly to the ORAL CANCER REASSURANCE & GUARANTEE protocol (80-130 words, no biopsy, no cancer implication, calm reassurance, routine check-ups).' : ''}
${isPrescription ? 'NOTE: The user is asking for medication/prescription. Strictly refuse prescription without drug dosages.' : ''}
${isEmergency ? `NOTE: The user exhibits acute red flags: ${JSON.stringify(redFlags)}. Emphasize urgent clinical emergency evaluation.` : ''}`;

        const response = await withTimeout(
          client.models.generateContent({
            model: modelToTry,
            contents: userContent,
            config: {
              systemInstruction
            }
          }),
          20000,
          `Gemini API timed out after 20 seconds for model ${modelToTry}`
        );

        let responseText = response.text || '';
        responseText = appendDisclaimer(responseText, language, classification.category, classification);

        const latency = Date.now() - startTime;
        console.log(`[AI] Response received from ${modelToTry} in ${latency}ms`);

        const structured = parseStructuredResponse(responseText, {
          sources,
          warningLevel,
          language,
          redFlags
        });

        return {
          content: responseText,
          structured,
          sources,
          category: classification.category,
          safetyAlert,
          warningLevel,
          redFlags,
          isPrescriptionRefused: isPrescription,
          showDisclaimer: !isPrescription && !isEmergency,
          modelUsed: modelToTry,
          latencyMs: latency,
          isAiFailure: false
        };
      } catch (apiError) {
        console.warn(`⚠️ [AI WARN] Candidate model ${modelToTry} failed: ${apiError.message}. Trying next candidate model if available...`);
        lastAiError = apiError.message;
      }
    }
  } else {
    lastAiError = 'GEMINI_API_KEY is not configured or client is offline';
    console.warn(`⚠️ [AI WARN] ${lastAiError}`);
  }

  // Transparent safe fallback (No unsourced clinical generation)
  const rawFallback = getServiceUnavailableResponse(language, redFlags, isPrescription, classification);
  const content = appendDisclaimer(rawFallback, language, classification.category, classification);
  const structured = parseStructuredResponse(content, {
    sources: [],
    warningLevel,
    language,
    redFlags
  });

  return {
    content,
    structured,
    sources: [],
    category: classification.category,
    safetyAlert,
    warningLevel,
    redFlags,
    isPrescriptionRefused: isPrescription,
    showDisclaimer: !isPrescription && !isEmergency,
    modelUsed: 'System Safety Fallback Engine (Service Unavailable Notice)',
    latencyMs: Date.now() - startTime,
    isAiFailure: true,
    aiError: lastAiError
  };
};

/**
 * Async generator for streaming AI responses token-by-token.
 */
export async function* generateDentalAIStream(userPrompt, options = {}) {
  const {
    language = 'en',
    retrievedContext = '',
    sources = [],
    isLowConfidence = false,
    classification: providedClassification
  } = options;

  const classification = providedClassification || classifyUserInquiry(userPrompt);
  const isPrescription = classification.isMedicationRequest || checkPrescriptionRequest(userPrompt);
  const redFlags = detectRedFlags(userPrompt);
  const isEmergency = redFlags.length > 0 || classification.category === 'emergency_symptom';
  const warningLevel = isEmergency ? 'urgent_medical_attention' : 'none';
  const safetyAlert = isPrescription
    ? 'Medication and dosage guidance requires a licensed healthcare professional.'
    : null;

  const client = getGeminiClient();

  if (!client || !hasGeminiApiKey()) {
    const fallback = appendDisclaimer(getServiceUnavailableResponse(language, redFlags, isPrescription), language, classification.category);
    yield { type: 'token', token: fallback };
    yield {
      type: 'done',
      fullText: fallback,
      structured: parseStructuredResponse(fallback, { sources: [], warningLevel, language }),
      sources: [],
      category: classification.category,
      safetyAlert,
      warningLevel,
      redFlags,
      isPrescriptionRefused: isPrescription,
      showDisclaimer: !isPrescription && !isEmergency,
      isAiFailure: true
    };
    return;
  }

  const candidateModels = getCandidateModels();
  let streamSucceeded = false;
  let lastStreamError = null;

  for (const modelToTry of candidateModels) {
    let yieldedAnyChunk = false;
    try {
      console.log(`[AI] Streaming provider request started with model: ${modelToTry} | Category: ${classification.category} | Prompt: "${userPrompt.substring(0, 45)}..."`);
      const systemInstruction = getSystemSafetyPrompt(language, retrievedContext, isLowConfidence, classification);

      const userContent = `<user_inquiry>
${userPrompt}
</user_inquiry>
Language: ${language}
Category: ${classification.category}
${classification.isCancerGuaranteeRequest ? 'NOTE: The user is asking for a guarantee/confirmation regarding oral cancer. Adhere strictly to the ORAL CANCER REASSURANCE & GUARANTEE protocol (80-130 words, no biopsy, no cancer implication, calm reassurance, routine check-ups).' : ''}
${isPrescription ? 'NOTE: The user is asking for medication/prescription. Strictly refuse prescription without drug dosages.' : ''}
${isEmergency ? `NOTE: The user exhibits acute red flags: ${JSON.stringify(redFlags)}. Emphasize urgent clinical emergency evaluation.` : ''}`;

      const responseStream = await client.models.generateContentStream({
        model: modelToTry,
        contents: userContent,
        config: {
          systemInstruction
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const textChunk = chunk.text || '';
        if (textChunk) {
          yieldedAnyChunk = true;
          fullText += textChunk;
          yield { type: 'token', token: textChunk };
        }
      }

      fullText = appendDisclaimer(fullText, language, classification.category, classification);
      const structured = parseStructuredResponse(fullText, {
        sources,
        warningLevel,
        language,
        redFlags
      });

      console.log(`[AI] Stream generation completed with ${modelToTry} (${fullText.length} characters)`);

      yield {
        type: 'done',
        fullText,
        structured,
        sources,
        category: classification.category,
        safetyAlert,
        warningLevel,
        redFlags,
        isPrescriptionRefused: isPrescription,
        showDisclaimer: !isPrescription && !isEmergency,
        modelUsed: modelToTry,
        isAiFailure: false
      };
      streamSucceeded = true;
      break;
    } catch (err) {
      console.warn(`⚠️ [AI WARN] Stream with ${modelToTry} failed: ${err.message}.`);
      lastStreamError = err.message;
      // If tokens were already sent to client, do not restart from beginning with another model
      if (yieldedAnyChunk) {
        break;
      }
    }
  }

  if (!streamSucceeded) {
    console.error('❌ [AI ERROR] All streaming candidate models failed:', lastStreamError);
    const fallback = appendDisclaimer(getServiceUnavailableResponse(language, redFlags, isPrescription, classification), language, classification.category, classification);
    yield { type: 'token', token: `\n\n${fallback}` };
    yield {
      type: 'done',
      fullText: fallback,
      structured: parseStructuredResponse(fallback, { sources: [], warningLevel, language }),
      sources: [],
      category: classification.category,
      safetyAlert,
      warningLevel,
      redFlags,
      isPrescriptionRefused: isPrescription,
      showDisclaimer: !isPrescription && !isEmergency,
      isAiFailure: true,
      aiError: lastStreamError
    };
  }
}
