import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    try {
        const { id: clubId } = params;

        const members = await prisma.member.findMany({
            where: {
                clubId,
                status: 'ACTIVE' as any,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                user: {
                    name: 'asc',
                },
            },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error('Fetch club members error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
