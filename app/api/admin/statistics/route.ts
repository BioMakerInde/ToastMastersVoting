import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

        // Get all finalized meetings with their categories
        const meetings = await prisma.meeting.findMany({
            where: {
                clubId,
                isFinalized: true
            },
            orderBy: { meetingDate: 'desc' },
            include: {
                categories: {
                    include: {
                        category: true
                    }
                }
            }
        });

        // Process results for each meeting
        const results = await Promise.all(meetings.map(async (meeting) => {
            // Get votes for this meeting
            const votes = await prisma.vote.findMany({
                where: { meetingId: meeting.id },
                include: {
                    category: true
                }
            });

            // Group votes by category
            const categoryResults: Record<string, {
                categoryName: string;
                votes: Record<string, { name: string; count: number; isGuest: boolean }>;
            }> = {};

            // Collect all nomineIds to look up member names
            const nomineeIds = votes
                .filter(v => v.nomineeId)
                .map(v => v.nomineeId as string);

            // Fetch member names in one query
            const members = await prisma.member.findMany({
                where: { id: { in: nomineeIds } },
                include: { user: { select: { name: true } } }
            });
            const memberMap = new Map(members.map(m => [m.id, m.user.name]));

            votes.forEach(vote => {
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
        }));

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
