import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { isFeatureAllowed } from '@/lib/subscription';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the clubId from query params
        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('clubId');

        if (!clubId) {
            return NextResponse.json({ error: 'Club ID required' }, { status: 400 });
        }

        // Verify user is admin of this club
        const member = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: session.user.id,
                    clubId
                }
            }
        });

        if (!member || !['ADMIN', 'OFFICER'].includes(member.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if statistics is allowed on this plan
        const allowed = await isFeatureAllowed(clubId, 'STATISTICS');
        if (!allowed) {
            return NextResponse.json(
                { error: 'Statistics dashboard is a Pro feature. Upgrade to Pro to access.', upgradeRequired: true },
                { status: 403 }
            );
        }

        // Get all finalized meetings (lightweight query)
        const meetings = await prisma.meeting.findMany({
            where: {
                clubId,
                isFinalized: true
            },
            orderBy: { meetingDate: 'desc' },
            select: {
                id: true,
                title: true,
                meetingDate: true
            }
        });

        if (meetings.length === 0) {
            return NextResponse.json({ results: [] });
        }

        const meetingIds = meetings.map(m => m.id);

        // Fetch ALL votes for all meetings in ONE query
        const allVotes = await prisma.vote.findMany({
            where: { meetingId: { in: meetingIds } },
            include: {
                category: { select: { id: true, name: true } }
            }
        });

        // Collect all unique nomineeIds across all votes
        const nomineeIds = [...new Set(allVotes.filter(v => v.nomineeId).map(v => v.nomineeId as string))];

        // Fetch all member names in ONE query
        const allMembers = nomineeIds.length > 0
            ? await prisma.member.findMany({
                where: { id: { in: nomineeIds } },
                include: { user: { select: { name: true } } }
            })
            : [];
        const memberMap = new Map(allMembers.map(m => [m.id, m.user.name]));

        // Group votes by meeting, then by category
        const votesByMeeting = new Map<string, typeof allVotes>();
        allVotes.forEach(vote => {
            if (!votesByMeeting.has(vote.meetingId)) {
                votesByMeeting.set(vote.meetingId, []);
            }
            votesByMeeting.get(vote.meetingId)!.push(vote);
        });

        // Process results for each meeting
        const results = meetings.map(meeting => {
            const meetingVotes = votesByMeeting.get(meeting.id) || [];

            // Group votes by category
            const categoryResults: Record<string, {
                categoryName: string;
                votes: Record<string, { name: string; count: number; isGuest: boolean }>;
            }> = {};

            meetingVotes.forEach(vote => {
                const catId = vote.categoryId;
                if (!categoryResults[catId]) {
                    categoryResults[catId] = {
                        categoryName: vote.category?.name || 'Unknown',
                        votes: {}
                    };
                }

                // Handle both member and guest votes
                const votedForKey = vote.nomineeId || `guest:${vote.guestNomineeName}`;
                const votedForName = vote.nomineeId
                    ? (memberMap.get(vote.nomineeId) || 'Unknown Member')
                    : (vote.guestNomineeName || 'Unknown Guest');
                const isGuest = !vote.nomineeId;

                if (!categoryResults[catId].votes[votedForKey]) {
                    categoryResults[catId].votes[votedForKey] = {
                        name: votedForName,
                        count: 0,
                        isGuest
                    };
                }
                categoryResults[catId].votes[votedForKey].count++;
            });

            // Find winner for each category
            const categoryWinners = Object.entries(categoryResults).map(([catId, data]) => {
                const sortedVotes = Object.values(data.votes).sort((a, b) => b.count - a.count);
                const winner = sortedVotes[0];
                return {
                    categoryId: catId,
                    categoryName: data.categoryName,
                    winnerName: winner?.name || 'No winner',
                    winnerVotes: winner?.count || 0,
                    isGuestWinner: winner?.isGuest || false,
                    totalVotes: sortedVotes.reduce((sum, v) => sum + v.count, 0)
                };
            });

            return {
                meetingId: meeting.id,
                meetingTitle: meeting.title,
                meetingDate: meeting.meetingDate.toISOString(),
                categories: categoryWinners
            };
        });

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
