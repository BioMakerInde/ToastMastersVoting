import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const meetingId = params.id;

        // Get meeting
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true, isFinalized: true }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        if (meeting.isFinalized) {
            return NextResponse.json({ error: 'Meeting already finalized' }, { status: 400 });
        }

        // Verify user has admin/officer access
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const member = await prisma.member.findFirst({
            where: {
                userId: user.id,
                clubId: meeting.clubId,
                role: { in: ['ADMIN', 'OFFICER'] }
            }
        });

        if (!member) {
            return NextResponse.json(
                { error: 'Only admins and officers can finalize meetings' },
                { status: 403 }
            );
        }

        // Finalize meeting
        const updatedMeeting = await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                isFinalized: true,
                finalizedAt: new Date(),
                isVotingOpen: false // Also close voting
            }
        });

        return NextResponse.json(updatedMeeting);
    } catch (error) {
        console.error('Finalize meeting error:', error);
        return NextResponse.json(
            { error: 'Failed to finalize meeting' },
            { status: 500 }
        );
    }
}
