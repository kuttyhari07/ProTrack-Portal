const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Membership = require('../models/Membership');

const seedAdminUser = async () => {
  try {
    const adminEmail = 'protrack24@gmail.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@ProTrack24';

    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (!admin) {
      console.log(`[Admin Seeder] Creating default system administrator: ${adminEmail}`);

      admin = await User.create({
        name: 'ProTrack Super Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'system_admin',
        status: 'active',
        title: 'Platform Administrator',
        bio: 'Chief System Administrator for ProTrack global SaaS platform.',
        isEmailVerified: true
      });

      // Create HQ Admin Workspace
      const wsSlug = `protrack-hq-${Math.floor(1000 + Math.random() * 9000)}`;
      const workspace = await Workspace.create({
        name: 'ProTrack HQ',
        slug: wsSlug,
        owner: admin._id,
        teamType: 'Product Engineering'
      });

      await Membership.create({
        user: admin._id,
        workspace: workspace._id,
        role: 'Owner'
      });

      admin.currentWorkspace = workspace._id;
      await admin.save();

      console.log(`[Admin Seeder] Successfully initialized admin account: ${adminEmail} (password: ${adminPassword})`);
    } else {
      // Ensure role is system_admin and status is active
      let modified = false;
      if (admin.role !== 'system_admin') {
        admin.role = 'system_admin';
        modified = true;
      }
      if (admin.status !== 'active') {
        admin.status = 'active';
        modified = true;
      }

      // Ensure Admin Workspace exists
      let workspace = await Workspace.findOne({ owner: admin._id });
      if (!workspace) {
        const wsSlug = `protrack-hq-${Math.floor(1000 + Math.random() * 9000)}`;
        workspace = await Workspace.create({
          name: 'ProTrack HQ',
          slug: wsSlug,
          owner: admin._id,
          teamType: 'Product Engineering'
        });
        console.log(`[Admin Seeder] Re-created missing HQ workspace for ${adminEmail}`);
      }

      // Ensure Owner Membership exists
      let membership = await Membership.findOne({ user: admin._id, workspace: workspace._id });
      if (!membership) {
        await Membership.create({
          user: admin._id,
          workspace: workspace._id,
          role: 'Owner'
        });
        console.log(`[Admin Seeder] Re-created missing Owner membership for ${adminEmail}`);
      }

      if (!admin.currentWorkspace || admin.currentWorkspace.toString() !== workspace._id.toString()) {
        admin.currentWorkspace = workspace._id;
        modified = true;
      }

      if (modified) {
        await admin.save();
        console.log(`[Admin Seeder] Verified and updated ${adminEmail} privileges and workspace`);
      }
    }

    return admin;
  } catch (error) {
    console.error('[Admin Seeder Error]:', error.message);
  }
};

module.exports = seedAdminUser;
