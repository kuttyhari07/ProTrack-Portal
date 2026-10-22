const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../../.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/protrack';

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('[Clean] Connected to MongoDB...');

    const db = mongoose.connection.db;

    // Find the test users
    const targetEmails = ['hariharangmhk0429@gmail.com', 'kiruthi8759@gmail.com'];
    const users = await db.collection('users').find({ email: { $in: targetEmails } }).toArray();

    if (users.length === 0) {
      console.log('[Clean] No test users found with emails:', targetEmails);
      await mongoose.disconnect();
      return;
    }

    const userIds = users.map(u => u._id);
    console.log('[Clean] Target user IDs to delete:', userIds);

    // Find workspaces owned by these users
    const workspaces = await db.collection('workspaces').find({ owner: { $in: userIds } }).toArray();
    const workspaceIds = workspaces.map(w => w._id);
    console.log('[Clean] Target workspace IDs:', workspaceIds);

    // Find projects in these workspaces or owned by these users
    const projects = await db.collection('projects').find({
      $or: [
        { workspace: { $in: workspaceIds } },
        { owner: { $in: userIds } }
      ]
    }).toArray();
    const projectIds = projects.map(p => p._id);
    console.log('[Clean] Target project IDs:', projectIds);

    // 1. Delete Tasks
    const taskRes = await db.collection('tasks').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { project: { $in: projectIds } },
        { creator: { $in: userIds } },
        { assignee: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted tasks: ${taskRes.deletedCount}`);

    // 2. Delete Milestones
    const milestoneRes = await db.collection('milestones').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { project: { $in: projectIds } },
        { createdBy: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted milestones: ${milestoneRes.deletedCount}`);

    // 3. Delete Issues
    const issueRes = await db.collection('issues').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { project: { $in: projectIds } },
        { reporter: { $in: userIds } },
        { assignee: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted issues: ${issueRes.deletedCount}`);

    // 4. Delete Documents
    const docRes = await db.collection('documents').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { project: { $in: projectIds } },
        { uploader: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted documents: ${docRes.deletedCount}`);

    // 5. Delete ActivityLogs
    const logRes = await db.collection('activitylogs').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { project: { $in: projectIds } },
        { user: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted activity logs: ${logRes.deletedCount}`);

    // 6. Delete Notifications
    const notifRes = await db.collection('notifications').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { recipient: { $in: userIds } },
        { sender: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted notifications: ${notifRes.deletedCount}`);

    // 7. Delete Invitations
    const inviteRes = await db.collection('invitations').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { invitedBy: { $in: userIds } },
        { email: { $in: targetEmails } }
      ]
    });
    console.log(`[Clean] Deleted invitations: ${inviteRes.deletedCount}`);

    // 8. Delete Memberships
    const memRes = await db.collection('memberships').deleteMany({
      $or: [
        { workspace: { $in: workspaceIds } },
        { user: { $in: userIds } }
      ]
    });
    console.log(`[Clean] Deleted memberships: ${memRes.deletedCount}`);

    // 9. Delete Projects
    const projRes = await db.collection('projects').deleteMany({
      _id: { $in: projectIds }
    });
    console.log(`[Clean] Deleted projects: ${projRes.deletedCount}`);

    // 10. Delete Workspaces
    const wsRes = await db.collection('workspaces').deleteMany({
      _id: { $in: workspaceIds }
    });
    console.log(`[Clean] Deleted workspaces: ${wsRes.deletedCount}`);

    // 11. Delete Users
    const userRes = await db.collection('users').deleteMany({
      _id: { $in: userIds }
    });
    console.log(`[Clean] Deleted users: ${userRes.deletedCount}`);

    // List remaining users
    const remainingUsers = await db.collection('users').find({}, { projection: { name: 1, email: 1 } }).toArray();
    console.log('\n--- Remaining Users in Database ---');
    console.table(remainingUsers.map(u => ({ Name: u.name, Email: u.email })));

    await mongoose.disconnect();
    console.log('\n[Clean] Cleanup successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('[Clean Error]:', err);
    process.exit(1);
  }
}

run();
