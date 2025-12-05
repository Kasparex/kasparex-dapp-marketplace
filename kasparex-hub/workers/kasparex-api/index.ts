/**
 * Kasparex API Main Handler
 * 
 * Routes requests to appropriate Kasparex API modules
 */

import type { Env } from '../index';
import { handleNodeRequest } from './nodes';
import { handleRewardRequest } from './rewards';
import { handlePublicRequest } from './public';

export async function handleKasparexRequest(
  request: Request,
  env: Env,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Node management endpoints
  if (pathname.startsWith('/kasparex/node/')) {
    return handleNodeRequest(request, env, corsHeaders);
  }

  // Reward endpoints
  if (pathname.startsWith('/kasparex/rewards/')) {
    return handleRewardRequest(request, env, corsHeaders);
  }

  // Public data endpoints
  if (pathname.startsWith('/kasparex/nodes') || 
      pathname.startsWith('/kasparex/dapps/availability') ||
      pathname === '/kasparex/stats') {
    return handlePublicRequest(request, env, corsHeaders);
  }

  return new Response('Not found', {
    status: 404,
    headers: corsHeaders,
  });
}



