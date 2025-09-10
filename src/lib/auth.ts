import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
);

// SSL issues resolved by removing Google Fonts dependency

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        try {
          const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error) {
            console.error('Supabase error:', error);
            throw new Error('Invalid credentials');
          }

          if (!user) {
            console.error('User not found');
            throw new Error('Invalid credentials');
          }

          if (!user?.password) {
            console.error('User has no password');
            throw new Error('Invalid credentials');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            console.error('Password mismatch');
            throw new Error('Invalid credentials');
          }

          // Return only public fields
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
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
        try {
          // Check if user already exists with this email
          const { data: existingUser, error: userError } = await supabase
            .from('User')
            .select('*')
            .eq('email', user.email!)
            .single();

          if (existingUser && !userError) {
            // Update user info if needed
            await supabase
              .from('User')
              .update({
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
                emailVerified: new Date().toISOString(),
              })
              .eq('id', existingUser.id);
          } else {
            // Create new user if doesn't exist
            await supabase
              .from('User')
              .insert({
                id: user.id!,
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date().toISOString(),
                role: 'USER',
                language: 'en',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
          }
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      // Always set email if user just signed in
      if (user) {
        token.role = user.role;
      }
      // Always fetch the latest user data for existing sessions
      if (token?.email) {
        try {
          const { data: dbUser, error } = await supabase
            .from('User')
            .select('*')
            .eq('email', token.email)
            .single();
          
          if (dbUser && !error) {
            token.language = dbUser.language || undefined;
            token.role = dbUser.role;
            token.id = dbUser.id;
            if (dbUser.email) {
              token.email = dbUser.email;
            }
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id || '';
        session.user.language = token.language;
      }
      return session;
    },
  },
}; 