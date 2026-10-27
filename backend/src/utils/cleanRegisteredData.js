const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEMO_EMAILS = [
  'alex@protrack.dev',
  'elena@protrack.dev',
  'marcus@protrack.dev',
  'sophia@protrack.dev',
  'david@protrack.dev'
];

async function cleanRegisteredData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/protrack';
    await mongoose.connect(mongoUri);
    console.log('[Clean] Connected to MongoDB at', mongoUri);

    const db = mongoose.connection.db;

    // 1. Identify non-demo registered users
    const registeredUsers = await db.collection('users').find({
      email: { $nin: DEMO_EMAILS }
    }).toArray();

    const regUserIds = registeredUsers.map(u => u._id);
    console.log(`[Clean] Found ${registeredUsers.length} registered non-demo user(s):`);
    registeredUsers.forEach(u => console.log(` - ${u.name} (${u.email}) [ID: ${u._id}]`));

    if (regUserIds.length === 0) {
      console.log('[Clean] No registered non-demo users found.');
    }

    // 2. Identify workspaces owned by these users (or not Acme Technologies)
    const seedWorkspace = await db.collection('workspaces').findOne({ slug: 'acme-technologies' });
    const seedWorkspaceId = seedWorkspace ? seedWorkspace._id : null;

    const registeredWorkspaces = await db.collection('workspaces').find({
      $or: [
        { owner: { $in: regUserIds } },
        ...(seedWorkspaceId ? [{ _id: { $ne: seedWorkspaceId } }] : [])
      ]
    }).toArray();
    const regWorkspaceIds = registeredWorkspaces.map(w => w._id);
    console.log(`[Clean] Found ${registeredWorkspaces.length} registered workspace(s):`);
    registeredWorkspaces.forEach(w => console.log(` - ${w.name} [ID: ${w._id}]`));

    // 3. Identify projects owned by registered users or belonging to registered workspaces
    const registeredProjects = await db.collection('projects').find({
      $or: [
        { owner: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } }
      ]
    }).toArray();
    const regProjectIds = registeredProjects.map(p => p._id);
    console.log(`[Clean] Found ${registeredProjects.length} registered project(s):`);
    registeredProjects.forEach(p => console.log(` - ${p.name} [ID: ${p._id}]`));

    // 4. Delete Payments
    const payRes = await db.collection('payments').deleteMany({
      $or: [
        { user: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } },
        { project: { $in: regProjectIds } }
      ]
    });
    console.log(`[Clean] Deleted ${payRes.deletedCount} payment(s).`);

    // 5. Delete Memberships
    const memRes = await db.collection('memberships').deleteMany({
      $or: [
        { user: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } },
        { user: { $nin: (await db.collection('users').find({}).toArray()).map(u => u._id) } },
        { workspace: { $nin: (await db.collection('workspaces').find({}).toArray()).map(w => w._id) } }
      ]
    });
    console.log(`[Clean] Deleted ${memRes.deletedCount} membership(s).`);

    // 6. Delete Tasks
    const taskRes = await db.collection('tasks').deleteMany({
      $or: [
        { project: { $in: regProjectIds } },
        { workspace: { $in: regWorkspaceIds } },
        { creator: { $in: regUserIds } },
        { assignee: { $in: regUserIds } }
      ]
    });
    console.log(`[Clean] Deleted ${taskRes.deletedCount} task(s).`);

    // 7. Delete Milestones
    const mileRes = await db.collection('milestones').deleteMany({
      $or: [
        { project: { $in: regProjectIds } },
        { workspace: { $in: regWorkspaceIds } },
        { createdBy: { $in: regUserIds } }
      ]
    });
    console.log(`[Clean] Deleted ${mileRes.deletedCount} milestone(s).`);

    // 8. Delete Issues
    const issueRes = await db.collection('issues').deleteMany({
      $or: [
        { project: { $in: regProjectIds } },
        { workspace: { $in: regWorkspaceIds } },
        { reporter: { $in: regUserIds } },
        { assignee: { $in: regUserIds } }
      ]
    });
    console.log(`[Clean] Deleted ${issueRes.deletedCount} issue(s).`);

    // 9. Delete Documents
    const docRes = await db.collection('documents').deleteMany({
      $or: [
        { project: { $in: regProjectIds } },
        { workspace: { $in: regWorkspaceIds } },
        { uploader: { $in: regUserIds } }
      ]
    });
    console.log(`[Clean] Deleted ${docRes.deletedCount} document(s).`);

    // 10. Delete Activity Logs
    const actRes = await db.collection('activitylogs').deleteMany({
      $or: [
        { user: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } },
        { project: { $in: regProjectIds } }
      ]
    });
    console.log(`[Clean] Deleted ${actRes.deletedCount} activity log(s).`);

    // 11. Delete Notifications
    const notifRes = await db.collection('notifications').deleteMany({
      $or: [
        { recipient: { $in: regUserIds } },
        { sender: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } }
      ]
    });
    console.log(`[Clean] Deleted ${notifRes.deletedCount} notification(s).`);

    // 12. Delete Invitations
    const invRes = await db.collection('invitations').deleteMany({
      $or: [
        { inviter: { $in: regUserIds } },
        { workspace: { $in: regWorkspaceIds } }
      ]
    });
    console.log(`[Clean] Deleted ${invRes.deletedCount} invitation(s).`);

    // 13. Delete test feedbacks if any
    const feedRes = await db.collection('feedbacks').deleteMany({
      $or: [
        { user: { $in: regUserIds } },
        { email: 'testuser@example.com' }
      ]
    });
    console.log(`[Clean] Deleted ${feedRes.deletedCount} feedback(s).`);

    // 14. Delete Projects
    const prjRes = await db.collection('projects').deleteMany({
      _id: { $in: regProjectIds }
    });
    console.log(`[Clean] Deleted ${prjRes.deletedCount} project(s).`);

    // 15. Delete Workspaces
    const wsRes = await db.collection('workspaces').deleteMany({
      _id: { $in: regWorkspaceIds }
    });
    console.log(`[Clean] Deleted ${wsRes.deletedCount} workspace(s).`);

    // 16. Delete Users
    const userRes = await db.collection('users').deleteMany({
      _id: { $in: regUserIds }
    });
    console.log(`[Clean] Deleted ${userRes.deletedCount} registered user(s).`);

    // Also clean up any member references inside remaining demo projects or demo workspaces
    if (seedWorkspaceId) {
      await db.collection('projects').updateMany(
        { workspace: seedWorkspaceId },
        { $pull: { members: { user: { $in: regUserIds } } } }
      );
    }

    console.log('\n=============================================');
    console.log('[Clean] Cleanup completed successfully!');
    console.log('=============================================');

    // Show final status
    const remainingUsers = await db.collection('users').find({}).toArray();
    console.log(`\nRemaining users in database (${remainingUsers.length}):`);
    remainingUsers.forEach(u => console.log(` - ${u.name} (${u.email})`));

    const remainingWorkspaces = await db.collection('workspaces').find({}).toArray();
    console.log(`\nRemaining workspaces (${remainingWorkspaces.length}):`);
    remainingWorkspaces.forEach(w => console.log(` - ${w.name}`));

    const remainingProjects = await db.collection('projects').find({}).toArray();
    console.log(`\nRemaining projects (${remainingProjects.length}):`);
    remainingProjects.forEach(p => console.log(` - ${p.name}`));

    process.exit(0);
  } catch (error) {
    console.error('[Clean Error]:', error);
    process.exit(1);
  }
}

cleanRegisteredData();
