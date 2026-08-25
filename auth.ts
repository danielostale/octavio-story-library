import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

async function refreshGoogleToken(token: any) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID!,
        client_secret: process.env.AUTH_GOOGLE_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshed.expires_in),
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Could not refresh Google access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      const allowList = (process.env.ALLOWED_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

      if (!allowList.length) return true;
      return Boolean(user.email && allowList.includes(user.email.toLowerCase()));
    },
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: account.expires_at,
          refreshToken: account.refresh_token,
        };
      }

      if (
        token.expiresAt &&
        Date.now() < Number(token.expiresAt) * 1000 - 60_000
      ) {
        return token;
      }

      if (!token.refreshToken) return { ...token, error: "NoRefreshToken" };
      return refreshGoogleToken(token);
    },
    async session({ session, token }) {
      // Used only by server route handlers in this MVP.
      session.accessToken = token.accessToken as string | undefined;
      session.authError = token.error as string | undefined;
      return session;
    },
  },
});
