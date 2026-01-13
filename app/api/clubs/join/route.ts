import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

const joinClubSchema = z.object({
    clubId: z.string(),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await req.json();
        const body = joinClubSchema.parse(json);

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already a member
        const existingMember = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: user.id,
                    clubId: body.clubId
                }
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'Already a member or request pending' }, { status: 400 });
        }

        // Create Member Request (Pending)
        const member = await prisma.member.create({
            data: {
                userId: user.id,
                clubId: body.clubId,
                role: 'MEMBER',
                status: 'PENDING',
                isActive: true // Keeping true for logic compatibility for now, but status is PENDING
            }
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error('Join request error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
