// ReliefLink backend URL.
// On the deployed site (Vercel) we use the same-origin "/api/v1" path, which
// vercel.json proxies to the FastAPI backend on Render — no CORS issues.
// Change the fallback below if you point the frontend at a different API host.
window.RELIEF_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'https://relieflink-api.onrender.com/api/v1'
  : '/api/v1';
