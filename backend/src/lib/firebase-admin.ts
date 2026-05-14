/**
 * Optional Firebase Admin SDK init.
 *
 * If FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY are
 * present (or GOOGLE_APPLICATION_CREDENTIALS points at a service-account
 * JSON), we initialize firebase-admin and expose a custom-token minter so
 * verifyOtp can hand the mobile app a token that signs into Firebase Auth.
 *
 * If those vars are missing, every helper returns null. The /auth/verify-otp
 * route falls back to the local JWT and the mobile app continues to work
 * against this server alone — handy for dev before a Firebase project
 * exists.
 */

let cached: {
  enabled: boolean;
  mint: (uid: string, claims?: Record<string, unknown>) => Promise<string | null>;
  ensureUser: (input: {
    uid: string;
    phoneNumber: string;
    displayName?: string;
  }) => Promise<void>;
} | null = null;

async function init() {
  if (cached) return cached;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId || (!adcPath && (!clientEmail || !privateKey))) {
    cached = {
      enabled: false,
      mint: async () => null,
      ensureUser: async () => {},
    };
    return cached;
  }

  type AdminModule = typeof import('firebase-admin');
  let admin: AdminModule;
  try {
    admin = (await import('firebase-admin')) as unknown as AdminModule;
  } catch (err) {
    console.warn(
      '[firebase-admin] firebase-admin not installed; install it to mint custom tokens:',
      (err as Error).message
    );
    cached = {
      enabled: false,
      mint: async () => null,
      ensureUser: async () => {},
    };
    return cached;
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: adcPath
        ? admin.credential.applicationDefault()
        : admin.credential.cert({
            projectId,
            clientEmail: clientEmail!,
            privateKey: privateKey!,
          }),
      projectId,
    });
  }

  const auth = admin.auth();

  cached = {
    enabled: true,
    mint: async (uid, claims) => auth.createCustomToken(uid, claims),
    ensureUser: async ({ uid, phoneNumber, displayName }) => {
      try {
        await auth.getUser(uid);
        await auth.updateUser(uid, { phoneNumber, displayName });
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? '';
        if (code === 'auth/user-not-found') {
          await auth.createUser({ uid, phoneNumber, displayName });
        } else {
          throw err;
        }
      }
    },
  };
  return cached;
}

export const firebaseAdmin = {
  enabled: async (): Promise<boolean> => (await init()).enabled,
  mintCustomToken: async (uid: string, claims?: Record<string, unknown>) =>
    (await init()).mint(uid, claims),
  ensureUser: async (input: {
    uid: string;
    phoneNumber: string;
    displayName?: string;
  }) => (await init()).ensureUser(input),
};
