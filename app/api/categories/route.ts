import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma'
import { isFeatureAllowed } from '@/lib/subscription'

// GET all categories for a club
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        let clubId = searchParams.get('clubId')

        if (!clubId) {
            // Try to infer from session if user is logged in
            const session = await getServerSession(authOptions);
            if (session?.user?.email) {
                const userMember = await prisma.member.findFirst({
                    where: {
                        user: { email: session.user.email },
                        role: { in: ['ADMIN', 'OFFICER'] } // Assuming mostly admins look at this or we default to their primary club
                    }
                });
                if (userMember) clubId = userMember.clubId;
            }
        }

        if (!clubId) {
            return NextResponse.json(
                { error: 'Club ID is required' },
                { status: 400 }
            )
        }

        const categories = await prisma.votingCategory.findMany({
            where: {
                clubId,
                isActive: true,
            },
            orderBy: {
                displayOrder: 'asc',
            },
        })

        return NextResponse.json({ categories })
    } catch (error) {
        console.error('Error fetching categories:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

// POST create new category (Admin only)
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let { clubId, name, description, displayOrder } = await request.json()

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            )
        }

        // If clubId is not provided, try to find the club where the user is an admin
        if (!clubId) {
            const userMember = await prisma.member.findFirst({
                where: {
                    userId: session.user.id,
                    role: { in: ['ADMIN', 'OFFICER'] }
                }
            });

            if (userMember) {
                clubId = userMember.clubId;
            }
        }

        if (!clubId) {
            return NextResponse.json(
                { error: 'Club ID could not be determined. Please specify.' },
                { status: 400 }
            )
        }

        // Check if user is admin/officer of the club
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                clubId,
                role: { in: ['ADMIN', 'OFFICER'] },
            },
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Only admins and officers can create categories' },
                { status: 403 }
            )
        }

        // Check if custom categories are allowed (beyond default 5)
        const existingCount = await prisma.votingCategory.count({
            where: { clubId, isActive: true }
        });
        if (existingCount >= 5) {
            const allowed = await isFeatureAllowed(clubId, 'CUSTOM_CATEGORIES');
            if (!allowed) {
                return NextResponse.json(
                    { error: 'Free plan allows up to 5 categories. Upgrade to Pro for unlimited categories.', upgradeRequired: true },
                    { status: 403 }
                );
            }
        }

        // Create category
        const category = await prisma.votingCategory.create({
            data: {
                clubId,
                name,
                description,
                displayOrder: displayOrder || 0,
            },
        })

        return NextResponse.json(
            { message: 'Category created successfully', category },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating category:', error)
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}

// PUT update category (Admin only)
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { categoryId, name, description, displayOrder, isActive } =
            await request.json()

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            )
        }

        // Get category to check club ownership
        const existingCategory = await prisma.votingCategory.findUnique({
            where: { id: categoryId },
        })

        if (!existingCategory) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            )
        }

        // Check if user is admin/officer of the club
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                clubId: existingCategory.clubId,
                role: { in: ['ADMIN', 'OFFICER'] },
            },
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Only admins and officers can update categories' },
                { status: 403 }
            )
        }

        // Update category
        const category = await prisma.votingCategory.update({
            where: { id: categoryId },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(displayOrder !== undefined && { displayOrder }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return NextResponse.json({
            message: 'Category updated successfully',
            category,
        })
    } catch (error) {
        console.error('Error updating category:', error)
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        )
    }
}

// DELETE category (Admin only)
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const categoryId = searchParams.get('categoryId')

        if (!categoryId) {
            return NextResponse.json(
                { error: 'Category ID is required' },
                { status: 400 }
            )
        }

        // Get category to check club ownership
        const existingCategory = await prisma.votingCategory.findUnique({
            where: { id: categoryId },
            include: {
                votes: true,
            },
        })

        if (!existingCategory) {
            return NextResponse.json(
                { error: 'Category not found' },
                { status: 404 }
            )
        }

        // Check if category has votes
        if (existingCategory.votes.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete category with existing votes' },
                { status: 400 }
            )
        }

        // Check if user is admin/officer of the club
        const member = await prisma.member.findFirst({
            where: {
                userId: session.user.id,
                clubId: existingCategory.clubId,
                role: { in: ['ADMIN', 'OFFICER'] },
            },
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Only admins and officers can delete categories' },
                { status: 403 }
            )
        }

        // Delete category
        await prisma.votingCategory.delete({
            where: { id: categoryId },
        })

        return NextResponse.json({ message: 'Category deleted successfully' })
    } catch (error) {
        console.error('Error deleting category:', error)
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
