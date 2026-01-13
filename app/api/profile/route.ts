import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                members: {
                    include: {
                        club: true,
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prepare a clean profile object
        // Assuming for now a user might have one primary membership or we return the first one
        const primaryMember = user.members[0];

        const profileData = {
            name: user.name,
            email: user.email,
            joinedAt: user.createdAt,

            // Membership details
            clubName: primaryMember?.club?.name || 'Not assigned to a club',
            role: primaryMember?.role || 'GUEST',
            membershipNumber: primaryMember?.membershipNumber || 'N/A',
            qrCode: primaryMember?.qrCode || null,
            isActive: primaryMember?.isActive ?? false,
        };

        return NextResponse.json(profileData);
    } catch (error) {
        console.error('Profile fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
