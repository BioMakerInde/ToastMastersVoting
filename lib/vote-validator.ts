import { prisma } from './prisma'

/**
 * Validate if a vote can be submitted
 * @param voterId - Member ID of the voter
 * @param meetingId - Meeting ID
 * @param categoryId - Voting category ID
 * @returns Object with isValid flag and error message if invalid
 */
export async function validateVote(
    voterId: string,
    meetingId: string,
    categoryId: string
): Promise<{ isValid: boolean; error?: string }> {
    try {
        // Check if meeting exists and voting is open
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        })

        if (!meeting) {
            return { isValid: false, error: 'Meeting not found' }
        }

        if (!meeting.isVotingOpen) {
            return { isValid: false, error: 'Voting is not open for this meeting' }
        }

        // Check if voting window is valid
        const now = new Date()
        if (meeting.votingStartTime && now < meeting.votingStartTime) {
            return { isValid: false, error: 'Voting has not started yet' }
        }

        if (meeting.votingEndTime && now > meeting.votingEndTime) {
            return { isValid: false, error: 'Voting has ended' }
        }

        // Check if member has already voted in this category
        const existingVote = await prisma.vote.findUnique({
            where: {
                meetingId_categoryId_voterId: {
                    meetingId,
                    categoryId,
                    voterId,
                },
            },
        })

        if (existingVote) {
            return { isValid: false, error: 'You have already voted in this category' }
        }

        // Check if category exists and is active
        const category = await prisma.votingCategory.findUnique({
            where: { id: categoryId },
        })

        if (!category || !category.isActive) {
            return { isValid: false, error: 'Invalid or inactive voting category' }
        }

        return { isValid: true }
    } catch (error) {
        console.error('Error validating vote:', error)
        return { isValid: false, error: 'Failed to validate vote' }
    }
}

/**
 * Check if voting is currently open for a meeting
 * @param meetingId - Meeting ID
 * @returns Boolean indicating if voting is open
 */
export async function isVotingOpen(meetingId: string): Promise<boolean> {
    try {
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        })

        if (!meeting || !meeting.isVotingOpen) {
            return false
        }

        const now = new Date()
        if (meeting.votingStartTime && now < meeting.votingStartTime) {
            return false
        }

        if (meeting.votingEndTime && now > meeting.votingEndTime) {
            return false
        }

        return true
    } catch (error) {
        console.error('Error checking voting status:', error)
        return false
    }
}

/**
 * Validate if an anonymous vote can be submitted
 * @param fingerprint - Browser fingerprint (IP + User-Agent hash)
 * @param meetingId - Meeting ID
 * @param categoryId - Voting category ID
 * @returns Object with isValid flag and error message if invalid
 */
export async function validateAnonymousVote(
    fingerprint: string,
    meetingId: string,
    categoryId: string
): Promise<{ isValid: boolean; error?: string }> {
    try {
        // Check if meeting exists and voting is open
        const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
        })

        if (!meeting) {
            return { isValid: false, error: 'Meeting not found' }
        }

        if (!meeting.isVotingOpen) {
            return { isValid: false, error: 'Voting is not open for this meeting' }
        }

        // Check if voting window is valid
        const now = new Date()
        if (meeting.votingStartTime && now < meeting.votingStartTime) {
            return { isValid: false, error: 'Voting has not started yet' }
        }

        if (meeting.votingEndTime && now > meeting.votingEndTime) {
            return { isValid: false, error: 'Voting has ended' }
        }

        // Check if this fingerprint has already voted in this category
        const existingVote = await prisma.vote.findFirst({
            where: {
                meetingId,
                categoryId,
                voterFingerprint: fingerprint,
                isAnonymous: true,
            },
        })

        if (existingVote) {
            return { isValid: false, error: 'You have already voted in this category' }
        }

        // Check if category exists and is active
        const category = await prisma.votingCategory.findUnique({
            where: { id: categoryId },
        })

        if (!category || !category.isActive) {
            return { isValid: false, error: 'Invalid or inactive voting category' }
        }

        return { isValid: true }
    } catch (error) {
        console.error('Error validating anonymous vote:', error)
        return { isValid: false, error: 'Failed to validate vote' }
    }
}
