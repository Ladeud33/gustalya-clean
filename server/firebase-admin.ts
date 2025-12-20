import admin from 'firebase-admin';
import type { Request, Response, NextFunction } from 'express';

type App = admin.app.App;
type DecodedIdToken = admin.auth.DecodedIdToken;

let firebaseAdmin: App | null = null;

function initializeFirebaseAdmin(): App | null {
  if (firebaseAdmin) return firebaseAdmin;
  
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('Firebase Admin: VITE_FIREBASE_PROJECT_ID not set');
    return null;
  }

  try {
    const existingApps = admin.apps || [];
    if (existingApps.length === 0) {
      firebaseAdmin = admin.initializeApp({
        projectId,
      });
      console.log('Firebase Admin initialized with project:', projectId);
    } else {
      firebaseAdmin = existingApps[0] || null;
    }
    return firebaseAdmin;
  } catch (error) {
    console.warn('Firebase Admin initialization failed (auth verification will be skipped):', error);
    return null;
  }
}

initializeFirebaseAdmin();

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing or invalid' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!firebaseAdmin) {
    console.warn('Firebase Admin not available, skipping token verification');
    next();
    return;
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  if (!firebaseAdmin) {
    next();
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  firebaseAdmin.auth().verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      next();
    })
    .catch((err) => {
      console.warn('Optional token verification failed:', err.message);
      next();
    });
}
