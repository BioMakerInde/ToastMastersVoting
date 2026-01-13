import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

/**
 * Hash a password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
}

/**
 * Get user by email
 * @param email - User email
 * @returns User object or null
 */
export async function getUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: {
            members: {
                include: {
                    club: true,
                },
            },
        },
    })
}

/**
 * Get member with role information
 * @param userId - User ID
 * @param clubId - Club ID
 * @returns Member object with role or null
 */
export async function getMemberRole(userId: string, clubId: string) {
    return prisma.member.findUnique({
        where: {
            userId_clubId: {
                userId,
                clubId,
            },
        },
        select: {
            id: true,
            role: true,
            isActive: true,
        },
    })
}
