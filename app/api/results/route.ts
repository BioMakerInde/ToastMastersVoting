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

        // Calculate results
        const votes = await prisma.vote.groupBy({
            by: ['categoryId', 'nomineeId'],
            where: { meetingId },
            _count: true,
        })

        // Get category and member details
        const results = await Promise.all(
            votes.map(async (vote) => {
                const category = await prisma.votingCategory.findUnique({
                    where: { id: vote.categoryId },
                })

                const nominee = await prisma.member.findUnique({
                    where: { id: vote.nomineeId },
                    include: { user: true },
                })

                return {
                    categoryId: vote.categoryId,
                    categoryName: category?.name,
                    nomineeId: vote.nomineeId,
                    nomineeName: nominee?.user.name,
                    voteCount: vote._count,
                }
            })
        )

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
                voteCount: result.voteCount,
            })

            if (result.voteCount > acc[result.categoryId].maxVotes) {
                acc[result.categoryId].maxVotes = result.voteCount
                acc[result.categoryId].winner = {
                    nomineeId: result.nomineeId,
                    nomineeName: result.nomineeName,
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
