import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/Skeleton';
import { FileText, Upload, Download, Trash2, Search, HardDrive, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const DocumentsPage = () => {
  const { isViewer, isOwnerOrAdmin } = useWorkspace();

  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  // Upload modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [targetProject, setTargetProject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        projectId: projectFilter
      });

      const [dRes, pRes] = await Promise.all([
        api.get(`/documents?${queryParams.toString()}`),
        api.get('/projects')
      ]);

      if (dRes.data.success) setDocuments(dRes.data.documents);
      if (pRes.data.success) {
        setProjects(pRes.data.projects);
        if (pRes.data.projects.length > 0 && !targetProject) {
          setTargetProject(pRes.data.projects[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, projectFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a file to upload');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (targetProject) formData.append('projectId', targetProject);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setDocuments((prev) => [res.data.document, ...prev]);
        setUploadModalOpen(false);
        setSelectedFile(null);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download file');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await api.delete(`/documents/${docId}`);
      if (res.data.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== docId));
      }
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const totalSizeKB = documents.reduce((sum, d) => sum + (d.size || 0), 0) / 1024;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
            Documents & Repository
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#9CA3AF]">
            Manage project architecture specs, contracts, release notes, and assets securely.
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            icon={Upload}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload File
          </Button>
        )}
      </div>

      {/* Storage Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Documents</span>
            <h3 className="text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] mt-0.5">
              {documents.length}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Total Volume Stored</span>
            <h3 className="text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] mt-0.5">
              {totalSizeKB > 1024 ? `${(totalSizeKB / 1024).toFixed(2)} MB` : `${totalSizeKB.toFixed(1)} KB`}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
            <HardDrive className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 uppercase font-semibold">Storage Provider</span>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              Active Storage Disk (25MB Limit)
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex-1 max-w-sm w-full">
          <Input
            placeholder="Search documents by title or filename..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-48 w-full sm:w-48">
          <Select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Projects' },
              ...projects.map((p) => ({ value: p._id, label: p.name }))
            ]}
          />
        </div>
      </Card>

      {/* Documents Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload project documents, architecture diagrams, or team deliverables."
          actionLabel={!isViewer ? 'Upload File' : undefined}
          onAction={() => setUploadModalOpen(true)}
          actionIcon={Upload}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-[#374151] bg-gray-50 dark:bg-[#1F2937]/50 text-[#667085] dark:text-[#9CA3AF] uppercase font-semibold">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Associated Project</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Uploaded By</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#374151]">
                {documents.map((doc) => (
                  <tr
                    key={doc._id}
                    className="hover:bg-gray-50/50 dark:hover:bg-[#1F2937]/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-[#4F46E5] shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#172033] dark:text-[#F3F4F6]">
                            {doc.title}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            {doc.originalName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-indigo-600 dark:text-indigo-400">
                      {doc.project ? (
                        <Link to={`/projects/${doc.project._id || doc.project}`} className="hover:underline">
                          {doc.project.name || 'Project'}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Workspace General</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#667085] dark:text-[#9CA3AF]">
                      {(doc.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3.5 px-4 text-[#172033] dark:text-[#F3F4F6]">
                      {doc.uploader?.name || 'Teammate'}
                    </td>
                    <td className="py-3.5 px-4 text-[#667085] dark:text-[#9CA3AF]">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Download}
                          onClick={() => handleDownload(doc._id, doc.originalName)}
                        >
                          Download
                        </Button>
                        {!isViewer && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc._id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* UPLOAD MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document"
        subtitle="Attach specs, diagrams, datasets or documentation (up to 25MB)."
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Select
            label="Associate With Project"
            value={targetProject}
            options={[
              { value: '', label: 'General Workspace Document' },
              ...projects.map((p) => ({ value: p._id, label: p.name }))
            ]}
            onChange={(e) => setTargetProject(e.target.value)}
          />

          <Input
            label="Document Title"
            placeholder="e.g. Infrastructure Topology Specification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Choose File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="block w-full text-xs text-[#667085] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/60 dark:file:text-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF] mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-lg border border-[#E4E7EC] dark:border-[#374151] bg-white dark:bg-[#111827] text-sm text-[#172033] dark:text-[#F3F4F6] p-3 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E4E7EC] dark:border-[#374151]">
            <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Upload File
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
