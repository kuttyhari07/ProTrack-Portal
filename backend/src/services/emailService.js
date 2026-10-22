const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass && user !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporter;
};

/**
 * Base helper to send an HTML email using Resend, Brevo, or SMTP
 */
const sendMail = async ({ to, subject, html, text }) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  // 1. Try Resend HTTP API
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: senderEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || subject
        })
      });

      const data = await response.json();
      if (response.ok && data.id) {
        console.log(`[ProTrack Email] Sent successfully via Resend to ${to}. ID: ${data.id}`);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        console.warn(`[ProTrack Email] Resend API error: ${JSON.stringify(data)}. Falling back to Brevo...`);
      }
    } catch (err) {
      console.warn(`[ProTrack Email] Resend connection failed: ${err.message}. Trying Brevo...`);
    }
  }

  // 2. Try Brevo (Sendinblue) HTTP API
  if (brevoApiKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'ProTrack Platform', email: process.env.ADMIN_EMAIL || 'protrack24@gmail.com' },
          to: Array.isArray(to) ? to.map(t => ({ email: t })) : [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text || subject
        })
      });

      const data = await response.json();
      if (response.ok && (data.messageId || data.messageIds)) {
        console.log(`[ProTrack Email] Sent successfully via Brevo to ${to}. MessageId: ${data.messageId}`);
        return { success: true, provider: 'brevo', messageId: data.messageId };
      } else {
        console.warn(`[ProTrack Email] Brevo API error: ${JSON.stringify(data)}. Trying SMTP...`);
      }
    } catch (err) {
      console.warn(`[ProTrack Email] Brevo connection failed: ${err.message}. Trying SMTP...`);
    }
  }

  // 3. Fallback to Nodemailer SMTP
  const mailClient = getTransporter();
  if (mailClient) {
    try {
      const info = await mailClient.sendMail({
        from: senderEmail,
        to,
        subject,
        text,
        html
      });
      console.log(`[ProTrack Email] Sent successfully via SMTP to ${to}. MessageId: ${info.messageId}`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error(`[ProTrack Email Error] SMTP send failed to ${to}:`, error.message);
    }
  }

  // 4. Dev simulation fallback
  console.log(`[ProTrack Email] [Dev Simulation Mode]
  To: ${to}
  Subject: ${subject}
  Summary: ${text || subject}`);
  return { success: true, simulated: true };
};

/**
 * Send Task Due Date Reminder Email
 */
const sendDueDateReminderEmail = async ({
  recipientEmail,
  recipientName,
  taskTitle,
  projectName,
  dueDate,
  priority = 'medium',
  isOverdue = false
}) => {
  const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'Unspecified';

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const actionUrl = `${clientUrl}/tasks?filter=my_tasks`;

  const priorityColor = {
    urgent: '#DC2626',
    high: '#EA580C',
    medium: '#4F46E5',
    low: '#0D9488'
  }[priority] || '#4F46E5';

  const subject = isOverdue
    ? `⚠️ Overdue Notice: Task "${taskTitle}" in ${projectName}`
    : `⏰ Due Date Reminder: Task "${taskTitle}" is due soon`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F7FB; margin: 0; padding: 24px; color: #172033; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E4E7EC; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #F2F4F7; padding-bottom: 16px; }
        .logo { font-size: 20px; font-weight: 800; color: #172033; }
        .logo span { color: #4F46E5; }
        .badge { display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
        .task-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .btn { display: inline-block; background-color: #4F46E5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; margin-top: 16px; }
        .footer { margin-top: 32px; font-size: 12px; color: #667085; text-align: center; border-top: 1px solid #F2F4F7; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">Pro<span>Track</span></div>
        </div>
        <h2 style="font-size: 18px; margin-top: 0; color: ${isOverdue ? '#DC2626' : '#172033'};">
          ${isOverdue ? '⚠️ Task Past Due Date' : '⏰ Upcoming Task Deadline'}
        </h2>
        <p style="font-size: 14px; line-height: 1.5; color: #475467;">
          Hello <strong>${recipientName || 'Team Member'}</strong>,<br/>
          This is an automated reminder regarding your assigned task in <strong>${projectName}</strong>.
        </p>
        <div class="task-box">
          <div style="margin-bottom: 8px;">
            <span class="badge" style="background-color: ${priorityColor}15; color: ${priorityColor};">
              ${priority.toUpperCase()} PRIORITY
            </span>
          </div>
          <h3 style="font-size: 16px; margin: 6px 0; color: #0F172A;">${taskTitle}</h3>
          <p style="font-size: 13px; margin: 4px 0; color: #64748B;">
            <strong>Target Deadline:</strong> ${formattedDate}
          </p>
          <p style="font-size: 13px; margin: 4px 0; color: ${isOverdue ? '#DC2626' : '#475467'}; font-weight: 600;">
            ${isOverdue ? 'Status: Overdue — Please update task progress immediately' : 'Status: Due within 24-48 hours'}
          </p>
        </div>
        <p style="font-size: 14px; color: #475467;">
          Please log into ProTrack to update your progress percentage, leave a status update comment, or mark the task complete.
        </p>
        <a href="${actionUrl}" class="btn">View & Update Task in ProTrack</a>
        <div class="footer">
          You received this email because you are assigned to this deliverable on ProTrack.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    text: `Reminder: Task "${taskTitle}" in ${projectName} is ${isOverdue ? 'OVERDUE' : 'due on ' + formattedDate}. View task: ${actionUrl}`
  });
};

/**
 * Send Task Assigned Email
 */
const sendTaskAssignedEmail = async ({
  recipientEmail,
  recipientName,
  taskTitle,
  projectName,
  assignerName,
  dueDate,
  priority = 'medium'
}) => {
  const formattedDate = dueDate ? new Date(dueDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }) : 'No deadline specified';

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const actionUrl = `${clientUrl}/tasks?filter=my_tasks`;

  const subject = `📋 New Task Assigned: "${taskTitle}" in ${projectName}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F7FB; padding: 24px; color: #172033; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E4E7EC; padding: 32px; }
        .btn { display: inline-block; background-color: #4F46E5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="font-size: 18px; color: #172033;">📋 New Task Assigned</h2>
        <p style="font-size: 14px; color: #475467;">
          Hello <strong>${recipientName}</strong>,<br/>
          <strong>${assignerName}</strong> has assigned you to a new task in <strong>${projectName}</strong>.
        </p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="font-size: 16px; margin: 0 0 8px 0; color: #0F172A;">${taskTitle}</h3>
          <p style="font-size: 13px; margin: 4px 0; color: #64748B;"><strong>Priority:</strong> ${priority.toUpperCase()}</p>
          <p style="font-size: 13px; margin: 4px 0; color: #64748B;"><strong>Deadline:</strong> ${formattedDate}</p>
        </div>
        <a href="${actionUrl}" class="btn">Open Task Dashboard</a>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    text: `${assignerName} assigned you to task "${taskTitle}" in ${projectName}. Deadline: ${formattedDate}. Open task: ${actionUrl}`
  });
};

/**
 * Send Workspace Invitation Email
 */
const sendWorkspaceInvitationEmail = async ({
  recipientEmail,
  workspaceName,
  role = 'Member',
  inviterName = 'Project Lead',
  inviteLink
}) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const joinUrl = inviteLink || `${clientUrl}/auth/register?type=member`;

  const subject = `🎉 You've been invited to join ${workspaceName} on ProTrack`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F5F7FB; padding: 24px; color: #172033; }
        .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E4E7EC; padding: 32px; }
        .btn { display: inline-block; background-color: #4F46E5; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="font-size: 18px; color: #172033;">Workspace Invitation</h2>
        <p style="font-size: 14px; color: #475467;">
          Hello,<br/>
          <strong>${inviterName}</strong> has invited you to collaborate in the workspace <strong>${workspaceName}</strong> as a <strong>${role}</strong>.
        </p>
        <p style="font-size: 14px; color: #475467;">
          You will be able to view assigned projects, deliver tasks, update progress milestones, and collaborate in real time.
        </p>
        <a href="${joinUrl}" class="btn">Join Workspace on ProTrack</a>
      </div>
    </body>
    </html>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html,
    text: `You have been invited by ${inviterName} to join ${workspaceName} on ProTrack as a ${role}. Join here: ${joinUrl}`
  });
};

module.exports = {
  sendMail,
  sendDueDateReminderEmail,
  sendTaskAssignedEmail,
  sendWorkspaceInvitationEmail
};
