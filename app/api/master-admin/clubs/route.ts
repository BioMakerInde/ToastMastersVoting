import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is master admin
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!user?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden - Master Admin access required' }, { status: 403 });
        }

        // Fetch all clubs with counts and subscription
        const clubs = await prisma.club.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        members: true,
                        meetings: true
                    }
                },
                subscription: {
                    select: {
                        plan: true,
                        trialEndDate: true,
                        isTrialUsed: true,
                        expiresAt: true,
                        subscribedAt: true,
                    }
                }
            }
        });

        const now = new Date();

        return NextResponse.json({
            clubs: clubs.map(club => {
                const sub = club.subscription;
                const isTrialActive = sub?.trialEndDate
                    ? sub.trialEndDate > now && sub.plan === 'FREE'
                    : false;
                const isProExpired = sub?.plan === 'PRO' && sub?.expiresAt && sub.expiresAt < now;
                const effectivePlan = (sub?.plan === 'PRO' && !isProExpired) || isTrialActive ? 'PRO' : 'FREE';

                return {
                    id: club.id,
                    name: club.name,
                    clubNumber: club.clubNumber,
                    createdAt: club.createdAt.toISOString(),
                    memberCount: club._count.members,
                    meetingCount: club._count.meetings,
                    plan: effectivePlan,
                    rawPlan: sub?.plan || 'FREE',
                    isTrialActive,
                    trialEndDate: sub?.trialEndDate?.toISOString() || null,
                };
            })
        });
    } catch (error) {
        console.error('Error fetching clubs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
