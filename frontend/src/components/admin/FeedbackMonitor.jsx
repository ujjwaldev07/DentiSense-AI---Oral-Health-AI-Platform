import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, CheckCircle, Clock } from 'lucide-react';
import { feedbackAPI } from '../../api/endpoints.js';
import { useToast } from '../../contexts/ToastContext.jsx';

export const FeedbackMonitor = () => {
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getAllFeedbacks({ limit: 30 });
      setFeedbacks(res.data || []);
    } catch (err) {
      console.error('Feedback fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const toggleReview = async (f) => {
    try {
      const updated = await feedbackAPI.updateStatus(f._id, { isReviewedByAdmin: !f.isReviewedByAdmin });
      setFeedbacks(feedbacks.map(item => (item._id === f._id ? updated.data : item)));
      toast.success(`Feedback status updated to ${!f.isReviewedByAdmin ? 'Reviewed' : 'Pending'}`);
    } catch (err) {
      toast.error('Failed to update feedback status');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          User Feedback & AI Response Monitoring
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Monitor user ratings, quality feedback, and educational clarity reports.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">User Comment</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading feedback...
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No user feedback submitted yet.
                  </td>
                </tr>
              ) : (
                feedbacks.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{f.rating} / 5</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium capitalize">
                        {(f.category || 'general').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-slate-800 dark:text-slate-200 line-clamp-2">
                        {f.comment || 'No written comment'}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {f.userId?.name || 'Anonymous User'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => toggleReview(f)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                          f.isReviewedByAdmin
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {f.isReviewedByAdmin ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{f.isReviewedByAdmin ? 'Reviewed' : 'Pending'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
