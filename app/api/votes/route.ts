import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { validateVote } from '@/lib/vote-validator'

// POST submit a vote
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { meetingId, categoryId, nomineeId } = await request.json()

        if (!meetingId || !categoryId || !nomineeId) {
            return NextResponse.json(
                { error: 'Meeting ID, category ID, and nominee ID are required' },
                { status: 400 }
            )
        }

        // Get voter's member ID
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true },
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        const voter = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                clubId: meeting.clubId,
                isActive: true,
            },
        })

        if (!voter) {
            return NextResponse.json(
                { error: 'You are not an active member of this club' },
                { status: 403 }
            )
        }

        // Validate vote
        const validation = await validateVote(voter.id, meetingId, categoryId)
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }

        // Submit vote
        const vote = await prisma.vote.create({
            data: {
                meetingId,
                categoryId,
                voterId: voter.id,
                nomineeId,
            },
        })

        return NextResponse.json(
            { message: 'Vote submitted successfully', vote },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error submitting vote:', error)
        return NextResponse.json(
            { error: 'Failed to submit vote' },
            { status: 500 }
        )
    }
}

// GET votes for a meeting (for admins to view voting progress)
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const meetingId = searchParams.get('meetingId')

        if (!meetingId) {
            return NextResponse.json(
                { error: 'Meeting ID is required' },
                { status: 400 }
            )
        }

        // Check if user is admin/officer
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true },
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
                { error: 'Only admins and officers can view votes' },
                { status: 403 }
            )
        }

        // Get vote counts by category
        const votes = await prisma.vote.groupBy({
            by: ['categoryId', 'nomineeId'],
            where: { meetingId },
            _count: true,
        })

        return NextResponse.json({ votes })
    } catch (error) {
        console.error('Error fetching votes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch votes' },
            { status: 500 }
        )
    }
}
