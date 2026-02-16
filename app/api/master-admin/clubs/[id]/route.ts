import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!user?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        const club = await prisma.club.findUnique({
            where: { id },
            include: {
                subscription: true,
                _count: {
                    select: {
                        members: true,
                        meetings: true,
                        categories: true,
                    }
                },
                members: {
                    where: { role: { in: ['ADMIN', 'OFFICER'] } },
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                },
                meetings: {
                    orderBy: { meetingDate: 'desc' },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        meetingDate: true,
                        isVotingOpen: true,
                        isFinalized: true,
                        _count: { select: { votes: true } }
                    }
                }
            }
        });

        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        return NextResponse.json({ club });
    } catch (error) {
        console.error('Error fetching club detail:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
