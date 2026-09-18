import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  UploadCloud,
  FileText,
  File,
  CheckCircle,
  AlertCircle,
  FolderPlus,
  Tag,
  ShieldAlert,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  HelpCircle,
  Clock,
  RotateCcw,
  X
} from 'lucide-react';
import { knowledgeAPI } from '../../api/endpoints.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Modal } from '../common/Modal.jsx';

const DEFAULT_CATEGORIES = [
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

export const KnowledgeManager = () => {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('manual'); // 'manual' | 'pdf'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Custom Category Creation State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Form State for New Document
  const [formData, setFormData] = useState({
    title: '',
    category: DEFAULT_CATEGORIES[0],
    language: 'en',
    summary: '',
    content: '',
    tags: '',
    preventiveTips: '',
    warningSigns: '',
    whenToSeeDentist: '',
    org: 'World Dental Federation / ADA / IDA Guidelines'
  });

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ingestionJob, setIngestionJob] = useState(null);
  const [pdfMeta, setPdfMeta] = useState({
    title: '',
    category: DEFAULT_CATEGORIES[0],
    language: 'en',
    summary: '',
    tags: 'clinical-pdf, dental-education'
  });

  const validateAndSetPdf = (file) => {
    if (!file) return;
    setErrorMessage('');
    setSuccessMessage('');
    setIngestionJob(null);

    const isPdfMime = file.type === 'application/pdf' || file.type === 'application/x-pdf';
    const isPdfExt = file.name && file.name.toLowerCase().endsWith('.pdf');

    if (!isPdfMime && !isPdfExt) {
      setErrorMessage('Invalid file format. Only clinical PDF documents (.pdf) are permitted.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 15 MB limit. Please select a smaller PDF.');
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected PDF file appears to be empty (0 bytes).');
      return;
    }

    setPdfFile(file);
    if (!pdfMeta.title) {
      setPdfMeta((prev) => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      }));
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await knowledgeAPI.getCategories();
      if (res.data && Array.isArray(res.data)) {
        const catNames = res.data.map((c) => (typeof c === 'string' ? c : c.name));
        const combined = [...new Set([...DEFAULT_CATEGORIES, ...catNames])];
        setCategories(combined);
      }
    } catch (err) {
      console.warn('Failed to fetch categories, falling back to defaults:', err);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await knowledgeAPI.getDocuments({ limit: 50 });
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Fetch docs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || newCategoryName.trim().length < 2) {
      setCategoryError('Category name must be at least 2 characters.');
      return;
    }

    const trimmed = newCategoryName.trim();
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('A category with this name already exists.');
      return;
    }

    setIsCreatingCategory(true);
    setCategoryError('');

    try {
      const res = await knowledgeAPI.createCategory({
        name: trimmed,
        description: newCategoryDesc.trim()
      });

      const createdName = res.data?.name || trimmed;
      const updatedList = [...new Set([...categories, createdName])];
      setCategories(updatedList);

      // Select newly created category in the active form
      setFormData((prev) => ({ ...prev, category: createdName }));
      setPdfMeta((prev) => ({ ...prev, category: createdName }));

      toast.success(`Category "${createdName}" created successfully!`);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      setCategoryError(err.message || 'Failed to create category.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setReindexMsg('');
    try {
      const res = await knowledgeAPI.reindexAll();
      setReindexMsg(res.message || 'All documents re-indexed successfully!');
      fetchDocuments();
    } catch (err) {
      setReindexMsg(`Reindex error: ${err.message}`);
    } finally {
      setIsReindexing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this dental knowledge document?')) return;
    try {
      await knowledgeAPI.deleteDocument(id);
      setDocuments((docs) => docs.filter((d) => d._id !== id));
      toast.success('Document deleted successfully');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        language: formData.language,
        summary: formData.summary.trim(),
        content: formData.content.trim(),
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        preventiveTips: formData.preventiveTips
          ? formData.preventiveTips.split('\n').map((t) => t.trim()).filter(Boolean)
          : [],
        warningSigns: formData.warningSigns
          ? formData.warningSigns.split('\n').map((t) => t.trim()).filter(Boolean)
          : [],
        whenToSeeDentist: formData.whenToSeeDentist.trim() || undefined,
        sourceReference: {
          organization: formData.org.trim() || 'World Dental Federation / ADA / IDA Guidelines',
          publishedYear: new Date().getFullYear()
        }
      };

      await knowledgeAPI.createDocument(payload);
      setSuccessMessage('Document created, chunked, and 768-dim embeddings indexed successfully!');

      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({
          title: '',
          category: categories[0] || DEFAULT_CATEGORIES[0],
          language: 'en',
          summary: '',
          content: '',
          tags: '',
          preventiveTips: '',
          warningSigns: '',
          whenToSeeDentist: '',
          org: 'World Dental Federation / ADA / IDA Guidelines'
        });
        setSuccessMessage('');
        fetchDocuments();
      }, 900);
    } catch (err) {
      setErrorMessage(`Creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePdfSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pdfFile) {
      setErrorMessage('Please select or drag a valid clinical PDF file to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    setIngestionJob({
      status: 'uploading',
      progress: 10,
      stepLabel: `Uploading ${pdfFile.name} (${(pdfFile.size / 1024).toFixed(1)} KB)...`
    });

    try {
      const data = new FormData();
      data.append('file', pdfFile);
      if (pdfMeta.title) data.append('title', pdfMeta.title.trim());
      data.append('category', pdfMeta.category);
      data.append('language', pdfMeta.language);
      if (pdfMeta.summary) data.append('summary', pdfMeta.summary.trim());
      data.append('tags', pdfMeta.tags);

      const res = await knowledgeAPI.uploadPdf(data);
      const jobId = res.data?.jobId;

      if (!jobId) {
        setSuccessMessage('PDF parsed, chunked, and indexed into MongoDB Atlas vector search successfully!');
        setIsSubmitting(false);
        fetchDocuments();
        return;
      }

      setIngestionJob({
        status: 'uploaded',
        progress: 15,
        stepLabel: 'File uploaded. Initializing clinical text extraction...'
      });

      // Poll ingestion status
      const pollStartTime = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await knowledgeAPI.getIngestionStatus(jobId);
          const job = statusRes.data;

          if (!job) return;

          setIngestionJob({
            status: job.status,
            progress: job.progress || 25,
            stepLabel: job.stepLabel || 'Processing document chunks and embeddings...',
            chunkCount: job.chunkCount,
            numPages: job.numPages,
            error: job.error
          });

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setIsSubmitting(false);
            setSuccessMessage(job.stepLabel || 'PDF ingested, chunked, and indexed into vector search successfully!');
            fetchDocuments();
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setIsSubmitting(false);
            setErrorMessage(job.error || 'Ingestion failed during vector processing.');
          } else if (Date.now() - pollStartTime > 180000) {
            clearInterval(pollInterval);
            setIsSubmitting(false);
            setErrorMessage('Ingestion timed out. Please check backend logs or re-attempt with a smaller document.');
          }
        } catch (pollErr) {
          console.warn('Status poll retry:', pollErr.message);
        }
      }, 1200);

    } catch (err) {
      setIsSubmitting(false);
      setIngestionJob(null);
      setErrorMessage(`PDF upload failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Dental Knowledge Base (RAG Documents)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage educational clinical articles, chunks, and 768-dimensional semantic embeddings for the AI assistant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCategoryError('');
              setIsCategoryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/30 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-500/10 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Custom Category</span>
          </button>

          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin' : ''}`} />
            <span>{isReindexing ? 'Re-indexing...' : 'Re-index RAG Vectors'}</span>
          </button>

          <button
            onClick={() => {
              setErrorMessage('');
              setSuccessMessage('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Document</span>
          </button>
        </div>
      </div>

      {reindexMsg && (
        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs font-medium">
          {reindexMsg}
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Title & Summary</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading knowledge base...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No documents found. Click "Add New Document" to create one.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 max-w-sm">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{doc.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{doc.summary}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-[11px] font-medium">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap uppercase font-semibold text-[11px]">
                      {doc.language || 'en'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{doc.viewCount || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Custom Dental Category */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          if (!isCreatingCategory) setIsCategoryModalOpen(false);
        }}
        title="Add Custom Dental Category"
        subtitle="Create a new dental specialization or educational topic"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          {categoryError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{categoryError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Geriatric Dentistry, Dental Implants, Invisalign Care..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={newCategoryDesc}
              onChange={(e) => setNewCategoryDesc(e.target.value)}
              placeholder="Brief description of the dental conditions, procedures, or guidelines in this topic..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isCreatingCategory}
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingCategory}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isCreatingCategory ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Add Document / PDF Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsModalOpen(false);
        }}
        title="Add Dental Knowledge Document"
        subtitle="Ingest evidence-based clinical knowledge into the AI vector knowledge base"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalTab('manual')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                modalTab === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Structured Clinical Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab('pdf')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                modalTab === 'pdf'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload PDF Document</span>
            </button>
          </div>

          {/* Status Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Structured Clinical Entry Form */}
          {modalTab === 'manual' ? (
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* SECTION 1: Document Info */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>1. Document Classification</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Clinical Diagnosis & Treatment of Acute Dental Pulpitis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryError('');
                          setIsCategoryModalOpen(true);
                        }}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <FolderPlus className="w-3 h-3" />
                        <span>+ Custom</span>
                      </button>
                    </div>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Language <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="mr">मराठी (Marathi)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Executive Summary */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                    <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>2. Executive Summary (10 - 500 chars) <span className="text-rose-500">*</span></span>
                  </div>
                  <span className={`text-[10px] ${formData.summary.length > 500 ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {formData.summary.length}/500
                  </span>
                </div>
                <textarea
                  required
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Concise overview of what this clinical document teaches patient users and AI retrieval..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* SECTION 3: Evidence-Based Content */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>3. Full Evidence-Based Clinical Content <span className="text-rose-500">*</span></span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write comprehensive, peer-reviewed clinical information. Will be automatically chunked and converted into 768-dim vector embeddings..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                />
              </div>

              {/* SECTION 4: Clinical Guidance & Red Flags */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>4. Clinical Guidance & Red Flags</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Preventive Tips (One per line)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.preventiveTips}
                      onChange={(e) => setFormData({ ...formData, preventiveTips: e.target.value })}
                      placeholder="Brush twice daily&#10;Use soft-bristled toothbrush"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Warning Signs (One per line)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.warningSigns}
                      onChange={(e) => setFormData({ ...formData, warningSigns: e.target.value })}
                      placeholder="Severe pain waking from sleep&#10;Facial asymmetry or swelling"
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    When to See Dentist (Urgency Guide)
                  </label>
                  <input
                    type="text"
                    value={formData.whenToSeeDentist}
                    onChange={(e) => setFormData({ ...formData, whenToSeeDentist: e.target.value })}
                    placeholder="e.g., Schedule an urgent dental appointment if pain does not subside within 48 hours."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* SECTION 5: Source Attribution & Metadata */}
              <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>5. Source Attribution & Tags</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tags (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="pulpitis, toothache, root-canal, hygiene"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Source Organization
                    </label>
                    <input
                      type="text"
                      value={formData.org}
                      onChange={(e) => setFormData({ ...formData, org: e.target.value })}
                      placeholder="World Dental Federation / ADA / IDA"
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Action Footer */}
              <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-3 -mx-5 px-5 sm:-mx-6 sm:px-6 border-t border-slate-200/80 dark:border-slate-800 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-500/25 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Chunking & Indexing Embeddings...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save & Index Document</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: PDF Ingestion Form */
            <form onSubmit={handlePdfSubmit} className="space-y-4 text-xs">
              {/* PDF Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!isSubmitting) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (isSubmitting) return;
                  const droppedFile = e.dataTransfer.files?.[0];
                  if (droppedFile) validateAndSetPdf(droppedFile);
                }}
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/15 scale-[1.01]'
                    : pdfFile
                    ? 'border-teal-500/40 bg-teal-500/5 dark:bg-teal-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 hover:border-teal-500/60'
                }`}
              >
                {pdfFile ? (
                  /* Selected File Info Card */
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30 shadow-xs text-left">
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[240px] sm:max-w-[340px]">
                            {pdfFile.name}
                          </p>
                          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                            PDF Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {(pdfFile.size / 1024).toFixed(1)} KB • Ready for extraction & vector indexing
                        </p>
                      </div>
                    </div>

                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null);
                          setIngestionJob(null);
                          setErrorMessage('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-500/40 text-slate-500 hover:text-rose-500 text-xs font-semibold flex items-center gap-1 transition-colors self-end sm:self-center cursor-pointer"
                        title="Remove selected file"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Empty Dropzone State */
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3 border border-teal-500/20">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Select or drag & drop a Clinical Dental PDF
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      Text will be extracted, split into semantic chunks, and embedded into 768-dimensional vectors for the AI assistant.
                    </p>

                    <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/20 transition-all cursor-pointer">
                      <File className="w-3.5 h-3.5" />
                      <span>Browse PDF File</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) validateAndSetPdf(file);
                        }}
                        className="sr-only"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                      Max file size: 15 MB (.pdf only)
                    </p>
                  </div>
                )}
              </div>

              {/* Live Ingestion Job Stepped Progress Card */}
              {ingestionJob && (
                <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-teal-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin" />
                      ) : ingestionJob.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {isSubmitting
                          ? 'Ingesting Clinical Knowledge...'
                          : ingestionJob.status === 'completed'
                          ? 'Ingestion Completed'
                          : 'Ingestion Error'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                      {ingestionJob.progress || 0}%
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ingestionJob.status === 'failed'
                          ? 'bg-rose-500'
                          : ingestionJob.status === 'completed'
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-teal-500 via-teal-400 to-cyan-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, ingestionJob.progress || 10))}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium flex items-center justify-between">
                    <span>{ingestionJob.stepLabel}</span>
                    {ingestionJob.chunkCount && (
                      <span className="text-slate-400 text-[10px]">
                        {ingestionJob.chunkCount} chunks
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Document Title Input */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title <span className="text-slate-400 font-normal">(Auto-derived from PDF if blank)</span>
                </label>
                <input
                  type="text"
                  disabled={isSubmitting}
                  value={pdfMeta.title}
                  onChange={(e) => setPdfMeta({ ...pdfMeta, title: e.target.value })}
                  placeholder="e.g. ADA Dental Clinical Practice Guidelines"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                />
              </div>

              {/* Category & Language Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => {
                        setCategoryError('');
                        setIsCategoryModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                    >
                      <FolderPlus className="w-3 h-3" />
                      <span>+ Custom</span>
                    </button>
                  </div>
                  <select
                    disabled={isSubmitting}
                    value={pdfMeta.category}
                    onChange={(e) => setPdfMeta({ ...pdfMeta, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Language <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isSubmitting}
                    value={pdfMeta.language}
                    onChange={(e) => setPdfMeta({ ...pdfMeta, language: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                  </select>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                <div>
                  {errorMessage && !isSubmitting && pdfFile && (
                    <button
                      type="button"
                      onClick={handlePdfSubmit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-400/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retry Ingestion</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsModalOpen(false);
                      setIngestionJob(null);
                      setErrorMessage('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {successMessage ? 'Close' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !pdfFile}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-teal-500/25 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Ingesting PDF Vectors...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload & Ingest PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
