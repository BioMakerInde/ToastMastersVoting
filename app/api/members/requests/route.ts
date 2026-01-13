import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get current user to find their admin clubs
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                members: {
                    where: { role: { in: ['ADMIN', 'OFFICER'] } },
                    select: { clubId: true }
                }
            }
        });

        if (!user || user.members.length === 0) {
            return NextResponse.json([]); // Not an admin of any club
        }

        const adminClubIds = user.members.map(m => m.clubId);

        // Fetch Pending Members for these clubs
        const pendingMembers = await prisma.member.findMany({
            where: {
                clubId: { in: adminClubIds },
                status: 'PENDING'
            },
            include: {
                user: {
                    select: { name: true, email: true }
                },
                club: {
                    select: { name: true }
                }
            },
            orderBy: { joinedAt: 'desc' }
        });

        return NextResponse.json(pendingMembers);
    } catch (error) {
        console.error('Fetch requests error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
