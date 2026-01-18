import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clubId = searchParams.get('clubId');

        if (!clubId) {
            return NextResponse.json({ error: 'clubId required' }, { status: 400 });
        }

        // Get all members for this club with full details
        const members = await prisma.member.findMany({
            where: {
                clubId: clubId
            },
            include: {
                user: true
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });

        // Get count by status
        const statusCounts = await prisma.member.groupBy({
            by: ['status'],
            where: { clubId },
            _count: true
        });

        return NextResponse.json({
            total: members.length,
            statusCounts,
            members: members.map(m => ({
                id: m.id,
                membershipNumber: m.membershipNumber,
                status: m.status,
                isActive: m.isActive,
                role: m.role,
                joinedAt: m.joinedAt,
                user: {
                    name: m.user.name,
                    email: m.user.email
                }
            }))
        });
    } catch (error) {
        console.error('Debug members error:', error);
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }
}
