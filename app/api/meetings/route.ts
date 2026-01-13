import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';

// Schema for creating a meeting
const createMeetingSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    meetingDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
    description: z.string().optional(),
    clubId: z.string().optional(), // If not provided, will try to use user's primary club
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or officer
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            members: {
                where: { role: { in: ['ADMIN', 'OFFICER'] } },
                include: { club: true }
            }
        }
    });

    const adminMember = user?.members[0];

    if (!adminMember) {
        return NextResponse.json({ error: 'Forbidden: Admin or Officer access required' }, { status: 403 });
    }

    try {
        const json = await req.json();
        const body = createMeetingSchema.parse(json);

        const clubId = body.clubId || adminMember.clubId;

        const meeting = await prisma.meeting.create({
            data: {
                title: body.title,
                meetingDate: new Date(body.meetingDate),
                description: body.description,
                clubId: clubId,
                isVotingOpen: false, // Default is closed
            },
        });

        return NextResponse.json(meeting, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Create meeting error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const activeOnly = searchParams.get('active');

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { members: { select: { clubId: true } } }
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const userClubIds = user.members.map(m => m.clubId);

        const whereClause: any = {};
        if (clubId) {
            whereClause.clubId = clubId;
        } else {
            // Default to only showing meetings for clubs they belong to
            whereClause.clubId = { in: userClubIds };
        }

        if (activeOnly === 'true') whereClause.isVotingOpen = true;

        const meetings = await prisma.meeting.findMany({
            where: whereClause,
            orderBy: { meetingDate: 'desc' },
            include: {
                _count: {
                    select: { votes: true }
                },
                club: { select: { name: true } }
            }
        });
        return NextResponse.json(meetings);
    } catch (error) {
        console.error('Fetch meetings error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Schema for updating a meeting
const updateMeetingSchema = z.object({
    id: z.string(),
    isVotingOpen: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await req.json();
        const body = updateMeetingSchema.parse(json);

        // 1. Fetch the meeting to know which Club it belongs to
        const existingMeeting = await prisma.meeting.findUnique({
            where: { id: body.id },
            select: { clubId: true }
        });

        if (!existingMeeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // 2. Check if user is ADMIN/OFFICER of *that* specific club
        const authorizedMember = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: (await prisma.user.findUnique({ where: { email: session.user.email } }))!.id,
                    clubId: existingMeeting.clubId
                }
            }
        });

        if (!authorizedMember || !['ADMIN', 'OFFICER'].includes(authorizedMember.role)) {
            return NextResponse.json({ error: 'Forbidden: You do not manage this club' }, { status: 403 });
        }

        const updatedMeeting = await prisma.meeting.update({
            where: { id: body.id },
            data: {
                isVotingOpen: body.isVotingOpen,
                title: body.title,
                description: body.description,
            }
        });

        return NextResponse.json(updatedMeeting);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
