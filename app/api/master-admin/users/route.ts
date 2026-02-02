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
        const adminCheck = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isMasterAdmin: true }
        });

        if (!adminCheck?.isMasterAdmin) {
            return NextResponse.json({ error: 'Forbidden - Master Admin access required' }, { status: 403 });
        }

        // Fetch all users with club memberships
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                members: {
                    include: {
                        club: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        return NextResponse.json({
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt.toISOString(),
                isMasterAdmin: user.isMasterAdmin,
                clubCount: user.members.length,
                clubs: user.members.map(m => ({
                    id: m.club.id,
                    name: m.club.name,
                    role: m.role
                }))
            }))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
