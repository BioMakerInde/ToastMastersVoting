import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';
import { getTrialDates } from '@/lib/subscription';

const createClubSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    clubNumber: z.string().optional(),
    areaNumber: z.string().optional(),
    divisionNumber: z.string().optional(),
    districtNumber: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await req.json();
        const body = createClubSchema.parse(json);

        // Get User ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Transaction: Create Club -> Make User Admin
        const result = await prisma.$transaction(async (tx) => {
            const club = await tx.club.create({
                data: {
                    name: body.name,
                    description: body.description, // Added description to club creation
                    clubNumber: body.clubNumber,
                    areaNumber: body.areaNumber,
                    divisionNumber: body.divisionNumber,
                    districtNumber: body.districtNumber,
                    website: body.website || null,
                }
            });

            // Add user as ADMIN and ACTIVE
            await tx.member.create({
                data: {
                    userId: user.id,
                    clubId: club.id,
                    role: 'ADMIN',
                    status: 'ACTIVE' as any,
                    isActive: true
                }
            });

            // Create subscription with 30-day Pro trial
            const { trialStartDate, trialEndDate } = getTrialDates();
            await tx.subscription.create({
                data: {
                    clubId: club.id,
                    plan: 'FREE',
                    trialStartDate,
                    trialEndDate,
                    isTrialUsed: false,
                }
            });

            return club;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Club creation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')
    const managedOnly = searchParams.get('managed') === 'true';

    try {
        const where: any = {};
        if (name) where.name = { contains: name, mode: 'insensitive' };

        if (managedOnly) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                include: { members: { where: { role: { in: ['ADMIN', 'OFFICER'] } }, select: { clubId: true } } }
            });
            if (user) {
                where.id = { in: user.members.map(m => m.clubId) };
            }
        }

        const clubs = await prisma.club.findMany({
            where,
            take: 20,
            orderBy: { name: 'asc' },
            include: { _count: { select: { members: true } } }
        });
        return NextResponse.json(clubs);
    } catch (error) {
        console.error('Fetch clubs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
