import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getUserByEmail, verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                const normalizedEmail = credentials.email.trim().toLowerCase()
                const user = await getUserByEmail(normalizedEmail)

                if (!user) {
                    throw new Error('No user found with this email')
                }

                const isValidPassword = await verifyPassword(
                    credentials.password,
                    user.password
                )

                if (!isValidPassword) {
                    throw new Error('Invalid password')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isMasterAdmin: user.isMasterAdmin || false,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id
                token.isMasterAdmin = user.isMasterAdmin
            }
            // Refresh isMasterAdmin on session update
            if (trigger === 'update') {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { isMasterAdmin: true }
                })
                token.isMasterAdmin = dbUser?.isMasterAdmin || false
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.isMasterAdmin = token.isMasterAdmin as boolean
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
