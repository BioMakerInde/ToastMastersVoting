import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Get all clubs the user is a member of (with admin/officer role)
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all memberships for this user where they are admin or officer
        const memberships = await prisma.member.findMany({
            where: {
                userId: session.user.id,
                role: { in: ['ADMIN', 'OFFICER'] }
            },
            include: {
                club: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const clubs = memberships.map(m => ({
            id: m.club.id,
            name: m.club.name
        }));

        return NextResponse.json({ clubs });
    } catch (error) {
        console.error('Error fetching user clubs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
