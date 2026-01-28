import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET results for a meeting
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const meetingId = searchParams.get('meetingId')

        if (!meetingId) {
            return NextResponse.json(
                { error: 'Meeting ID is required' },
                { status: 400 }
            )
        }

        // Check if voting is closed
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        // Only show results if voting is closed
        const now = new Date()
        const isVotingClosed =
            !meeting.isVotingOpen ||
            (meeting.votingEndTime && now > meeting.votingEndTime)

        if (!isVotingClosed) {
            return NextResponse.json(
                { error: 'Results are not available until voting closes' },
                { status: 403 }
            )
        }

        // Calculate results - get all votes for this meeting
        const allVotes = await prisma.vote.findMany({
            where: { meetingId },
            include: {
                category: true,
            }
        });

        // Group votes by category and nominee (member or guest)
        const voteMap: Record<string, Record<string, { count: number; isGuest: boolean; name: string | null; nomineeId: string | null }>> = {};

        for (const vote of allVotes) {
            if (!voteMap[vote.categoryId]) {
                voteMap[vote.categoryId] = {};
            }

            // Determine the key based on whether it's a guest or member vote
            let key: string;
            let isGuest = false;
            let name: string | null = null;

            if (vote.guestNomineeName) {
                key = `guest:${vote.guestNomineeName}`;
                isGuest = true;
                name = vote.guestNomineeName;
            } else if (vote.nomineeId) {
                key = vote.nomineeId;
            } else {
                continue; // Skip invalid votes
            }

            if (!voteMap[vote.categoryId][key]) {
                voteMap[vote.categoryId][key] = { count: 0, isGuest, name, nomineeId: vote.nomineeId };
            }
            voteMap[vote.categoryId][key].count++;
        }

        // Build results with member/guest details
        const results: any[] = [];
        for (const [categoryId, nominees] of Object.entries(voteMap)) {
            const category = await prisma.votingCategory.findUnique({
                where: { id: categoryId },
            });

            for (const [key, data] of Object.entries(nominees)) {
                let nomineeName = data.name;

                if (!data.isGuest && data.nomineeId) {
                    const member = await prisma.member.findUnique({
                        where: { id: data.nomineeId },
                        include: { user: true },
                    });
                    nomineeName = member?.user.name || 'Unknown';
                }

                results.push({
                    categoryId,
                    categoryName: category?.name,
                    nomineeId: data.nomineeId,
                    nomineeName,
                    isGuest: data.isGuest,
                    voteCount: data.count,
                });
            }
        }

        // Group by category and find winners
        const resultsByCategory = results.reduce((acc: any, result) => {
            if (!acc[result.categoryId]) {
                acc[result.categoryId] = {
                    categoryId: result.categoryId,
                    categoryName: result.categoryName,
                    nominees: [],
                    winner: null,
                    maxVotes: 0,
                }
            }

            acc[result.categoryId].nominees.push({
                nomineeId: result.nomineeId,
                nomineeName: result.nomineeName,
                isGuest: result.isGuest,
                voteCount: result.voteCount,
            })

            if (result.voteCount > acc[result.categoryId].maxVotes) {
                acc[result.categoryId].maxVotes = result.voteCount
                acc[result.categoryId].winner = {
                    nomineeId: result.nomineeId,
                    nomineeName: result.nomineeName,
                    isGuest: result.isGuest,
                    voteCount: result.voteCount,
                }
            }

            return acc
        }, {})

        return NextResponse.json({
            results: Object.values(resultsByCategory),
            meeting: {
                id: meeting.id,
                title: meeting.title,
                meetingDate: meeting.meetingDate,
            },
        })
    } catch (error) {
        console.error('Error fetching results:', error)
        return NextResponse.json(
            { error: 'Failed to fetch results' },
            { status: 500 }
        )
    }
}

// POST calculate and save results (Admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { meetingId } = await request.json()

        if (!meetingId) {
            return NextResponse.json(
                { error: 'Meeting ID is required' },
                { status: 400 }
            )
        }

        // Check if user is admin/officer
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                clubId: meeting.clubId,
                role: { in: ['ADMIN', 'OFFICER'] },
            },
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Only admins and officers can calculate results' },
                { status: 403 }
            )
        }

        // Calculate results
        const votes = await prisma.vote.groupBy({
            by: ['categoryId', 'nomineeId'],
            where: { meetingId },
            _count: true,
        })

        // Find winners for each category
        const categoryWinners = votes.reduce((acc: any, vote) => {
            if (
                !acc[vote.categoryId] ||
                vote._count > acc[vote.categoryId].voteCount
            ) {
                acc[vote.categoryId] = {
                    categoryId: vote.categoryId,
                    winnerId: vote.nomineeId,
                    voteCount: vote._count,
                }
            }
            return acc
        }, {})

        // Get total votes per category
        const totalVotesByCategory = await prisma.vote.groupBy({
            by: ['categoryId'],
            where: { meetingId },
            _count: true,
        })

        // Save results
        const savedResults = await Promise.all(
            Object.values(categoryWinners).map(async (winner: any) => {
                const totalVotes =
                    totalVotesByCategory.find((t) => t.categoryId === winner.categoryId)
                        ?._count || 0

                return prisma.voteResult.upsert({
                    where: {
                        meetingId_categoryId: {
                            meetingId,
                            categoryId: winner.categoryId,
                        },
                    },
                    update: {
                        winnerId: winner.winnerId,
                        voteCount: winner.voteCount,
                        totalVotes,
                        calculatedAt: new Date(),
                    },
                    create: {
                        meetingId,
                        categoryId: winner.categoryId,
                        winnerId: winner.winnerId,
                        voteCount: winner.voteCount,
                        totalVotes,
                    },
                })
            })
        )

        return NextResponse.json({
            message: 'Results calculated and saved successfully',
            results: savedResults,
        })
    } catch (error) {
        console.error('Error calculating results:', error)
        return NextResponse.json(
            { error: 'Failed to calculate results' },
            { status: 500 }
        )
    }
}
