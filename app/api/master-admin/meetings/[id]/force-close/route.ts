import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: meetingId } = await params;

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

        // Force close voting
        await prisma.meeting.update({
            where: { id: meetingId },
            data: {
                isVotingOpen: false,
                votingEndTime: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error closing voting:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
