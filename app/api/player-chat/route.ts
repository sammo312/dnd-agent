// Re-export the player chat route so Next.js (running from the repo root in v0)
// can serve /api/player-chat. The actual implementation lives in the player app.
export { POST, maxDuration } from '../../../apps/player/app/api/player-chat/route';
