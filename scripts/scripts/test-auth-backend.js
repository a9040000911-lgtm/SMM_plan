
const { PrismaClient } = require('../src/generated/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function testFlow() {
    const email = 'test_tester@example.com';
    const projectId = 'default_project_id'; // Placeholder, script will find real one

    console.log('--- STARTING BACKEND AUTH TEST ---');

    try {
        // 1. Find a valid Project ID
        const project = await prisma.project.findFirst();
        if (!project) throw new Error('No projects found in DB');
        const pid = project.id;
        console.log(`Using Project ID: ${pid}`);

        // Clean up existing test user
        await prisma.user.deleteMany({ where: { email, projectId: pid } });

        // 2. Simulate Registration
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                username: 'test_tester',
                projectId: pid,
                balance: 0
            }
        });
        console.log('✅ Registration simulated: User created');

        // 3. Simulate Forgot Password (Request Code)
        const code = '123456';
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordCode: code, resetPasswordExpires: expires }
        });
        console.log('✅ Forgot Password simulated: Code 123456 set in DB');

        // 4. Simulate Reset Password (Verify Code & Change)
        const updatedUser = await prisma.user.findFirst({
            where: { email, resetPasswordCode: code }
        });
        if (!updatedUser) throw new Error('Reset code not found in DB');

        const newPassHash = await bcrypt.hash('NewPassword456!', 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: newPassHash,
                resetPasswordCode: null,
                resetPasswordExpires: null
            }
        });
        console.log('✅ Reset Password simulated: Password updated, codes cleared');

        // 5. Simulate 2FA Toggle
        await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorEnabled: true }
        });
        console.log('✅ 2FA Toggle simulated: twoFactorEnabled=true');

        // Clean up
        await prisma.user.deleteMany({ where: { id: user.id } });
        console.log('✅ Cleanup successful');
        console.log('--- TEST COMPLETED SUCCESSFULLY ---');

    } catch (err) {
        console.error('❌ TEST FAILED:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

testFlow();
