// Post-processes the Expo web export for GitHub Pages:
// - Arabic/RTL html attributes, PWA manifest + service worker, .nojekyll, 404 fallback.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const base = '/muamalaty/';
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

html = html.replace(/<html[^>]*>/, '<html lang="ar" dir="rtl">');
const head = [
  '<meta name="theme-color" content="#0A0C10">',
  '<meta name="description" content="معاملاتي — دليلك الذكي لإنجاز المعاملات الحكومية العراقية: المستمسكات المطلوبة، الخطوات، الرسوم، والتذكير بمواعيد انتهاء الوثائق.">',
  `<link rel="manifest" href="${base}manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}icon-192.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<style>html,body{background:#0A0C10;overscroll-behavior:none}</style>',
].join('\n');
html = html.replace('</head>', `${head}\n</head>`);
html = html.replace('</body>', `<script>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${base}sw.js',{scope:'${base}'}).catch(function(){})})}</script>\n</body>`);
fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(dist, '404.html'), html);
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

const manifest = {
  name: 'معاملاتي',
  short_name: 'معاملاتي',
  description: 'دليلك الذكي لإنجاز المعاملات الحكومية العراقية',
  lang: 'ar',
  dir: 'rtl',
  start_url: base,
  scope: base,
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0A0C10',
  theme_color: '#0A0C10',
  icons: [
    { src: `${base}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: `${base}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
for (const f of ['icon-192.png', 'icon-512.png']) {
  fs.copyFileSync(path.join(__dirname, '..', 'assets', f), path.join(dist, f));
}

// Service worker: cache-first for hashed assets, network-first for the page.
const version = Date.now().toString(36);
const sw = `const CACHE='muamalaty-${version}';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['${base}','${base}index.html'])))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
if(r.mode==='navigate'){e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('${base}index.html',cp));return res}).catch(()=>caches.match('${base}index.html')));return}
e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})))});
`;
fs.writeFileSync(path.join(dist, 'sw.js'), sw);
console.log('postbuild-web: done');
