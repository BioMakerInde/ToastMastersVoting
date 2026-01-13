import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';

const updateMemberSchema = z.object({
    status: z.enum(['ACTIVE', 'REJECTED']),
});

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const json = await req.json();
        const body = updateMemberSchema.parse(json);

        // Get the member record to verify club
        const targetMember = await prisma.member.findUnique({
            where: { id }
        });

        if (!targetMember) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Verify requester is ADMIN of that club
        const requester = await prisma.member.findUnique({
            where: {
                userId_clubId: {
                    userId: (await prisma.user.findUnique({ where: { email: session.user.email } }))!.id,
                    clubId: targetMember.clubId
                }
            }
        });

        if (!requester || !['ADMIN', 'OFFICER'].includes(requester.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update status
        const updatedMember = await prisma.member.update({
            where: { id },
            data: {
                status: body.status,
                isActive: body.status === 'ACTIVE' // Sync legacy field
            }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
