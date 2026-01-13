import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const meeting = await prisma.meeting.findUnique({
            where: { id: params.id },
            include: {
                club: { select: { id: true, name: true } },
                categories: {
                    include: {
                        category: true
                    }
                },
                nominations: {
                    include: {
                        member: {
                            include: {
                                user: { select: { name: true } }
                            }
                        },
                        category: { select: { id: true, name: true } }
                    }
                }
            }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Optional: Check if user belongs to the club (for security)
        // For now, allowing any authenticated user to view details (needed for voting if they just scan QR)
        // But for ADMIN page, we want this.

        return NextResponse.json(meeting);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Handler for deleting a meeting (feature enhancement)
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin access
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });

    if (!meeting || !user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const member = await prisma.member.findUnique({
        where: { userId_clubId: { userId: user.id, clubId: meeting.clubId } }
    });

    if (!member || !['ADMIN', 'OFFICER'].includes(member.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.meeting.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
}
