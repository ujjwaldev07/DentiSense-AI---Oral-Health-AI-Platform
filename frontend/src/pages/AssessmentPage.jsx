import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Sparkles,
  Sliders
} from 'lucide-react';
import { ReportView } from '../components/assessment/ReportView.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { assessmentAPI } from '../api/endpoints.js';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Button } from '../components/forms/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';

export const AssessmentPage = ({ initialAssessmentId, setActivePage, setInitialPrompt }) => {
  const { language, t } = useLanguage();
  const { isAuthenticated, loginDemo } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Form State
  const [primaryConcern, setPrimaryConcern] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [duration, setDuration] = useState('1_to_3_days');
  const [painScore, setPainScore] = useState(3);
  const [painType, setPainType] = useState('sensitivity_hot_cold');
  const [location, setLocation] = useState('lower_teeth');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Load existing assessment if ID passed
  useEffect(() => {
    const fetchExisting = async () => {
      if (initialAssessmentId && isAuthenticated) {
        setLoading(true);
        try {
          const res = await assessmentAPI.getAssessmentById(initialAssessmentId);
          setAssessmentResult(res.data);
          setStep(5);
        } catch (err) {
          console.warn('Error fetching assessment:', err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchExisting();
  }, [initialAssessmentId, isAuthenticated]);

  const commonConcerns = [
    'Bleeding gums when brushing',
    'Sharp tooth pain when eating sweets/cold',
    'Persistent dull ache in lower jaw',
    'Swollen gum or pimple near tooth',
    'White or red sore lasting > 10 days',
    'Chipped tooth from chewing'
  ];

  const symptomOptions = [
    { id: 'sensitivity_cold_hot', label: 'Sensitivity to Hot or Cold Items', category: 'Sensitivity', icon: '❄️' },
    { id: 'bleeding_gums_brushing', label: 'Bleeding Gums When Brushing', category: 'Gums', icon: '🩸' },
    { id: 'non_healing_ulcer', label: 'Mouth Ulcer / Sore Lasting > 2 Weeks', category: 'Mucosa', icon: '⚠️' },
    { id: 'visible_dark_cavity', label: 'Visible Dark Pit / Food Catching Cavity', category: 'Caries', icon: '🦷' },
    { id: 'facial_jaw_swelling', label: 'Facial Swelling / Puffy Gum Near Tooth', category: 'Infection', icon: '🚨' },
    { id: 'pain_on_chewing', label: 'Sharp Pain When Biting / Chewing', category: 'Caries', icon: '⚡' },
    { id: 'wisdom_tooth_pain', label: 'Back Jaw Pain / Wisdom Tooth Flap Swollen', category: 'Third Molar', icon: '📍' },
    { id: 'loose_shifting_teeth', label: 'Loose or Shifting Teeth', category: 'Periodontitis', icon: '🦴' },
    { id: 'bad_breath_halitosis', label: 'Persistent Bad Breath / Foul Taste', category: 'Hygiene', icon: '🫧' },
    { id: 'trauma_knocked_tooth', label: 'Chipped / Fractured / Knocked-Out Tooth', category: 'Trauma', icon: '💥' }
  ];

  const handleToggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) => {
      const exists = prev.some((s) => s.id === symptom.id);
      if (exists) {
        return prev.filter((s) => s.id !== symptom.id);
      }
      return [...prev, symptom];
    });
  };

  const handleNext = () => {
    if (step === 1 && !primaryConcern.trim()) {
      toast.warning('Please enter or select your primary oral concern.');
      return;
    }
    if (step === 2 && selectedSymptoms.length === 0) {
      toast.warning('Please select at least one symptom to evaluate.');
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitAssessment = async () => {
    if (!isAuthenticated) {
      try {
        await loginDemo('user');
      } catch {
        // Continue
      }
    }

    setLoading(true);
    try {
      const payload = {
        primaryConcern,
        symptoms: selectedSymptoms,
        duration,
        painScore,
        painType,
        location,
        language,
        additionalNotes
      };

      const res = await assessmentAPI.submitAssessment(payload);
      setAssessmentResult(res.data);
      toast.success('Assessment evaluated successfully');
      setStep(5);
    } catch (err) {
      console.error('Assessment submit error:', err);
      toast.error('Unable to evaluate assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setPrimaryConcern('');
    setSelectedSymptoms([]);
    setDuration('1_to_3_days');
    setPainScore(3);
    setPainType('sensitivity_hot_cold');
    setLocation('lower_teeth');
    setAdditionalNotes('');
    setAssessmentResult(null);
    setStep(1);
  };

  const handleAskAI = (concern) => {
    if (setInitialPrompt) setInitialPrompt(`I completed a dental assessment for "${concern}". What preventive measures, root causes, and questions should I bring to my dentist?`);
    setActivePage('chat');
  };

  const stepsList = [
    { num: 1, label: 'Primary Concern' },
    { num: 2, label: 'Symptoms' },
    { num: 3, label: 'Pain & Timeline' },
    { num: 4, label: 'Review' },
    { num: 5, label: 'Report' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <Badge variant="cyan" size="md">
          <Activity className="w-3.5 h-3.5" />
          <span>Clinical Educational Triage</span>
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t('assessment.title') || 'Oral Symptom Risk Assessment'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          {t('assessment.subtitle') || 'Answer structured questions to understand symptom urgency, potential causes, and prepare for your dental visit.'}
        </p>
      </div>

      {/* Wizard Step Progress Bar */}
      <div className="glass-elevated rounded-2xl p-4 border border-slate-200/80 dark:border-white/[0.08]">
        <div className="flex items-center justify-between relative">
          {/* Progress Connecting Line */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                    isCompleted
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-teal-600 to-cyan-500 text-white ring-4 ring-teal-500/20 shadow-md shadow-teal-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold hidden sm:block ${
                    isCurrent
                      ? 'text-teal-700 dark:text-teal-300'
                      : isCompleted
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Primary Concern */}
      {step === 1 && (
        <GlassCard level={2} className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              What is your primary oral health concern today?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a common issue below or describe your concern in your own words.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Quick Selection:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {commonConcerns.map((concern, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrimaryConcern(concern)}
                  className={`p-3 rounded-2xl text-left text-xs font-semibold transition-all border ${
                    primaryConcern === concern
                      ? 'bg-teal-500/15 border-teal-500/50 text-teal-900 dark:text-teal-200 shadow-xs'
                      : 'glass-subtle border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-teal-500/30'
                  }`}
                >
                  <span>👉 {concern}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label htmlFor="primary-concern-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Or Describe Custom Concern:
            </label>
            <textarea
              id="primary-concern-input"
              value={primaryConcern}
              onChange={(e) => setPrimaryConcern(e.target.value)}
              rows={3}
              placeholder="e.g. Sharp pain when drinking cold liquids on upper right back tooth..."
              className="w-full p-3.5 rounded-2xl glass-subtle border border-slate-200/90 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <Button
              onClick={handleNext}
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              disabled={!primaryConcern.trim()}
            >
              Continue to Symptoms
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Symptoms Grid */}
      {step === 2 && (
        <GlassCard level={2} className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Select all symptoms that apply
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multiple selections help our clinical knowledge system identify co-occurring factors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symptomOptions.map((symptom) => {
              const isSelected = selectedSymptoms.some((s) => s.id === symptom.id);
              return (
                <div
                  key={symptom.id}
                  onClick={() => handleToggleSymptom(symptom)}
                  className={`p-4 rounded-2xl cursor-pointer border transition-all flex items-start gap-3 select-none ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/60 shadow-xs'
                      : 'glass-subtle border-slate-200/80 dark:border-white/[0.08] hover:border-teal-500/30'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{symptom.icon}</span>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">
                        {symptom.category}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                    <p className="text-xs sm:text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                      {symptom.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <Button onClick={handleBack} variant="secondary" size="md" icon={ArrowLeft}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="primary"
              size="md"
              icon={ArrowRight}
              iconPosition="right"
              disabled={selectedSymptoms.length === 0}
            >
              Continue to Pain & Timeline ({selectedSymptoms.length})
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 3: Pain & Timeline Assessment */}
      {step === 3 && (
        <GlassCard level={2} className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Pain Severity, Character & Duration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clinical details that help determine risk urgency and appropriate guidance.
            </p>
          </div>

          {/* Pain Score Slider */}
          <div className="space-y-3 p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label htmlFor="pain-score-slider" className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Pain / Discomfort Intensity (0 to 10):</span>
              </label>
              <span className={`text-base font-black px-3 py-0.5 rounded-full ${
                painScore >= 7 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' :
                painScore >= 4 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}>
                {painScore} / 10
              </span>
            </div>

            <input
              id="pain-score-slider"
              type="range"
              min="0"
              max="10"
              value={painScore}
              onChange={(e) => setPainScore(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-1">
              <span>0 (None)</span>
              <span>3 (Mild)</span>
              <span>5 (Moderate)</span>
              <span>8 (Severe)</span>
              <span>10 (Unbearable)</span>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>How long have you noticed these symptoms?</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'less_than_24h', label: 'Under 24 Hours' },
                { id: '1_to_3_days', label: '1 to 3 Days' },
                { id: '1_to_2_weeks', label: '1 to 2 Weeks' },
                { id: 'more_than_2_weeks', label: 'Over 2 Weeks' }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDuration(d.id)}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                    duration === d.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'glass-subtle border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-teal-500/40'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>General Mouth Region</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'upper_teeth', label: 'Upper Teeth / Gums' },
                { id: 'lower_teeth', label: 'Lower Teeth / Gums' },
                { id: 'tongue_cheeks', label: 'Tongue / Cheeks / Lips' },
                { id: 'entire_mouth', label: 'Entire Mouth / Jaws' }
              ].map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocation(loc.id)}
                  className={`p-3 rounded-xl text-xs font-bold transition-all border ${
                    location === loc.id
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'glass-subtle border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-teal-500/40'
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <Button onClick={handleBack} variant="secondary" size="md" icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={handleNext} variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              Review Assessment
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 4: Review & Additional Context */}
      {step === 4 && (
        <GlassCard level={2} className="space-y-6 animate-in fade-in duration-200">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
              Review your details before evaluation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Our clinical logic will assess risk tiers, red flags, and formulate personalized questions for your dentist.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Primary Concern</span>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{primaryConcern}</p>
            </div>

            <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Intensity & Timeline</span>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                Pain: {painScore}/10 • Duration: {duration.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-subtle border border-slate-200/80 dark:border-white/[0.08] space-y-2">
            <span className="text-slate-400 uppercase font-bold text-[10px]">Selected Symptoms ({selectedSymptoms.length})</span>
            <div className="flex flex-wrap gap-2">
              {selectedSymptoms.map((s) => (
                <Badge key={s.id} variant="teal" size="sm">
                  {s.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="additional-notes-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Additional Notes (Optional):
            </label>
            <textarea
              id="additional-notes-input"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Existing filling, recent dental cleaning, or specific dental anxiety..."
              className="w-full p-3.5 rounded-2xl glass-subtle border border-slate-200/90 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <Button onClick={handleBack} variant="secondary" size="md" icon={ArrowLeft}>
              Back
            </Button>
            <Button
              onClick={handleSubmitAssessment}
              variant="primary"
              size="lg"
              isLoading={loading}
              icon={Sparkles}
              className="shadow-lg shadow-teal-500/25"
            >
              Generate Clinical Assessment Report
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Step 5: Report View */}
      {step === 5 && assessmentResult && (
        <ReportView
          assessment={assessmentResult}
          onStartOver={handleStartOver}
          onAskAI={handleAskAI}
        />
      )}
    </div>
  );
};
