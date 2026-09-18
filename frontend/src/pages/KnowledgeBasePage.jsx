import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  ArrowRight,
  X
} from 'lucide-react';
import { knowledgeAPI } from '../api/endpoints.js';
import { Modal } from '../components/common/Modal.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { GlassCard } from '../components/common/GlassCard.jsx';
import { Button } from '../components/forms/Button.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { SkeletonLoader } from '../components/common/SkeletonLoader.jsx';

const CATEGORIES = [
  'All',
  'Tooth Decay & Cavities',
  'Gum Disease (Gingivitis & Periodontitis)',
  'Oral Cancer Awareness & Red Flags',
  'Sensitivity & Enamel Erosion',
  'Pediatric Dental Hygiene',
  'Wisdom Teeth & Orthodontics',
  'Dental Emergencies & Trauma',
  'Halitosis & Daily Hygiene',
  'Dry Mouth & Salivary Conditions'
];

export const KnowledgeBasePage = () => {
  const { language, t } = useLanguage();
  const [categoriesList, setCategoriesList] = useState(CATEGORIES);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticle, setActiveArticle] = useState(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await knowledgeAPI.getCategories();
        if (res.data && Array.isArray(res.data)) {
          const names = res.data.map(c => typeof c === 'string' ? c : c.name);
          const combined = ['All', ...new Set([...CATEGORIES.filter(c => c !== 'All'), ...names])];
          setCategoriesList(combined);
        }
      } catch (err) {
        console.warn('Could not fetch custom categories, using defaults:', err);
      }
    };
    loadCategories();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await knowledgeAPI.getDocuments({
        search,
        category: selectedCategory,
        limit: 30
      });
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Fetch knowledge error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArticles();
  };

  const handleReadArticle = async (slug) => {
    try {
      const res = await knowledgeAPI.getDocumentBySlug(slug);
      setActiveArticle(res.data);
      setArticleModalOpen(true);
    } catch (err) {
      console.error('Article load error:', err);
    }
  };

  return (
    <div className="space-y-10 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center space-y-2.5 max-w-2xl mx-auto">
        <Badge variant="amber" size="md">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Peer-Reviewed Dental Knowledge Base</span>
        </Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {t('knowledge.title') || 'Oral Health Encyclopedia'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t('knowledge.subtitle') || 'Explore verified clinical guidelines, preventive recommendations, and disease mechanisms.'}
        </p>
      </div>

      {/* Search Bar & Category Filters */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('knowledge.searchPlaceholder') || 'Search by condition, treatment, symptoms (e.g. gingivitis, root canal, enamel)...'}
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl glass-elevated border border-slate-200/90 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); fetchArticles(); }}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4.5 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-500/20 interactive-scale"
          >
            Search
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-teal-500 shadow-md shadow-teal-500/20'
                  : 'glass-subtle text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.08] hover:border-teal-500/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          <SkeletonLoader count={6} />
        </div>
      ) : documents.length === 0 ? (
        <div className="py-20 text-center space-y-3 text-slate-400 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300">No articles found matching your query.</p>
          <p className="text-xs text-slate-500">Try searching for broader keywords like "plaque", "cavity", or "floss".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {documents.map((doc) => (
            <GlassCard
              key={doc._id}
              level={3}
              onClick={() => handleReadArticle(doc.slug)}
              className="flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="teal" size="sm" className="truncate max-w-[200px]">
                    {doc.category}
                  </Badge>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded-md glass-subtle">
                    {doc.language || 'en'}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors line-clamp-2 leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-normal">
                  {doc.summary}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md glass-subtle text-[10px] text-slate-500 dark:text-slate-400 font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Eye className="w-3.5 h-3.5" />
                  {doc.viewCount || 0} views
                </span>

                <span className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                  <span>{t('knowledge.readArticle') || 'Read Guide'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      <Modal
        isOpen={articleModalOpen}
        onClose={() => setArticleModalOpen(false)}
        title={activeArticle?.title || 'Dental Health Guide'}
        subtitle={activeArticle ? `Published under ${activeArticle.category}` : ''}
        maxWidth="max-w-3xl"
      >
        {activeArticle && (
          <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            {/* Category & Source pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <Badge variant="teal" size="md">
                {activeArticle.category}
              </Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Authority: <strong className="text-slate-700 dark:text-slate-300">{activeArticle.sourceReference?.organization || 'World Dental Guidelines'}</strong>
              </span>
            </div>

            {/* Summary */}
            <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-teal-500/30 text-slate-800 dark:text-slate-200">
              <p className="font-bold leading-relaxed">{activeArticle.summary}</p>
            </div>

            {/* Content Body */}
            <div className="space-y-3 leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200 font-normal">
              {activeArticle.content}
            </div>

            {/* Preventive Tips */}
            {activeArticle.preventiveTips && activeArticle.preventiveTips.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-emerald-500/30 space-y-2.5">
                <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>{t('knowledge.preventiveMeasures') || 'Evidence-Based Preventive Measures'}</span>
                </h4>
                <ul className="space-y-1.5 pl-2 text-xs">
                  {activeArticle.preventiveTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warning Signs */}
            {activeArticle.warningSigns && activeArticle.warningSigns.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-rose-500/30 space-y-2.5">
                <h4 className="font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>{t('knowledge.warningSigns') || 'Red-Flag Warning Signs'}</span>
                </h4>
                <ul className="space-y-1.5 pl-2 text-xs">
                  {activeArticle.warningSigns.map((sign, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* When to see dentist */}
            {activeArticle.whenToSeeDentist && (
              <div className="p-4 sm:p-5 rounded-2xl glass-subtle border border-amber-500/30 space-y-1">
                <h4 className="font-extrabold text-amber-900 dark:text-amber-200">
                  {t('knowledge.whenToSeeDentist') || 'When to Schedule a Dental Appointment'}:
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                  {activeArticle.whenToSeeDentist}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] flex justify-end">
              <Button
                onClick={() => setArticleModalOpen(false)}
                variant="primary"
                size="md"
              >
                Close Guide
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
