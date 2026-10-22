import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderKanban, CheckSquare, AlertCircle, FileText, ArrowRight, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import Badge from '../common/Badge';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [], issues: [], documents: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], issues: [], documents: [] });
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], issues: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/search?q=${encodeURIComponent(query.trim())}`);
        if (res.data.success) {
          setResults(res.data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url) => {
    navigate(url);
    onClose();
  };

  if (!isOpen) return null;

  const totalResults =
    results.projects.length +
    results.tasks.length +
    results.issues.length +
    results.documents.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative mx-auto max-w-2xl transform overflow-hidden rounded-[14px] bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] shadow-2xl transition-all">
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-[#E4E7EC] dark:border-[#374151] px-4">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, issues, and documents... (Esc to close)"
            className="w-full bg-transparent px-3.5 py-4 text-sm text-[#172033] dark:text-[#F3F4F6] placeholder-gray-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5] shrink-0" />}
          <button
            type="button"
            onClick={onClose}
            className="ml-2 p-1 text-gray-400 hover:text-gray-500 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-6">
          {!query.trim() && (
            <div className="py-8 text-center text-xs text-[#667085] dark:text-[#9CA3AF]">
              Type a keyword to search across the entire workspace.
            </div>
          )}

          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-8 text-center text-sm text-[#667085] dark:text-[#9CA3AF]">
              No results found for "<span className="font-semibold">{query}</span>"
            </div>
          )}

          {/* Projects */}
          {results.projects.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-2 px-2">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                Projects
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => handleSelect(`/projects/${proj._id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                        {proj.projectCode}
                      </span>
                      <span className="text-sm font-medium text-[#172033] dark:text-[#F3F4F6]">
                        {proj.name}
                      </span>
                    </div>
                    <Badge variant={proj.status}>{proj.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-2 px-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                Tasks
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleSelect(`/projects/${task.project?._id || task.project}?tab=tasks`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs text-gray-400 font-mono">
                        #{task.taskNumber}
                      </span>
                      <span className="text-sm font-medium text-[#172033] dark:text-[#F3F4F6] truncate">
                        {task.title}
                      </span>
                      {task.project?.projectCode && (
                        <span className="text-[11px] text-gray-400">
                          ({task.project.projectCode})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={task.priority}>{task.priority}</Badge>
                      <Badge variant={task.status}>{task.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {results.issues.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-2 px-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Issues & Risks
              </div>
              <div className="space-y-1">
                {results.issues.map((issue) => (
                  <div
                    key={issue._id}
                    onClick={() => handleSelect(`/projects/${issue.project?._id || issue.project}?tab=issues`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-medium text-[#172033] dark:text-[#F3F4F6] truncate">
                        {issue.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={issue.priority}>{issue.priority}</Badge>
                      <Badge variant={issue.status}>{issue.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-2 px-2">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                Documents
              </div>
              <div className="space-y-1">
                {results.documents.map((doc) => (
                  <div
                    key={doc._id}
                    onClick={() => handleSelect(`/documents`)}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm font-medium text-[#172033] dark:text-[#F3F4F6] truncate">
                        {doc.title}
                      </span>
                      <span className="text-xs text-gray-400">({doc.originalName})</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-[#E4E7EC] dark:border-[#374151] px-4 py-2.5 bg-gray-50 dark:bg-[#1F2937]/50 flex items-center justify-between text-[11px] text-gray-400">
          <span>Navigate with mouse or Esc to close</span>
          <span>ProTrack Global Search</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
