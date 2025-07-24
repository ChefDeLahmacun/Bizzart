import { PrismaAdapter } from '@auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Fix SSL certificate issues in development
if (process.env.NODE_ENV === 'development') {
  // Alternative SSL fix
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  // Also try setting this for better compatibility
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '';
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials', credentials);
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          console.log('User not found for email:', credentials.email);
          throw new Error('Invalid credentials');
        }

        if (!user?.password) {
          console.log('User has no password:', user);
          throw new Error('Invalid credentials');
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          console.log('Incorrect password for user:', user.email);
          throw new Error('Invalid credentials');
        }

        // Return only public fields with proper type conversion
        console.log('Login successful for user:', user.email);
        return {
          id: user.id,
          name: user.name || undefined,
          email: user.email,
          image: user.image || undefined,
          role: user.role,
          language: user.language || undefined,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      // If this is a Google OAuth sign in
      if (account?.provider === 'google') {
        // Check if user already exists with this email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { accounts: true }
        });

        if (existingUser) {
          // If user exists but doesn't have a Google account linked
          const hasGoogleAccount = existingUser.accounts.some(
            acc => acc.provider === 'google'
          );

          if (!hasGoogleAccount) {
            // Link the Google account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });

            // Update user info if needed
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date(),
              },
            });

            // Return the existing user
            return true;
          }
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      // Always set email if user just signed in
      if (user && user.email && user.id) {
        token.role = user.role || 'USER';
        token.id = user.id;
        token.language = user.language;
        token.email = user.email;
      }
      // Always fetch the latest user data for existing sessions
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.language = dbUser.language || undefined;
          token.role = dbUser.role;
          token.id = dbUser.id;
          if (dbUser.email) {
            token.email = dbUser.email;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id || '';
        session.user.language = token.language;
      }
      return session;
    },
  },
}; 