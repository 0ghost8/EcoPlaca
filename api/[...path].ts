import app from '../backend/src/app';
import { validateRuntimeEnvironment } from '../backend/src/config/env';

// Vercel owns the HTTP server; reuse Express without starting server.ts.
validateRuntimeEnvironment();

export default app;
