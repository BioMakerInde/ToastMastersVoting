import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST — Master admin can upgrade/downgrade any club
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify master admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!user?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden - Master Admin only' }, { status: 403 });
        }

        const { id: clubId } = await params;
        const { plan } = await request.json();

        if (!['FREE', 'PRO'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Verify club exists
        const club = await prisma.club.findUnique({
            where: { id: clubId },
            select: { id: true, name: true }
        });

        if (!club) {
            return NextResponse.json({ error: 'Club not found' }, { status: 404 });
        }

        const subscription = await prisma.subscription.upsert({
            where: { clubId },
            update: {
                plan,
                subscribedAt: plan === 'PRO' ? new Date() : null,
                // PRO gets no expiry when set by master admin (lifetime until changed)
                expiresAt: null,
                ...(plan === 'PRO' ? { isTrialUsed: true } : {}),
            },
            create: {
                clubId,
                plan,
                subscribedAt: plan === 'PRO' ? new Date() : null,
                isTrialUsed: plan === 'PRO',
            },
        });

        return NextResponse.json({
            message: `${club.name} updated to ${plan} plan`,
            subscription,
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
