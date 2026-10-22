const { runWorkspaceAutomation, evaluateProjectHealth } = require('../services/automationService');

// @desc    Get automated insights, alerts, and recommended actions
// @route   GET /api/automation/insights
// @access  Private (Workspace Member)
const getAutomationOverview = async (req, res, next) => {
  try {
    const analysis = await runWorkspaceAutomation(req.workspaceId);
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger explicit re-evaluation of workspace automation rules
// @route   POST /api/automation/run
// @access  Private (Workspace Member)
const triggerAutomationRun = async (req, res, next) => {
  try {
    const analysis = await runWorkspaceAutomation(req.workspaceId);
    res.json({
      success: true,
      message: 'Workspace automation scan completed successfully',
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get risk assessment for a specific project
// @route   GET /api/automation/projects/:id/risk
// @access  Private (Workspace Member)
const getProjectRisk = async (req, res, next) => {
  try {
    const risk = await evaluateProjectHealth(req.params.id);
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: risk
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAutomationOverview,
  triggerAutomationRun,
  getProjectRisk
};
