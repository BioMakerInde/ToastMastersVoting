import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
    getClubPlanStatus,
    getUsageStats,
    getFeatureAccess,
    PLAN_LIMITS,
} from '@/lib/subscription';

// GET — Current subscription status for a club
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clubId } = await params;

        // Verify user is a member of this club
        const member = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: session.user.id,
                    clubId,
                },
            },
        });

        if (!member) {
            return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });
        }

        const planStatus = await getClubPlanStatus(clubId);
        const usage = await getUsageStats(clubId);
        const features = await getFeatureAccess(clubId);
        const limits = PLAN_LIMITS[planStatus.plan];

        return NextResponse.json({
            ...planStatus,
            usage,
            features,
            limits: {
                maxMembers: limits.maxMembers === Infinity ? -1 : limits.maxMembers,
                maxMeetingsPerMonth: limits.maxMeetingsPerMonth === Infinity ? -1 : limits.maxMeetingsPerMonth,
                maxClubsPerAccount: limits.maxClubsPerAccount,
            },
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST — Upgrade or downgrade plan (manual, no Razorpay)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: clubId } = await params;

        // Verify user is admin of this club
        const member = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: session.user.id,
                    clubId,
                },
            },
        });

        if (!member || member.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only club admins can manage subscriptions' }, { status: 403 });
        }

        const { plan } = await request.json();

        if (!['FREE', 'PRO'].includes(plan)) {
            return NextResponse.json({ error: 'Invalid plan. Must be FREE or PRO.' }, { status: 400 });
        }

        const subscription = await prisma.subscription.upsert({
            where: { clubId },
            update: {
                plan,
                subscribedAt: plan === 'PRO' ? new Date() : null,
                // If upgrading to PRO, mark trial as used
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
            message: `Plan updated to ${plan}`,
            subscription,
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
