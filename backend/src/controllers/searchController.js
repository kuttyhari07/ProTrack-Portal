const Project = require('../models/Project');
const Task = require('../models/Task');
const Issue = require('../models/Issue');
const Document = require('../models/Document');

// @desc    Global search across projects, tasks, issues, and documents
// @route   GET /api/search
// @access  Private (Workspace Member)
const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({
        success: true,
        results: {
          projects: [],
          tasks: [],
          issues: [],
          documents: []
        }
      });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [projects, tasks, issues, documents] = await Promise.all([
      Project.find({
        workspace: req.workspaceId,
        $or: [{ name: regex }, { projectCode: regex }, { description: regex }]
      })
        .select('name projectCode status health progress dueDate')
        .limit(6),

      Task.find({
        workspace: req.workspaceId,
        $or: [{ title: regex }, { description: regex }]
      })
        .select('title taskNumber status priority project dueDate')
        .populate('project', 'name projectCode')
        .limit(8),

      Issue.find({
        workspace: req.workspaceId,
        $or: [{ title: regex }, { description: regex }]
      })
        .select('title status priority category project')
        .populate('project', 'name projectCode')
        .limit(6),

      Document.find({
        workspace: req.workspaceId,
        $or: [{ title: regex }, { originalName: regex }]
      })
        .select('title originalName mimeType size project')
        .populate('project', 'name projectCode')
        .limit(6)
    ]);

    res.json({
      success: true,
      query: q,
      results: {
        projects,
        tasks,
        issues,
        documents
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
