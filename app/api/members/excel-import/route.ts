import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    console.log('📥 Excel import API called');
    try {
        const session = await getServerSession(authOptions);
        console.log('Session:', session?.user?.email);
        if (!session?.user?.email) {
            console.log('❌ Unauthorized - no session');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { clubId, members } = await request.json();
        console.log('Request data:', { clubId, memberCount: members?.length });

        if (!clubId || !members || !Array.isArray(members)) {
            console.log('❌ Invalid request data');
            return NextResponse.json(
                { error: 'Club ID and members array are required' },
                { status: 400 }
            );
        }

        // Check if admin has access to this club
        const adminUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        console.log('Admin user found:', adminUser?.id);

        if (!adminUser) {
            console.log('❌ Admin user not found');
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const adminMember = await prisma.member.findFirst({
            where: {
                userId: adminUser.id,
                clubId: clubId,
                role: { in: ['ADMIN', 'OFFICER'] }
            }
        });
        console.log('Admin member check:', adminMember?.role);

        if (!adminMember) {
            console.log('❌ Not admin/officer for this club');
            return NextResponse.json(
                { error: 'Only admins and officers can import members' },
                { status: 403 }
            );
        }

        // Get current member count for membership ID generation
        const existingMemberCount = await prisma.member.count({
            where: { clubId }
        });
        console.log('Existing member count:', existingMemberCount);

        // Process members
        let imported = 0;
        let currentMemberNumber = existingMemberCount + 1;
        const errors: string[] = [];
        const defaultPassword = await hashPassword('Welcome@123');
        console.log('Starting member import...');

        for (const memberData of members) {
            try {
                const { name, email, phone, membershipNumber, pathway, currentPosition } = memberData;
                console.log(`\n📝 Processing: ${name} (${email})`);

                // Skip if no name or email
                if (!name || !email) {
                    console.log('⚠️ Skipped - missing name or email');
                    errors.push(`Skipped: Missing name or email`);
                    continue;
                }

                // Split name into parts
                const nameParts = name.trim().split(' ');
                const firstName = nameParts[0] || '';
                const secondName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
                const fullName = name.trim();

                // Check if user exists
                let user = await prisma.user.findUnique({
                    where: { email: email.toLowerCase().trim() }
                });

                if (!user) {
                    console.log('Creating new user...');
                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            email: email.toLowerCase().trim(),
                            name: fullName,
                            phone: phone || null,
                            password: defaultPassword
                        }
                    });
                    console.log('✅ User created:', user.id);
                } else {
                    console.log('User already exists:', user.id);
                }

                // Check if already a member
                const existingMember = await prisma.member.findUnique({
                    where: {
                        userId_clubId: {
                            userId: user.id,
                            clubId: clubId
                        }
                    }
                });

                if (!existingMember) {
                    // Use provided membership number or auto-generate
                    const finalMembershipNumber = membershipNumber || `TM${String(currentMemberNumber).padStart(5, '0')}`;

                    // Determine role from current position
                    let role: 'MEMBER' | 'OFFICER' | 'ADMIN' = 'MEMBER';
                    if (currentPosition) {
                        const position = currentPosition.toLowerCase();
                        if (position.includes('president') || position.includes('vp')) {
                            role = 'OFFICER';
                        }
                    }

                    console.log('Creating member with:', { userId: user.id, clubId, membershipNumber: finalMembershipNumber, role });

                    // Create member record
                    const newMember = await prisma.member.create({
                        data: {
                            userId: user.id,
                            clubId: clubId,
                            membershipNumber: finalMembershipNumber,
                            role: role,
                            status: 'ACTIVE',
                            isActive: true
                        }
                    });
                    console.log('✅ Member created:', newMember.id, newMember.membershipNumber);
                    imported++;
                    if (!membershipNumber) {
                        currentMemberNumber++; // Only increment if we auto-generated
                    }
                } else {
                    console.log('⚠️ Already a member');
                    errors.push(`${email} is already a member`);
                }
            } catch (err: any) {
                console.error('❌ Error importing member:', err);
                errors.push(`Failed to import ${memberData.email}: ${err.message}`);
            }
        }

        console.log(`\n✅ Import complete: ${imported} members imported, ${errors.length} errors`);

        return NextResponse.json({
            imported,
            errors,
            message: `Successfully imported ${imported} members`
        }, { status: 200 });

    } catch (error) {
        console.error('Excel import error:', error);
        return NextResponse.json(
            { error: 'Failed to import members' },
            { status: 500 }
        );
    }
}
