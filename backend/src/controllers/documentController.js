const Document = require('../models/Document');
const Project = require('../models/Project');
const path = require('path');
const fs = require('fs');
const { logActivity } = require('../services/activityService');

// @desc    Get documents for workspace / project
// @route   GET /api/documents
// @access  Private (Workspace Member)
const getDocuments = async (req, res, next) => {
  try {
    const { projectId, search } = req.query;
    const query = { workspace: req.workspaceId };

    if (projectId && projectId !== 'all') {
      query.project = projectId;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { originalName: regex }, { description: regex }];
    }

    const documents = await Document.find(query)
      .populate('uploader', 'name email avatar')
      .populate('project', 'name projectCode')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private (Workspace Member - restrict Viewer)
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded'
      });
    }

    const { projectId, taskId, title, description, tags } = req.body;

    let projectObj = null;
    if (projectId) {
      projectObj = await Project.findOne({
        _id: projectId,
        workspace: req.workspaceId
      });
      if (!projectObj) {
        // Remove uploaded file if project not found
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Project not found in workspace'
        });
      }
    }

    const document = await Document.create({
      workspace: req.workspaceId,
      project: projectId || null,
      task: taskId || null,
      title: title && title.trim() ? title.trim() : req.file.originalname,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filePath: req.file.path,
      uploader: req.user._id,
      description: description || '',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : []
    });

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: projectId || null,
      userId: req.user._id,
      action: 'uploaded',
      entityType: 'document',
      entityId: document._id,
      entityTitle: document.title,
      details: { size: req.file.size, mimeType: req.file.mimetype }
    });

    const populated = await Document.findById(document._id)
      .populate('uploader', 'name email avatar')
      .populate('project', 'name projectCode');

    res.status(201).json({
      success: true,
      document: populated
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// @desc    Download document securely
// @route   GET /api/documents/:id/download
// @access  Private (Workspace Member)
const downloadDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found'
      });
    }

    const filePath = path.resolve(document.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File does not exist on storage disk'
      });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Workspace Member - restrict Viewer)
const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      workspace: req.workspaceId
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check ownership or admin
    if (document.uploader.toString() !== req.user._id.toString() && !['Owner', 'Admin'].includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Remove file from disk
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (err) {
        console.error('File unlink error:', err.message);
      }
    }

    await Document.findByIdAndDelete(document._id);

    await logActivity({
      workspaceId: req.workspaceId,
      projectId: document.project,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'document',
      entityId: document._id,
      entityTitle: document.title
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
};
