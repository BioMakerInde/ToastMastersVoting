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
        const adminCheck = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!adminCheck?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden - Master Admin access required' }, { status: 403 });
        }

        // Fetch all meetings with club info and counts
        const meetings = await prisma.meeting.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                club: {
                    select: { id: true, name: true }
                },
                _count: {
                    select: {
                        votes: true,
                        categories: true
                    }
                }
            }
        });

        return NextResponse.json({
            meetings: meetings.map(meeting => ({
                id: meeting.id,
                title: meeting.title,
                clubId: meeting.club.id,
                clubName: meeting.club.name,
                meetingDate: meeting.meetingDate.toISOString(),
                isVotingOpen: meeting.isVotingOpen,
                isFinalized: meeting.isFinalized,
                voteCount: meeting._count.votes,
                categoryCount: meeting._count.categories
            }))
        });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
