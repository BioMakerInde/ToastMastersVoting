// Shared TypeScript types and interfaces

export enum MemberRole {
    ADMIN = 'ADMIN',
    OFFICER = 'OFFICER',
    MEMBER = 'MEMBER',
    GUEST = 'GUEST',
}

export interface VotingSession {
    meetingId: string
    isOpen: boolean
    startTime: Date | null
    endTime: Date | null
}

export interface VoteSubmission {
    meetingId: string
    categoryId: string
    nomineeId: string
}

export interface VoteResultData {
    categoryId: string
    categoryName: string
    winnerId: string | null
    winnerName: string | null
    voteCount: number
    totalVotes: number
}

export interface MemberProfile {
    id: string
    name: string
    email: string
    role: MemberRole
    clubName: string
    membershipNumber?: string
    qrCode?: string
}

export interface CategoryFormData {
    name: string
    description?: string
    displayOrder?: number
}
