// Backend (Render) address used by the website and the admin panel.
// - On Render, or on localhost:5000, the backend serves the site itself, so the API is on the same address ('').
// - On any other host (Live Server :5500, Vercel, Netlify, custom domain) the API is called on RENDER_URL.
// Change RENDER_URL if the Render service address changes. No "/" at the end.
(function () {
  var RENDER_URL = 'https://patil-backend-8g8m.onrender.com';
  var h = location.hostname;
  var p = location.port;
  var sameServer = /\.onrender\.com$/.test(h) || ((h === 'localhost' || h === '127.0.0.1') && p === '5000');
  window.API_BASE = sameServer ? '' : RENDER_URL;
})();
