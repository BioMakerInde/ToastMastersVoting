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

        // Fetch stats
        const [totalClubs, totalUsers, totalMeetings, activeSessions, recentClubs, recentMeetings] = await Promise.all([
            prisma.club.count(),
            prisma.user.count(),
            prisma.meeting.count(),
            prisma.meeting.count({
                where: { isVotingOpen: true }
            }),
            prisma.club.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { members: true }
                    }
                }
            }),
            prisma.meeting.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    club: {
                        select: { name: true }
                    }
                }
            })
        ]);

        return NextResponse.json({
            totalClubs,
            totalUsers,
            totalMeetings,
            activeSessions,
            recentClubs: recentClubs.map(club => ({
                id: club.id,
                name: club.name,
                createdAt: club.createdAt.toISOString(),
                memberCount: club._count.members
            })),
            recentMeetings: recentMeetings.map(meeting => ({
                id: meeting.id,
                title: meeting.title,
                clubName: meeting.club.name,
                meetingDate: meeting.meetingDate.toISOString(),
                isVotingOpen: meeting.isVotingOpen
            }))
        });
    } catch (error) {
        console.error('Error fetching master admin stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
