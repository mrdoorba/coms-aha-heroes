import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { admin } from 'better-auth/plugins'
import { eq } from 'drizzle-orm'
import { db } from '@coms/shared/db'
import * as schema from '@coms/shared/db/schema'
import { users, userEmails } from '@coms/shared/db/schema'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily on activity
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path?.startsWith('/callback/')) {
            const [byPrimary] = await db
              .select({ id: users.id })
              .from(users)
              .where(eq(users.email, user.email))
            if (!byPrimary) {
              const [bySecondary] = await db
                .select({ id: userEmails.id })
                .from(userEmails)
                .where(eq(userEmails.email, user.email))
              if (!bySecondary) {
                throw new APIError('FORBIDDEN', {
                  message: 'No account found. Please contact your administrator.',
                })
              }
            }
          }
          return { data: user }
        },
      },
    },
  },
  plugins: [admin()],
})
