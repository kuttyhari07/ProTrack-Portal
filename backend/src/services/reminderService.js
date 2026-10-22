const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { sendDueDateReminderEmail } = require('./emailService');
const { emitToUser } = require('./socketService');

/**
 * Scans active tasks across all workspaces and dispatches due date reminders & overdue notifications
 */
const checkAndSendDueDateReminders = async (workspaceId = null) => {
  try {
    const now = new Date();
    // 48 hours window
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    // Don't send more than one reminder per 20 hours
    const cooldownPeriod = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    const query = {
      status: { $ne: 'completed' },
      dueDate: { $lte: in48Hours },
      assignee: { $ne: null },
      $or: [
        { lastReminderSentAt: { $exists: false } },
        { lastReminderSentAt: null },
        { lastReminderSentAt: { $lt: cooldownPeriod } }
      ]
    };

    if (workspaceId) {
      query.workspace = workspaceId;
    }

    const tasksToRemind = await Task.find(query)
      .populate('project', 'name projectCode')
      .populate('assignee', 'name email preferences');

    let sentCount = 0;

    for (const task of tasksToRemind) {
      if (!task.assignee || !task.assignee.email) continue;

      const isOverdue = new Date(task.dueDate) < now;

      // 1. Send Email if user has email notifications enabled
      if (task.assignee.preferences?.emailNotifications !== false) {
        await sendDueDateReminderEmail({
          recipientEmail: task.assignee.email,
          recipientName: task.assignee.name,
          taskTitle: task.title,
          projectName: task.project?.name || 'Project',
          dueDate: task.dueDate,
          priority: task.priority,
          isOverdue
        });
      }

      // 2. Create In-App Notification
      const notifType = isOverdue ? 'task_overdue' : 'deadline_approaching';
      const notifTitle = isOverdue ? 'Task Overdue' : 'Task Deadline Approaching';
      const notifMsg = isOverdue
        ? `Task "${task.title}" in ${task.project?.name || 'Project'} is past its due date.`
        : `Task "${task.title}" is due in less than 48 hours.`;

      const notif = await Notification.create({
        workspace: task.workspace,
        recipient: task.assignee._id,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        link: `/tasks?filter=my_tasks`
      });

      emitToUser(task.assignee._id, 'notification_new', notif);

      // 3. Update task reminder timestamp
      task.lastReminderSentAt = now;
      await task.save();

      sentCount++;
    }

    return {
      success: true,
      remindersSent: sentCount,
      evaluatedAt: now
    };
  } catch (error) {
    console.error('[Reminder Service Error]:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  checkAndSendDueDateReminders
};
