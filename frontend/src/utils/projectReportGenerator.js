import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format date helper
 */
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Normalize and extract report data
 */
export const extractReportData = (rawReport) => {
  const project = rawReport.project || {};
  const tasks = rawReport.tasks || [];
  const milestones = rawReport.milestones || [];
  const issues = rawReport.issues || [];
  const workspace = rawReport.workspace || {};
  const generatedBy = rawReport.generatedBy || {};
  const stats = rawReport.stats || {};
  const healthData = rawReport.healthData || project.healthEvaluation || {};

  const totalTasks = tasks.length || stats.totalTasks || 0;
  const completedTasks = stats.completedTasks ?? tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = stats.inProgressTasks ?? tasks.filter((t) => t.status === 'in_progress').length;
  const inReviewTasks = stats.inReviewTasks ?? tasks.filter((t) => t.status === 'in_review').length;
  const todoTasks = stats.todoTasks ?? tasks.filter((t) => t.status === 'todo').length;
  const overdueTasksCount = stats.overdueTasksCount ?? tasks.filter((t) => {
    return t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed';
  }).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);

  return {
    project,
    tasks,
    milestones,
    issues,
    workspace,
    generatedBy,
    healthData,
    stats: {
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
      overdueTasksCount,
      completionRate
    }
  };
};

/**
 * Generate and download high-resolution PDF Project Report
 */
export const downloadProjectReportPDF = (rawReport) => {
  const data = extractReportData(rawReport);
  const { project, tasks, milestones, issues, workspace, generatedBy, healthData, stats } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // 1. BRAND HEADER BANNER
  doc.setFillColor(30, 27, 75); // Deep Indigo #1E1B4B
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent line
  doc.setFillColor(79, 70, 229); // Indigo #4F46E5
  doc.rect(0, 26.5, pageWidth, 1.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PROTRACK', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text('EXECUTIVE PROJECT STATUS & PROGRESS INTELLIGENCE REPORT', margin, 18);

  // Project Code Badge in Header
  const codeBadge = `[ ${project.projectCode || 'PROJECT'} ]`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(codeBadge, pageWidth - margin - doc.getTextWidth(codeBadge), 13);

  // Date in Header
  const dateStr = formatDate(new Date());
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(224, 231, 255);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - doc.getTextWidth(`Generated: ${dateStr}`), 19);

  currentY = 34;

  // 2. PROJECT TITLE & METADATA SECTION
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(project.name || 'Untitled Project', margin, currentY);
  currentY += 6;

  if (project.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    const splitDesc = doc.splitTextToSize(project.description, pageWidth - margin * 2);
    doc.text(splitDesc.slice(0, 3), margin, currentY);
    currentY += splitDesc.slice(0, 3).length * 4 + 2;
  } else {
    currentY += 2;
  }

  // Key-value metadata card
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 24, 2, 2, 'FD');

  const colWidth = (pageWidth - margin * 2) / 4;
  const metaY = currentY + 5;

  // Col 1: Status & Health
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('STATUS & HEALTH', margin + 4, metaY);
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  const statusFormatted = (project.status || 'Active').toUpperCase();
  const healthFormatted = (project.health || 'On Track').replace('_', ' ').toUpperCase();
  doc.text(`${statusFormatted} | ${healthFormatted}`, margin + 4, metaY + 6);
  doc.setFontSize(8);
  doc.setTextColor(79, 70, 229);
  doc.text(`Priority: ${(project.priority || 'Medium').toUpperCase()}`, margin + 4, metaY + 12);

  // Col 2: Timeline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TIMELINE DATES', margin + colWidth + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.text(`Start: ${formatDate(project.startDate || project.createdAt)}`, margin + colWidth + 4, metaY + 6);
  doc.text(`Due: ${formatDate(project.dueDate)}`, margin + colWidth + 4, metaY + 12);

  // Col 3: Leadership & Team
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJECT LEAD / OWNER', margin + colWidth * 2 + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  const ownerName = project.owner?.name || 'Assigned Lead';
  doc.text(ownerName, margin + colWidth * 2 + 4, metaY + 6);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${(project.members?.length || 0)} Team Contributors`, margin + colWidth * 2 + 4, metaY + 12);

  // Col 4: Workspace & Financial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('WORKSPACE & BUDGET', margin + colWidth * 3 + 4, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 24, 39);
  doc.text(workspace.name || 'ProTrack HQ', margin + colWidth * 3 + 4, metaY + 6);
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`₹${project.paymentAmount || 499} Paid & Verified`, margin + colWidth * 3 + 4, metaY + 12);

  currentY += 28;

  // 3. PROGRESS & KPI DASHBOARD
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 27, 75);
  doc.text('PROJECT PROGRESS & KPI METRICS', margin, currentY);
  currentY += 4;

  // Visual Progress Bar
  const pBarWidth = pageWidth - margin * 2;
  const pBarHeight = 5;
  doc.setFillColor(229, 231, 235); // Gray-200
  doc.roundedRect(margin, currentY, pBarWidth, pBarHeight, 1.5, 1.5, 'F');

  const fillWidth = Math.max(2, (pBarWidth * Math.min(100, Math.max(0, stats.completionRate))) / 100);
  doc.setFillColor(79, 70, 229); // Indigo
  doc.roundedRect(margin, currentY, fillWidth, pBarHeight, 1.5, 1.5, 'F');
  currentY += 8;

  // 4 KPI Summary Cards
  const kpiWidth = (pageWidth - margin * 2 - 9) / 4;
  const kpis = [
    { label: 'Overall Completion', value: `${stats.completionRate}%`, sub: `${stats.completedTasks}/${stats.totalTasks} Tasks Done`, color: [79, 70, 229] },
    { label: 'Tasks in Progress', value: `${stats.inProgressTasks + stats.inReviewTasks}`, sub: `${stats.inProgressTasks} active, ${stats.inReviewTasks} review`, color: [245, 158, 11] },
    { label: 'Overdue Tasks', value: `${stats.overdueTasksCount}`, sub: stats.overdueTasksCount > 0 ? 'Requires attention' : 'All on track', color: stats.overdueTasksCount > 0 ? [239, 68, 68] : [16, 185, 129] },
    { label: 'Milestones & Issues', value: `${milestones.length} / ${issues.length}`, sub: `${issues.filter(i => i.status !== 'closed').length} open issues`, color: [59, 130, 246] }
  ];

  kpis.forEach((kpi, idx) => {
    const kpiX = margin + idx * (kpiWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(kpiX, currentY, kpiWidth, 16, 1.5, 1.5, 'FD');

    // Colored left border accent
    doc.setFillColor(...kpi.color);
    doc.rect(kpiX, currentY, 1.5, 16, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), kpiX + 3.5, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(kpi.value, kpiX + 3.5, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(kpi.sub, kpiX + 3.5, currentY + 14);
  });

  currentY += 20;

  // 4. TASKS BREAKDOWN TABLE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 27, 75);
  doc.text(`TASK INVENTORY BREAKDOWN (${tasks.length})`, margin, currentY);
  currentY += 2;

  const taskRows = tasks.map((t, idx) => [
    idx + 1,
    t.title || 'Untitled Task',
    (t.status || 'todo').replace('_', ' ').toUpperCase(),
    (t.priority || 'medium').toUpperCase(),
    t.assignee?.name || 'Unassigned',
    formatDate(t.dueDate),
    `${t.progress || (t.status === 'completed' ? 100 : 0)}%`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Task Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Progress']],
    body: taskRows.length > 0 ? taskRows : [['-', 'No tasks created yet', '-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [31, 41, 55],
      lineColor: [229, 231, 235],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [67, 56, 202], // Indigo-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 },
      5: { cellWidth: 24 },
      6: { cellWidth: 16, halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 5. MILESTONES TABLE
  if (milestones.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`MILESTONES & TARGET DEADLINES (${milestones.length})`, margin, currentY);
    currentY += 2;

    const milestoneRows = milestones.map((m, idx) => [
      idx + 1,
      m.title || 'Untitled',
      formatDate(m.dueDate),
      (m.status || 'upcoming').toUpperCase(),
      m.description || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Milestone', 'Target Date', 'Status', 'Description']],
      body: milestoneRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [31, 41, 55]
      },
      headStyles: {
        fillColor: [30, 41, 59], // Slate-800
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 6. ISSUES & RISKS TABLE (IF ANY)
  if (issues.length > 0) {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 27, 75);
    doc.text(`RISK & ISSUE REGISTER (${issues.length})`, margin, currentY);
    currentY += 2;

    const issueRows = issues.map((iss, idx) => [
      idx + 1,
      iss.title || 'Untitled Issue',
      (iss.priority || 'medium').toUpperCase(),
      (iss.category || 'task').toUpperCase(),
      (iss.status || 'open').toUpperCase(),
      iss.assignee?.name || 'Unassigned'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Issue Summary', 'Severity', 'Category', 'Status', 'Owner']],
      body: issueRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [31, 41, 55]
      },
      headStyles: {
        fillColor: [185, 28, 28], // Red-700
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 35 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 7. TEAM CONTRIBUTORS TABLE
  if (project.members && project.members.length > 0) {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 27, 75);
    doc.text('PROJECT TEAM & ROLES', margin, currentY);
    currentY += 2;

    const memberRows = project.members.map((m, idx) => [
      idx + 1,
      m.user?.name || 'User',
      m.user?.email || '-',
      m.role || 'Contributor'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Contributor Name', 'Email Address', 'Assigned Role']],
      body: memberRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        textColor: [31, 41, 55]
      },
      headStyles: {
        fillColor: [55, 65, 81], // Gray-700
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 55 },
        2: { cellWidth: 65 },
        3: { cellWidth: 50 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // 8. HEALTH & AI SUMMARY (IF AVAILABLE)
  if (healthData && healthData.healthSummary) {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(238, 242, 255); // Indigo-50
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(67, 56, 202);
    doc.text('AUTOMATED HEALTH & RISK ASSESSMENT', margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(31, 41, 55);
    const splitHealth = doc.splitTextToSize(healthData.healthSummary, pageWidth - margin * 2 - 8);
    doc.text(splitHealth.slice(0, 3), margin + 4, currentY + 10);

    currentY += 24;
  }

  // 9. FOOTER WITH PAGE NUMBERS & CONFIDENTIALITY ON ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `ProTrack Portal - Confidential Project Report | Generated by ${generatedBy.name || 'Manager'} (${generatedBy.role || 'Admin'})`,
      margin,
      pageHeight - 8
    );

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 8);
  }

  // Download PDF file
  const fileName = `ProTrack_Report_${project.projectCode || 'PROJECT'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Generate and download formatted Microsoft Word compatible DOC Report
 */
export const downloadProjectReportDOC = (rawReport) => {
  const data = extractReportData(rawReport);
  const { project, tasks, milestones, issues, workspace, generatedBy, healthData, stats } = data;

  const dateStr = formatDate(new Date());

  const tasksTableRows = tasks.map((t, idx) => `
    <tr>
      <td style="text-align:center; padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; font-weight: bold;">${t.title || 'Untitled'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; text-transform: uppercase;">${(t.status || 'todo').replace('_', ' ')}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; text-transform: uppercase;">${t.priority || 'medium'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${t.assignee?.name || 'Unassigned'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${formatDate(t.dueDate)}</td>
      <td style="text-align:center; padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${t.progress || (t.status === 'completed' ? 100 : 0)}%</td>
    </tr>
  `).join('');

  const milestonesRows = milestones.map((m, idx) => `
    <tr>
      <td style="text-align:center; padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; font-weight: bold;">${m.title || 'Untitled'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${formatDate(m.dueDate)}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; text-transform: uppercase;">${m.status || 'upcoming'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${m.description || '-'}</td>
    </tr>
  `).join('');

  const issuesRows = issues.map((iss, idx) => `
    <tr>
      <td style="text-align:center; padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; font-weight: bold;">${iss.title || 'Untitled'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; color: #DC2626; font-weight: bold;">${(iss.priority || 'medium').toUpperCase()}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${(iss.category || 'task').toUpperCase()}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${(iss.status || 'open').toUpperCase()}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${iss.assignee?.name || 'Unassigned'}</td>
    </tr>
  `).join('');

  const membersRows = (project.members || []).map((m, idx) => `
    <tr>
      <td style="text-align:center; padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${idx + 1}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt; font-weight: bold;">${m.user?.name || 'Member'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${m.user?.email || '-'}</td>
      <td style="padding: 6px; border: 1px solid #D1D5DB; font-size: 10pt;">${m.role || 'Contributor'}</td>
    </tr>
  `).join('');

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${project.name} - Executive Project Report</title>
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 0.8in 0.8in 0.8in 0.8in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-paper-source: 0;
        }
        div.Section1 {
          page: Section1;
          font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
          font-size: 11pt;
          color: #1F2937;
        }
        h1 { color: #1E1B4B; font-size: 22pt; margin: 0 0 6px 0; }
        h2 { color: #4338CA; font-size: 14pt; border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; }
        h3 { color: #374151; font-size: 12pt; margin-top: 12px; margin-bottom: 4px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th { background-color: #4F46E5; color: #FFFFFF; font-weight: bold; text-align: left; padding: 7px; border: 1px solid #4338CA; font-size: 10pt; }
        .meta-table td { padding: 6px; font-size: 10pt; border: 1px solid #E5E7EB; }
        .meta-header { background-color: #F3F4F6; font-weight: bold; width: 22%; color: #4B5563; }
        .stat-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #4F46E5; padding: 10px; width: 24%; vertical-align: top; }
        .badge { display: inline-block; padding: 2px 8px; font-weight: bold; font-size: 9pt; border-radius: 4px; }
        .footer-note { font-size: 9pt; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 8px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <!-- HEADER BANNER -->
        <table style="width: 100%; margin-bottom: 12px;">
          <tr>
            <td style="vertical-align: middle;">
              <span style="font-size: 20pt; font-weight: bold; color: #4F46E5;">PROTRACK</span>
              <span style="font-size: 10pt; color: #6B7280; display: block;">Executive Project Status & Progress Report</span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-size: 14pt; font-family: monospace; font-weight: bold; color: #1E1B4B; background: #EEF2FF; padding: 4px 10px; border: 1px solid #C7D2FE;">${project.projectCode || 'PRJ'}</span>
              <div style="font-size: 9pt; color: #6B7280; margin-top: 4px;">Date: ${dateStr}</div>
            </td>
          </tr>
        </table>

        <!-- TITLE & OVERVIEW -->
        <h1>${project.name || 'Project Report'}</h1>
        <p style="font-size: 11pt; color: #4B5563; margin-top: 0; margin-bottom: 16px;">
          ${project.description || 'No detailed project description recorded.'}
        </p>

        <!-- PROJECT METADATA GRID -->
        <h2>Project Information & Parameters</h2>
        <table class="meta-table">
          <tr>
            <td class="meta-header">Workspace</td>
            <td>${workspace.name || 'ProTrack Workspace'}</td>
            <td class="meta-header">Overall Status</td>
            <td style="font-weight: bold; color: #4F46E5;">${(project.status || 'Active').toUpperCase()}</td>
          </tr>
          <tr>
            <td class="meta-header">Health Indicator</td>
            <td style="font-weight: bold;">${(project.health || 'On Track').replace('_', ' ').toUpperCase()}</td>
            <td class="meta-header">Priority Level</td>
            <td style="font-weight: bold;">${(project.priority || 'Medium').toUpperCase()}</td>
          </tr>
          <tr>
            <td class="meta-header">Project Lead</td>
            <td>${project.owner?.name || 'Assigned Lead'} (${project.owner?.email || '-'})</td>
            <td class="meta-header">Team Size</td>
            <td>${(project.members?.length || 0)} Contributors</td>
          </tr>
          <tr>
            <td class="meta-header">Start Date</td>
            <td>${formatDate(project.startDate || project.createdAt)}</td>
            <td class="meta-header">Target Due Date</td>
            <td>${formatDate(project.dueDate)}</td>
          </tr>
          <tr>
            <td class="meta-header">Payment & Budget</td>
            <td>₹${project.paymentAmount || 499} Paid & Verified</td>
            <td class="meta-header">Report Generated By</td>
            <td>${generatedBy.name || 'User'} (${generatedBy.role || 'Member'})</td>
          </tr>
        </table>

        <!-- PROGRESS & KPI SUMMARY -->
        <h2>Status & Execution Progress</h2>
        <div style="margin-bottom: 12px;">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 4px;">Overall Completion Rate: ${stats.completionRate}%</div>
          <table style="width: 100%; border-collapse: collapse; height: 16px;">
            <tr>
              <td style="width: ${stats.completionRate}%; background-color: #4F46E5; height: 16px;"></td>
              <td style="width: ${100 - stats.completionRate}%; background-color: #E5E7EB; height: 16px;"></td>
            </tr>
          </table>
        </div>

        <table>
          <tr>
            <td class="stat-box">
              <div style="font-size: 9pt; color: #6B7280;">TOTAL TASKS</div>
              <div style="font-size: 18pt; font-weight: bold; color: #111827;">${stats.totalTasks}</div>
              <div style="font-size: 9pt; color: #10B981;">${stats.completedTasks} Completed (${stats.completionRate}%)</div>
            </td>
            <td class="stat-box" style="border-left-color: #F59E0B;">
              <div style="font-size: 9pt; color: #6B7280;">ACTIVE WORK</div>
              <div style="font-size: 18pt; font-weight: bold; color: #111827;">${stats.inProgressTasks + stats.inReviewTasks}</div>
              <div style="font-size: 9pt; color: #6B7280;">${stats.inProgressTasks} in progress, ${stats.inReviewTasks} in review</div>
            </td>
            <td class="stat-box" style="border-left-color: ${stats.overdueTasksCount > 0 ? '#EF4444' : '#10B981'};">
              <div style="font-size: 9pt; color: #6B7280;">OVERDUE TASKS</div>
              <div style="font-size: 18pt; font-weight: bold; color: ${stats.overdueTasksCount > 0 ? '#EF4444' : '#10B981'};">${stats.overdueTasksCount}</div>
              <div style="font-size: 9pt; color: #6B7280;">${stats.overdueTasksCount > 0 ? 'Action needed' : 'All deadlines met'}</div>
            </td>
            <td class="stat-box" style="border-left-color: #3B82F6;">
              <div style="font-size: 9pt; color: #6B7280;">MILESTONES & ISSUES</div>
              <div style="font-size: 18pt; font-weight: bold; color: #111827;">${milestones.length} / ${issues.length}</div>
              <div style="font-size: 9pt; color: #6B7280;">${issues.filter(i => i.status !== 'closed').length} open blockers</div>
            </td>
          </tr>
        </table>

        <!-- TASKS INVENTORY -->
        <h2>Task Inventory & Details (${tasks.length})</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 35%;">Task Title</th>
              <th style="width: 14%;">Status</th>
              <th style="width: 12%;">Priority</th>
              <th style="width: 16%;">Assignee</th>
              <th style="width: 12%;">Due Date</th>
              <th style="width: 6%; text-align: center;">%</th>
            </tr>
          </thead>
          <tbody>
            ${tasksTableRows || '<tr><td colspan="7" style="padding:10px; text-align:center;">No tasks registered yet.</td></tr>'}
          </tbody>
        </table>

        <!-- MILESTONES -->
        ${milestones.length > 0 ? `
          <h2>Milestones & Key Target Dates (${milestones.length})</h2>
          <table>
            <thead>
              <tr style="background-color: #1E293B;">
                <th style="width: 5%; text-align: center; background-color: #1E293B;">#</th>
                <th style="width: 30%; background-color: #1E293B;">Milestone Title</th>
                <th style="width: 15%; background-color: #1E293B;">Target Date</th>
                <th style="width: 15%; background-color: #1E293B;">Status</th>
                <th style="width: 35%; background-color: #1E293B;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${milestonesRows}
            </tbody>
          </table>
        ` : ''}

        <!-- ISSUES & RISKS -->
        ${issues.length > 0 ? `
          <h2>Risk & Issue Register (${issues.length})</h2>
          <table>
            <thead>
              <tr style="background-color: #B91C1C;">
                <th style="width: 5%; text-align: center; background-color: #B91C1C;">#</th>
                <th style="width: 35%; background-color: #B91C1C;">Issue Summary</th>
                <th style="width: 15%; background-color: #B91C1C;">Severity</th>
                <th style="width: 15%; background-color: #B91C1C;">Category</th>
                <th style="width: 15%; background-color: #B91C1C;">Status</th>
                <th style="width: 15%; background-color: #B91C1C;">Assignee</th>
              </tr>
            </thead>
            <tbody>
              ${issuesRows}
            </tbody>
          </table>
        ` : ''}

        <!-- TEAM MEMBERS -->
        ${(project.members && project.members.length > 0) ? `
          <h2>Assigned Project Contributors (${project.members.length})</h2>
          <table>
            <thead>
              <tr style="background-color: #374151;">
                <th style="width: 5%; text-align: center; background-color: #374151;">#</th>
                <th style="width: 35%; background-color: #374151;">Contributor Name</th>
                <th style="width: 35%; background-color: #374151;">Email</th>
                <th style="width: 25%; background-color: #374151;">Role</th>
              </tr>
            </thead>
            <tbody>
              ${membersRows}
            </tbody>
          </table>
        ` : ''}

        <!-- HEALTH & AI RECOMMENDATIONS -->
        ${healthData && healthData.healthSummary ? `
          <h2>Automated Health & Risk Assessment</h2>
          <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 12px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 10.5pt; color: #1E1B4B;">${healthData.healthSummary}</p>
          </div>
        ` : ''}

        <!-- FOOTER -->
        <div class="footer-note">
          <p style="margin: 0;">
            This executive document was automatically generated by <strong>ProTrack SaaS Portal</strong> for 
            ${project.name} (${project.projectCode}). Confidential information intended solely for internal leadership, 
            Project Managers, Owners, and Workspace Administrators.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName = `ProTrack_Report_${project.projectCode || 'PROJECT'}_${new Date().toISOString().slice(0, 10)}.doc`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return fileName;
};
