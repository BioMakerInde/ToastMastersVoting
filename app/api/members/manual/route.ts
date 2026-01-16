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

        const {
            clubId,
            membershipNumber,
            firstName,
            secondName,
            fullName,
            email,
            phone,
            pathway,
            mentor
        } = await request.json();

        // Validation
        if (!clubId || !email || !fullName) {
            return NextResponse.json(
                { error: 'Club ID, Email, and Full Name are required' },
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
                { error: 'Only admins and officers can add members' },
                { status: 403 }
            );
        }

        // Check if user with this email already exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        // If user doesn't exist, create one
        if (!user) {
            // Generate a default password (user should change it later)
            const defaultPassword = await hashPassword('Welcome@123');

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
        } else {
            // Update existing user with new info if provided
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: fullName,
                    firstName: firstName || user.firstName,
                    secondName: secondName || user.secondName,
                    phone: phone || user.phone
                }
            });
        }

        // Check if member already exists in this club
        const existingMember = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: user.id,
                    clubId: clubId
                }
            }
        });

        if (existingMember) {
            return NextResponse.json(
                { error: 'This user is already a member of this club' },
                { status: 400 }
            );
        }

        // Create member record
        const member = await prisma.member.create({
            data: {
                userId: user.id,
                clubId: clubId,
                membershipNumber: membershipNumber || null,
                pathway: pathway || null,
                mentor: mentor || null,
                role: 'MEMBER',
                status: 'ACTIVE',
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        firstName: true,
                        secondName: true,
                        phone: true
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Member added successfully',
            member
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json(
            { error: 'Failed to add member' },
            { status: 500 }
        );
    }
}
