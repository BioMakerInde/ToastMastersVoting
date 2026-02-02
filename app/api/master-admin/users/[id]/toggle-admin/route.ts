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
        const { id: userId } = await params;

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

        const body = await request.json();
        const { isMasterAdmin } = body;

        // Prevent removing your own admin access
        if (userId === session.user.id && !isMasterAdmin) {
            return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 });
        }

        // Update user
        await prisma.user.update({
            where: { id: userId },
            data: { isMasterAdmin }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling admin:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
