import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "6858acef3c5db36f32c5d557", 
  requiresAuth: false // Ensure authentication is required for all operations
});
