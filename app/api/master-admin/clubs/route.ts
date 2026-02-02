import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is master admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!user?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden - Master Admin access required' }, { status: 403 });
        }

        // Fetch all clubs with counts
        const clubs = await prisma.club.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        members: true,
                        meetings: true
                    }
                }
            }
        });

        return NextResponse.json({
            clubs: clubs.map(club => ({
                id: club.id,
                name: club.name,
                clubNumber: club.clubNumber,
                createdAt: club.createdAt.toISOString(),
                memberCount: club._count.members,
                meetingCount: club._count.meetings
            }))
        });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
