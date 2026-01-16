import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { clubId, members } = await request.json();

        if (!clubId || !members || !Array.isArray(members)) {
            return NextResponse.json(
                { error: 'Club ID and members array are required' },
                { status: 400 }
            );
        }

        // Check if admin has access to this club
        const adminUser = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!adminUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const adminMember = await prisma.member.findFirst({
            where: {
                userId: adminUser.id,
                clubId: clubId,
                role: { in: ['ADMIN', 'OFFICER'] }
            }
        });

        if (!adminMember) {
            return NextResponse.json(
                { error: 'Only admins and officers can bulk import members' },
                { status: 403 }
            );
        }

        // Get current member count for membership ID generation
        const existingMemberCount = await prisma.member.count({
            where: { clubId }
        });

        // Process members
        let imported = 0;
        let currentMemberNumber = existingMemberCount + 1;
        const errors: string[] = [];
        const defaultPassword = await hashPassword('Welcome@123');

        for (const memberData of members) {
            try {
                const { firstName, secondName, fullName, email, phone, pathway, mentor } = memberData;

                // Skip if email already exists
                let user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user) {
                    // Create new user
                    user = await prisma.user.create({
                        data: {
                            email,
                            name: fullName,
                            firstName: firstName || null,
                            secondName: secondName || null,
                            phone: phone || null,
                            password: defaultPassword
                        }
                    });
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
                    // Auto-generate membership ID
                    const membershipId = `TM${String(currentMemberNumber).padStart(5, '0')}`;

                    // Create member record
                    await prisma.member.create({
                        data: {
                            userId: user.id,
                            clubId: clubId,
                            membershipNumber: membershipId,
                            pathway: pathway || null,
                            mentor: mentor || null,
                            role: 'MEMBER',
                            status: 'ACTIVE',
                            isActive: true
                        }
                    });
                    imported++;
                    currentMemberNumber++; // Increment for next member
                } else {
                    errors.push(`${email} is already a member`);
                }
            } catch (err: any) {
                errors.push(`Failed to import ${memberData.email}: ${err.message}`);
            }
        }

        return NextResponse.json({
            imported,
            errors,
            message: `Successfully imported ${imported} members`
        }, { status: 200 });

    } catch (error) {
        console.error('Bulk import error:', error);
        return NextResponse.json(
            { error: 'Failed to import members' },
            { status: 500 }
        );
    }
}
