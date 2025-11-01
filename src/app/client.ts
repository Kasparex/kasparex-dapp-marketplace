import { createThirdwebClient } from "thirdweb";

/**
 * thirdweb Client Configuration
 * 
 * To get your client ID:
 * 1. Visit https://thirdweb.com/dashboard
 * 2. Create a new project or select an existing one
 * 3. Copy your client ID from the project settings
 * 4. Add it to your .env.local file as NEXT_PUBLIC_TEMPLATE_CLIENT_ID
 * 
 * For more information, refer to:
 * https://portal.thirdweb.com/typescript/v5/client
 */
const clientId = process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "NEXT_PUBLIC_TEMPLATE_CLIENT_ID is not set. Please add it to your .env.local file."
  );
}

export const client = createThirdwebClient({
  clientId: clientId,
});
