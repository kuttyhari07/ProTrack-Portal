import React, { useState } from 'react';
import {
  X,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileCode,
  ShieldCheck
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const DocumentPreviewModal = ({ isOpen, onClose, document, onDownload }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !document) return null;

  const isImage = document.mimeType?.startsWith('image/') ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(document.originalName || document.fileName || '');

  const isPDF = document.mimeType === 'application/pdf' ||
    /\.pdf$/i.test(document.originalName || document.fileName || '');

  const isCodeOrText = document.mimeType?.startsWith('text/') ||
    /\.(js|jsx|ts|tsx|json|html|css|py|md|txt|sql)$/i.test(document.originalName || document.fileName || '');

  const previewUrl = `/api/documents/${document._id}/preview`;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 max-w-[80%] truncate">
          {isImage ? (
            <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
          ) : isPDF ? (
            <FileText className="w-5 h-5 text-red-500 shrink-0" />
          ) : (
            <FileCode className="w-5 h-5 text-amber-500 shrink-0" />
          )}
          <span className="truncate text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            {document.title || document.originalName}
          </span>
        </div>
      }
      size="xl"
    >
      <div className="space-y-4">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <span>Size: <strong className="text-gray-900 dark:text-white">{formatSize(document.size)}</strong></span>
            <span>•</span>
            <span>Uploader: <strong className="text-gray-900 dark:text-white">{document.uploader?.name || 'Teammate'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {isImage && (
              <>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <span className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />
              </>
            )}

            <Button
              size="sm"
              variant="outline"
              icon={Download}
              onClick={() => onDownload(document._id, document.originalName)}
              className="text-xs"
            >
              Download
            </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="relative min-h-[420px] max-h-[600px] bg-slate-900/90 dark:bg-black/80 rounded-xl overflow-hidden flex items-center justify-center p-4 border border-gray-800">
          {isImage ? (
            <div className="overflow-auto max-h-[560px] max-w-full flex items-center justify-center">
              <img
                src={previewUrl}
                alt={document.title || document.originalName}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[520px] max-w-full object-contain rounded shadow-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="text-center text-gray-400 p-8">
                <p className="text-sm">Could not load live image preview directly.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => onDownload(document._id, document.originalName)}
                >
                  Download File
                </Button>
              </div>
            </div>
          ) : isPDF ? (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              title={document.title || 'PDF Document'}
              className="w-full h-[520px] rounded border-0 bg-white"
            />
          ) : (
            <div className="text-center p-8 text-gray-300 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/60 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-800/50">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">
                {document.originalName}
              </h4>
              <p className="text-xs text-gray-400 mb-4">
                This file format ({document.mimeType || 'binary'}) is secured and ready for authenticated download.
              </p>
              <Button
                size="sm"
                icon={Download}
                onClick={() => onDownload(document._id, document.originalName)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Download Document ({formatSize(document.size)})
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentPreviewModal;

