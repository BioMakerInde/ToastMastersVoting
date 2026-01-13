import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

// GET /api/meetings/[id]/nominations
export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: meetingId } = params;

        const nominations = await prisma.nomination.findMany({
            where: { meetingId },
            include: {
                member: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json(nominations);
    } catch (error) {
        console.error('Fetch nominations error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/meetings/[id]/nominations
export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: meetingId } = params;
        const { categoryId, memberId } = await req.json();

        if (!categoryId || !memberId) {
            return NextResponse.json({ error: 'Category ID and Member inhabitant ID are required' }, { status: 400 });
        }

        // Verify that the user is an admin of the club
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const adminMember = await prisma.member.findUnique({
            where: { userId_clubId: { userId: user.id, clubId: meeting.clubId } }
        });

        if (!adminMember || !['ADMIN', 'OFFICER'].includes(adminMember.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Check if nomination already exists
        const existing = await prisma.nomination.findFirst({
            where: { meetingId, categoryId, memberId }
        });

        if (existing) {
            // Toggle off? Or just return error? The user said "select the members", 
            // usually implies toggle. Let's make it more of a "set" or "toggle".
            // For now, let's just delete it if it exists (toggle functionality).
            await prisma.nomination.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ message: 'Nomination removed', removed: true });
        }

        const nomination = await prisma.nomination.create({
            data: {
                meetingId,
                categoryId,
                memberId,
                nominatedBy: session.user.name
            }
        });

        return NextResponse.json(nomination);
    } catch (error) {
        console.error('Create nomination error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
