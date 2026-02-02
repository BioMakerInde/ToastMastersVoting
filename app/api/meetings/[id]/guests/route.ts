import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Add or remove guest from a specific category
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: meetingId } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { categoryId, guestName, action } = body;

        if (!categoryId || !guestName) {
            return NextResponse.json({ error: 'categoryId and guestName are required' }, { status: 400 });
        }

        // Get or create the meeting category
        let meetingCategory = await prisma.meetingCategory.findUnique({
            where: {
                meetingId_categoryId: {
                    meetingId,
                    categoryId
                }
            }
        });

        if (!meetingCategory) {
            // Create the category if it doesn't exist
            meetingCategory = await prisma.meetingCategory.create({
                data: {
                    meetingId,
                    categoryId,
                    guestNames: []
                }
            });
        }

        const currentGuests = meetingCategory.guestNames || [];

        if (action === 'add') {
            // Check if guest already exists in this category
            if (currentGuests.includes(guestName)) {
                return NextResponse.json({ error: 'Guest already exists in this category' }, { status: 400 });
            }

            await prisma.meetingCategory.update({
                where: { id: meetingCategory.id },
                data: {
                    guestNames: [...currentGuests, guestName]
                }
            });
        } else if (action === 'remove') {
            await prisma.meetingCategory.update({
                where: { id: meetingCategory.id },
                data: {
                    guestNames: currentGuests.filter(g => g !== guestName)
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error managing guest:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
