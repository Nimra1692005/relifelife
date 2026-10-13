// ReliefLink API base.
// The backend now runs as Vercel Serverless Functions at /api/v1/* (same origin),
// so on the deployed site we use the relative path — no CORS at all.
// On localhost we point at the deployed functions so local previews stay live.
window.RELIEF_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'https://relieflink-neon.vercel.app/api/v1'
  : '/api/v1';
