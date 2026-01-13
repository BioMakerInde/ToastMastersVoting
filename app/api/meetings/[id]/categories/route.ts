import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

// GET /api/meetings/[id]/categories - Get enabled categories for a meeting
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
        const enabledCategories = await prisma.meetingCategory.findMany({
            where: { meetingId },
            include: { category: true }
        });

        return NextResponse.json(enabledCategories);
    } catch (error) {
        console.error('Fetch meeting categories error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/meetings/[id]/categories - Toggle a category for a meeting
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
        const { categoryId } = await req.json();

        if (!categoryId) {
            return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
        }

        // Verify meeting existence and get clubId
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            select: { clubId: true }
        });

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Verify user is admin/officer of the club
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const adminMember = await prisma.member.findUnique({
            where: { userId_clubId: { userId: user.id, clubId: meeting.clubId } }
        });

        if (!adminMember || !['ADMIN', 'OFFICER'].includes(adminMember.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Toggle category
        const existing = await prisma.meetingCategory.findUnique({
            where: {
                meetingId_categoryId: { meetingId, categoryId }
            }
        });

        if (existing) {
            await prisma.meetingCategory.delete({
                where: { id: existing.id }
            });
            return NextResponse.json({ message: 'Category disabled', enabled: false });
        } else {
            const mc = await prisma.meetingCategory.create({
                data: { meetingId, categoryId }
            });
            return NextResponse.json({ ...mc, enabled: true });
        }
    } catch (error) {
        console.error('Toggle meeting category error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
