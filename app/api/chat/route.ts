// Re-export the workbench chat route so Next.js (running from the repo root in v0)
// can serve /api/chat. The actual implementation lives in the workbench app.
export { POST, maxDuration } from '../../../apps/workbench/app/api/chat/route';
