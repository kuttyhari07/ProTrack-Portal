const Workspace = require('../models/Workspace');

/**
 * Send Slack Notification via Incoming Webhook
 */
const sendSlackNotification = async (webhookUrl, { title, message, fields = [] }) => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const slackFields = fields.map((f) => ({
      type: 'mrkdwn',
      text: `*${f.name}:*\n${f.value}`
    }));

    const payload = {
      text: `*${title}*\n${message}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🚀 ProTrack Alert: ${title.slice(0, 80)}`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    };

    if (slackFields.length > 0) {
      payload.blocks.push({
        type: 'section',
        fields: slackFields.slice(0, 10)
      });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.warn('[Slack Webhook Error]:', err.message);
    return false;
  }
};

/**
 * Send Discord Notification via Incoming Webhook
 */
const sendDiscordNotification = async (webhookUrl, { title, message, color = 5178613, fields = [] }) => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

  try {
    const discordFields = fields.map((f) => ({
      name: f.name,
      value: f.value,
      inline: true
    }));

    const payload = {
      username: 'ProTrack Hub',
      avatar_url: 'https://img.icons8.com/fluency/96/project-management.png',
      embeds: [
        {
          title: `🚀 ${title}`,
          description: message,
          color, // e.g. 0x4F46E5 = 5195493
          fields: discordFields,
          footer: {
            text: 'ProTrack SaaS Event Dispatcher'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.warn('[Discord Webhook Error]:', err.message);
    return false;
  }
};

/**
 * Dispatch alert to configured Slack/Discord webhooks in a workspace
 */
const dispatchWorkspaceAlert = async (workspaceId, { type, title, message, color, fields = [] }) => {
  try {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace || !workspace.integrations) return;

    const {
      slackWebhookUrl,
      discordWebhookUrl,
      notifyOnTaskCompleted = true,
      notifyOnCriticalIssue = true,
      notifyOnMilestone = true
    } = workspace.integrations;

    if (type === 'task_completed' && !notifyOnTaskCompleted) return;
    if (type === 'critical_issue' && !notifyOnCriticalIssue) return;
    if (type === 'milestone_completed' && !notifyOnMilestone) return;

    const promises = [];
    if (slackWebhookUrl) {
      promises.push(sendSlackNotification(slackWebhookUrl, { title, message, fields }));
    }
    if (discordWebhookUrl) {
      promises.push(sendDiscordNotification(discordWebhookUrl, { title, message, color, fields }));
    }

    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  } catch (err) {
    console.warn('[Dispatch Alert Error]:', err.message);
  }
};

module.exports = {
  sendSlackNotification,
  sendDiscordNotification,
  dispatchWorkspaceAlert
};

