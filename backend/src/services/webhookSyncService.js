const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { logActivity } = require('./activityService');
const { emitToWorkspace } = require('./socketService');
const { evaluateProjectHealth } = require('./automationService');

/**
 * Extract task identifiers from commit messages or PR text
 * e.g. "fix(PRO-24): resolved auth issue" or "closes #24" or "PRO-24"
 */
const extractTaskReferences = (text) => {
  if (!text) return [];
  const references = [];

  // 1. Matches project codes e.g. PRO-12, DEMO-5
  const codeMatches = text.match(/\b([A-Z]{2,10})-(\d+)\b/g);
  if (codeMatches) {
    codeMatches.forEach((m) => {
      const [code, num] = m.split('-');
      references.push({
        full: m,
        projectCode: code.toUpperCase(),
        taskNumber: parseInt(num, 10),
        raw: m
      });
    });
  }

  // 2. Matches "#12" style task numbers
  const numMatches = text.match(/#(\d+)\b/g);
  if (numMatches) {
    numMatches.forEach((m) => {
      const num = parseInt(m.replace('#', ''), 10);
      references.push({
        full: m,
        taskNumber: num,
        raw: m
      });
    });
  }

  return references;
};

/**
 * Determine if commit text indicates completion or in-progress
 */
const detectTaskIntent = (text) => {
  const lower = text.toLowerCase();
  if (/(fix(es|ed)?|close[sd]?|resolve[sd]?|complete[sd]?|done)/i.test(lower)) {
    return 'completed';
  }
  if (/(wip|progress|start(ed)?|working|implementing)/i.test(lower)) {
    return 'in_progress';
  }
  return 'comment_only';
};

/**
 * Process GitHub Push Event
 */
const processGitHubPush = async (workspaceId, payload) => {
  const commits = payload.commits || [];
  const repoName = payload.repository?.full_name || 'Git Repository';
  const results = [];

  for (const commit of commits) {
    const refs = extractTaskReferences(commit.message);
    const intent = detectTaskIntent(commit.message);

    for (const ref of refs) {
      const query = { workspace: workspaceId };

      if (ref.projectCode) {
        const project = await Project.findOne({ workspace: workspaceId, projectCode: ref.projectCode });
        if (project) {
          query.project = project._id;
          query.taskNumber = ref.taskNumber;
        } else {
          continue;
        }
      } else if (ref.taskNumber) {
        query.taskNumber = ref.taskNumber;
      }

      const task = await Task.findOne(query);
      if (!task) continue;

      let statusChanged = false;
      const previousStatus = task.status;

      if (intent === 'completed' && task.status !== 'completed') {
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = new Date();
        statusChanged = true;
      } else if (intent === 'in_progress' && task.status === 'todo') {
        task.status = 'in_progress';
        if (task.progress === 0) task.progress = 25;
        statusChanged = true;
      }

      // Add audit comment with GitHub commit link
      const commitComment = `🐙 **[GitHub Commit - ${commit.id.slice(0, 7)}]**\n"${commit.message.trim()}"\n\n*Committed by ${commit.author?.name || 'Developer'} in \`${repoName}\`*\n[View Commit on GitHub](${commit.url})`;

      // Find an admin or workspace user to attribute the bot comment to
      const botUser = await User.findOne({ role: 'superadmin' }) || await User.findOne();

      if (botUser) {
        task.comments.push({
          user: botUser._id,
          text: commitComment
        });
      }

      await task.save();

      // Log Activity
      await logActivity({
        workspaceId,
        projectId: task.project,
        userId: botUser ? botUser._id : task.creator,
        action: statusChanged ? 'status_change' : 'updated',
        entityType: 'task',
        entityId: task._id,
        entityTitle: task.title,
        details: {
          source: 'github_webhook',
          commitId: commit.id.slice(0, 7),
          from: previousStatus,
          to: task.status
        }
      });

      await evaluateProjectHealth(task.project);

      const populated = await Task.findById(task._id)
        .populate('project', 'name projectCode')
        .populate('assignee', 'name email avatar title');

      emitToWorkspace(workspaceId, 'task_updated', populated);

      results.push({
        taskId: task._id,
        title: task.title,
        status: task.status,
        commit: commit.id.slice(0, 7)
      });
    }
  }

  return results;
};

/**
 * Process GitHub Pull Request Event
 */
const processGitHubPR = async (workspaceId, payload) => {
  const pr = payload.pull_request;
  if (!pr) return [];

  const textToScan = `${pr.title} ${pr.body || ''}`;
  const refs = extractTaskReferences(textToScan);
  const isMerged = payload.action === 'closed' && pr.merged === true;
  const isOpened = payload.action === 'opened';
  const repoName = payload.repository?.full_name || 'Git Repository';
  const results = [];

  for (const ref of refs) {
    const query = { workspace: workspaceId };
    if (ref.projectCode) {
      const project = await Project.findOne({ workspace: workspaceId, projectCode: ref.projectCode });
      if (project) {
        query.project = project._id;
        query.taskNumber = ref.taskNumber;
      } else {
        continue;
      }
    } else if (ref.taskNumber) {
      query.taskNumber = ref.taskNumber;
    }

    const task = await Task.findOne(query);
    if (!task) continue;

    let statusChanged = false;
    const previousStatus = task.status;

    if (isMerged && task.status !== 'completed') {
      task.status = 'completed';
      task.progress = 100;
      task.completedAt = new Date();
      statusChanged = true;
    } else if (isOpened && task.status !== 'in_review') {
      task.status = 'in_review';
      statusChanged = true;
    }

    const prComment = `🔀 **[GitHub Pull Request #${pr.number}]**\n"${pr.title}" — *${isMerged ? 'Merged 🎉' : isOpened ? 'Opened for Review' : pr.state}*\n\n*Author: ${pr.user?.login || 'Developer'} in \`${repoName}\`*\n[View Pull Request on GitHub](${pr.html_url})`;

    const botUser = await User.findOne({ role: 'superadmin' }) || await User.findOne();
    if (botUser) {
      task.comments.push({
        user: botUser._id,
        text: prComment
      });
    }

    await task.save();

    await logActivity({
      workspaceId,
      projectId: task.project,
      userId: botUser ? botUser._id : task.creator,
      action: statusChanged ? 'status_change' : 'updated',
      entityType: 'task',
      entityId: task._id,
      entityTitle: task.title,
      details: {
        source: 'github_pr_webhook',
        prNumber: pr.number,
        from: previousStatus,
        to: task.status
      }
    });

    await evaluateProjectHealth(task.project);

    const populated = await Task.findById(task._id)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email avatar title');

    emitToWorkspace(workspaceId, 'task_updated', populated);

    results.push({
      taskId: task._id,
      title: task.title,
      status: task.status,
      prNumber: pr.number
    });
  }

  return results;
};

module.exports = {
  extractTaskReferences,
  detectTaskIntent,
  processGitHubPush,
  processGitHubPR
};

