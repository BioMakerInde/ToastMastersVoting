import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../../auth/[...nextauth]/route';

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
        const { nominations } = await req.json();
        const meetingId = params.id;

        // Verify user has admin/officer access
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

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
                { error: 'Only admins and officers can manage nominations' },
                { status: 403 }
            );
        }

        // Delete all existing nominations for this meeting
        await prisma.nomination.deleteMany({
            where: { meetingId }
        });

        // Create new nominations
        if (nominations && nominations.length > 0) {
            await prisma.nomination.createMany({
                data: nominations.map((nom: any) => ({
                    meetingId,
                    categoryId: nom.categoryId,
                    memberId: nom.memberId
                })),
                skipDuplicates: true
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Batch nomination error:', error);
        return NextResponse.json(
            { error: 'Failed to save nominations' },
            { status: 500 }
        );
    }
}
