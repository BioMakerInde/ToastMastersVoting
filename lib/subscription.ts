import { prisma } from './prisma';

// ─── Plan Limits ────────────────────────────────────────────────
export const PLAN_LIMITS = {
    FREE: {
        maxMembers: 25,
        maxMeetingsPerMonth: 4,
        maxClubsPerAccount: 1,
        maxDefaultCategories: 5,
        meetingHistoryLimit: 5,
    },
    PRO: {
        maxMembers: Infinity,
        maxMeetingsPerMonth: Infinity,
        maxClubsPerAccount: 5,
        maxDefaultCategories: Infinity,
        meetingHistoryLimit: Infinity,
    },
} as const;

// ─── Pro-Only Features ──────────────────────────────────────────
export type ProFeature =
    | 'EXCEL_IMPORT'
    | 'BULK_IMPORT'
    | 'CUSTOM_CATEGORIES'
    | 'STATISTICS'
    | 'AUDIT_LOGS'
    | 'QR_CHECKIN'
    | 'ANONYMOUS_VOTING'
    | 'CSV_EXPORT'
    | 'MULTI_ADMIN';

const PRO_ONLY_FEATURES: Set<ProFeature> = new Set([
    'EXCEL_IMPORT',
    'BULK_IMPORT',
    'CUSTOM_CATEGORIES',
    'STATISTICS',
    'AUDIT_LOGS',
    'QR_CHECKIN',
    'ANONYMOUS_VOTING',
    'CSV_EXPORT',
    'MULTI_ADMIN',
]);

// ─── Types ──────────────────────────────────────────────────────
export type EffectivePlan = 'FREE' | 'PRO';

export interface PlanStatus {
    plan: EffectivePlan;
    isTrialActive: boolean;
    trialDaysRemaining: number | null;
    trialEndDate: Date | null;
    rawPlan: 'FREE' | 'PRO';
}

export interface UsageStats {
    membersUsed: number;
    membersLimit: number;
    meetingsThisMonth: number;
    meetingsLimit: number;
}

// ─── Core Functions ─────────────────────────────────────────────

/**
 * Get the effective plan for a club (considers active trial).
 */
export async function getClubPlanStatus(clubId: string): Promise<PlanStatus> {
    const subscription = await prisma.subscription.findUnique({
        where: { clubId },
    });

    if (!subscription) {
        // No subscription record → Free plan, no trial
        return {
            plan: 'FREE',
            isTrialActive: false,
            trialDaysRemaining: null,
            trialEndDate: null,
            rawPlan: 'FREE',
        };
    }

    // Check if trial is active
    const now = new Date();
    const isTrialActive =
        subscription.trialEndDate !== null &&
        subscription.trialEndDate > now &&
        subscription.plan === 'FREE'; // Trial only applies on FREE plan

    const trialDaysRemaining = isTrialActive && subscription.trialEndDate
        ? Math.ceil((subscription.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

    // Effective plan: PRO if subscribed to PRO or trial is active
    const effectivePlan: EffectivePlan =
        subscription.plan === 'PRO' || isTrialActive ? 'PRO' : 'FREE';

    return {
        plan: effectivePlan,
        isTrialActive,
        trialDaysRemaining,
        trialEndDate: subscription.trialEndDate,
        rawPlan: subscription.plan,
    };
}

/**
 * Check if a Pro-only feature is available for a club.
 */
export async function isFeatureAllowed(clubId: string, feature: ProFeature): Promise<boolean> {
    if (!PRO_ONLY_FEATURES.has(feature)) return true;
    const { plan } = await getClubPlanStatus(clubId);
    return plan === 'PRO';
}

/**
 * Get usage stats for a club.
 */
export async function getUsageStats(clubId: string): Promise<UsageStats> {
    const { plan } = await getClubPlanStatus(clubId);
    const limits = PLAN_LIMITS[plan];

    // Count active members
    const membersUsed = await prisma.member.count({
        where: { clubId, isActive: true },
    });

    // Count meetings this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const meetingsThisMonth = await prisma.meeting.count({
        where: {
            clubId,
            createdAt: { gte: startOfMonth },
        },
    });

    return {
        membersUsed,
        membersLimit: limits.maxMembers === Infinity ? -1 : limits.maxMembers,
        meetingsThisMonth,
        meetingsLimit: limits.maxMeetingsPerMonth === Infinity ? -1 : limits.maxMeetingsPerMonth,
    };
}

/**
 * Check if a resource limit has been reached.
 * Returns { allowed: true } or { allowed: false, message: string }
 */
export async function checkLimit(
    clubId: string,
    resource: 'MEMBERS' | 'MEETINGS'
): Promise<{ allowed: boolean; message?: string }> {
    const { plan } = await getClubPlanStatus(clubId);
    const limits = PLAN_LIMITS[plan];

    if (resource === 'MEMBERS') {
        const count = await prisma.member.count({
            where: { clubId, isActive: true },
        });
        if (count >= limits.maxMembers) {
            return {
                allowed: false,
                message: `Free plan allows up to ${limits.maxMembers} members. Upgrade to Pro for unlimited members.`,
            };
        }
    }

    if (resource === 'MEETINGS') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const count = await prisma.meeting.count({
            where: {
                clubId,
                createdAt: { gte: startOfMonth },
            },
        });
        if (count >= limits.maxMeetingsPerMonth) {
            return {
                allowed: false,
                message: `Free plan allows up to ${limits.maxMeetingsPerMonth} meetings per month. Upgrade to Pro for unlimited meetings.`,
            };
        }
    }

    return { allowed: true };
}

/**
 * Create a subscription record with 30-day trial for a new club.
 * Called during club creation.
 */
export function getTrialDates() {
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);
    return { trialStartDate, trialEndDate };
}

/**
 * Get all features and their availability for a club.
 */
export async function getFeatureAccess(clubId: string): Promise<Record<ProFeature, boolean>> {
    const { plan } = await getClubPlanStatus(clubId);
    const isPro = plan === 'PRO';

    const features: Record<ProFeature, boolean> = {
        EXCEL_IMPORT: isPro,
        BULK_IMPORT: isPro,
        CUSTOM_CATEGORIES: isPro,
        STATISTICS: isPro,
        AUDIT_LOGS: isPro,
        QR_CHECKIN: isPro,
        ANONYMOUS_VOTING: isPro,
        CSV_EXPORT: isPro,
        MULTI_ADMIN: isPro,
    };

    return features;
}
