// YTP Nexus mockups and clickable preview (step 1.6). URL options (all optional):
//   ?look=E|N|M  &theme=dark|light|mixed  &side=dark  &shot=1
//   &font=serif|sans|geo  &nav=wide|grouped|rail  &density=airy|balanced|compact
// With no options a page shows the approved style (D-137): mixed, Bold font (geo), grouped menu, airy;
// colour Emerald or Navy, remembered in this browser. The style panel appears only when options are in the URL.
// Builds the side menu and top bar, swaps <i data-i="name"> for line icons, links screens together,
// shows a notice for screens that come in a later batch, and fits large screens to the window.
(() => {
  const P = new URLSearchParams(location.search);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage may be blocked */ } },
  };
  const pick = (key, allowed, fallback) => (allowed.includes(P.get(key)) ? P.get(key) : fallback);
  const lookParam = (P.get('look') || '').toUpperCase();
  let look = ['E', 'N', 'M'].includes(lookParam) ? lookParam : (['E', 'N'].includes(store.get('nx-look')) ? store.get('nx-look') : 'E');
  const theme = pick('theme', ['dark', 'light', 'mixed'], 'mixed');
  const font = pick('font', ['serif', 'sans', 'geo'], 'geo');
  const navStyle = pick('nav', ['wide', 'grouped', 'rail'], 'grouped');
  const density = pick('density', ['airy', 'balanced', 'compact'], 'airy');
  const root = document.documentElement;
  Object.assign(root.dataset, { look, theme, font, nav: navStyle, density });
  if (P.get('shot')) root.classList.add('shot');
  const side = P.get('side') === 'dark' || theme === 'mixed' ? 'dark' : '';
  if (side) root.dataset.side = side;
  const FONT_LINKS = {
    sans: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
    geo: 'family=Sora:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700',
  };
  if (FONT_LINKS[font]) document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${FONT_LINKS[font]}&display=swap">`);

  const ICONS = {
    grid: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="11" y="3" width="6" height="6" rx="1.5"/><rect x="3" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/>',
    tasks: '<rect x="3" y="3" width="14" height="14" rx="3.5"/><path d="M7 10.2l2.2 2.2L13.2 8"/>',
    cal: '<rect x="3" y="4.5" width="14" height="12.5" rx="2.5"/><path d="M3 8.5h14M7 2.5v4M13 2.5v4"/>',
    users: '<circle cx="8" cy="7" r="3"/><path d="M2.5 16.5c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5M13.2 4.3a3 3 0 010 5.4M15.2 12.4c1.1.8 1.9 2.1 2.3 3.6"/>',
    doc: '<path d="M5 2.5h7l3.5 3.5v11a.5.5 0 01-.5.5H5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z"/><path d="M12 2.5V6h3.5M7.5 10h5M7.5 13h3.5"/>',
    folder: '<path d="M2.5 6A1.5 1.5 0 014 4.5h3.5l1.5 2h7A1.5 1.5 0 0117.5 8v7.5A1.5 1.5 0 0116 17H4a1.5 1.5 0 01-1.5-1.5z"/>',
    globe: '<circle cx="10" cy="10" r="7.5"/><path d="M2.5 10h15M10 2.5c2 2.2 3 4.7 3 7.5s-1 5.3-3 7.5c-2-2.2-3-4.7-3-7.5s1-5.3 3-7.5z"/>',
    wallet: '<path d="M3 6.5a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M13 10h4"/>',
    user: '<circle cx="10" cy="6.5" r="3"/><path d="M4 17c.8-3 3.2-5 6-5s5.2 2 6 5"/>',
    cap: '<path d="M10 4l8 4-8 4-8-4z"/><path d="M5.5 9.8V13c1.2 1.3 2.7 2 4.5 2s3.3-.7 4.5-2V9.8"/>',
    chart: '<path d="M3 17h14M6 14V9M10 14V5M14 14v-3"/>',
    gear: '<circle cx="10" cy="10" r="2.5"/><path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4"/>',
    search: '<circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4"/>',
    bell: '<path d="M5 8a5 5 0 0110 0c0 4 1.5 5.5 1.5 5.5h-13S5 12 5 8z"/><path d="M8.5 16.5a1.6 1.6 0 003 0"/>',
    plus: '<path d="M10 4v12M4 10h12"/>',
    sun: '<circle cx="10" cy="10" r="3.2"/><path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7L6 6M14 14l1.3 1.3M4.7 15.3L6 14M14 6l1.3-1.3"/>',
    moon: '<path d="M16 12.5A6.5 6.5 0 017.5 4a6.5 6.5 0 108.5 8.5z"/>',
    right: '<path d="M8 5l5 5-5 5"/>',
    down: '<path d="M5 8l5 5 5-5"/>',
    check: '<path d="M5 10.5l3 3 7-7"/>',
    phone: '<path d="M5 3h3l1.5 4-2 1.2a9 9 0 004.3 4.3l1.2-2 4 1.5v3a1.5 1.5 0 01-1.5 1.5A13.5 13.5 0 013.5 4.5 1.5 1.5 0 015 3z"/>',
    mail: '<rect x="2.5" y="4.5" width="15" height="11" rx="2"/><path d="M3 5.5l7 5.5 7-5.5"/>',
    pin: '<path d="M10 17.5s5.5-5 5.5-9.5a5.5 5.5 0 00-11 0c0 4.5 5.5 9.5 5.5 9.5z"/><circle cx="10" cy="8" r="2"/>',
    spark: '<path d="M10 2.5l1.8 5.7 5.7 1.8-5.7 1.8-1.8 5.7-1.8-5.7-5.7-1.8 5.7-1.8z"/>',
    server: '<rect x="3" y="3.5" width="14" height="5.5" rx="1.5"/><rect x="3" y="11" width="14" height="5.5" rx="1.5"/><path d="M6 6.25h.01M6 13.75h.01"/>',
    shield: '<path d="M10 2.5l6 2.5v4.5c0 4-2.7 6.7-6 8-3.3-1.3-6-4-6-8V5z"/><path d="M7.5 10l1.8 1.8 3.2-3.3"/>',
    camera: '<rect x="3" y="3" width="14" height="14" rx="4"/><circle cx="10" cy="10" r="3.2"/><path d="M14 6h.01"/>',
    repeat: '<path d="M4 8a5 5 0 019-2.5L15 7M16 12a5 5 0 01-9 2.5L5 13"/><path d="M15 3.5V7h-3.5M5 16.5V13h3.5"/>',
    clock: '<circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l2.5 2"/>',
    filter: '<path d="M3 5h14M6 10h8M8.5 15h3"/>',
    home: '<path d="M3.5 9L10 3.5 16.5 9v7a1 1 0 01-1 1h-3.5v-5h-4v5H4.5a1 1 0 01-1-1z"/>',
    target: '<circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="4"/><circle cx="10" cy="10" r=".8"/>',
    more: '<circle cx="5" cy="10" r=".9"/><circle cx="10" cy="10" r=".9"/><circle cx="15" cy="10" r=".9"/>',
    signal: '<path d="M3 15v-2M7 15v-4M11 15V8M15 15V5"/>',
    wifi: '<path d="M2.5 8a11 11 0 0115 0M5 10.8a7.2 7.2 0 0110 0M7.6 13.5a3.4 3.4 0 014.8 0"/><path d="M10 16h.01"/>',
    battery: '<rect x="2.5" y="6" width="13" height="8" rx="2"/><path d="M17.5 9v2"/><rect x="4.3" y="7.8" width="8" height="4.4" rx=".8" fill="currentColor" stroke="none"/>',
    login: '<path d="M11 3.5h4a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5h-4"/><path d="M3.5 10h9M9.5 6.5L13 10l-3.5 3.5"/>',
    video: '<rect x="2.5" y="5" width="10.5" height="10" rx="2"/><path d="M13 8.5l4.5-2.5v8L13 11.5"/>',
    eye: '<path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2.3"/>',
    lock: '<rect x="4" y="8.5" width="12" height="8.5" rx="2"/><path d="M6.8 8.5V6.3a3.2 3.2 0 016.4 0v2.2"/>',
    trash: '<path d="M3.5 5.5h13M8 5.5V4h4v1.5M5.5 5.5l.8 11h7.4l.8-11"/>',
    history: '<path d="M3.5 10a6.5 6.5 0 102-4.7"/><path d="M3.5 3.5v3h3M10 6.5V10l2.5 1.5"/>',
    list: '<path d="M7 5.5h10M7 10h10M7 14.5h10M3.5 5.5h.01M3.5 10h.01M3.5 14.5h.01"/>',
    hash: '<path d="M7.5 3l-1.5 14M14 3l-1.5 14M3.5 7.5h14M2.5 12.5h14"/>',
    building: '<path d="M4 17V4.5A1.5 1.5 0 015.5 3h6A1.5 1.5 0 0113 4.5V17M13 8h2.5A1.5 1.5 0 0117 9.5V17M2.5 17h15M7 6.5h3M7 9.5h3M7 12.5h3"/>',
    toggle: '<rect x="2.5" y="6" width="15" height="8" rx="4"/><circle cx="13.5" cy="10" r="2"/>',
    activity: '<path d="M2.5 10h3l2-5 4 10 2-5h4"/>',
    upload: '<path d="M10 13V3.5M6.5 7L10 3.5 13.5 7M3.5 13.5v2A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5v-2"/>',
    plug: '<path d="M7 3v4M13 3v4M5 7h10v2.5a5 5 0 01-10 0zM10 14.5V17"/>',
    users2: '<circle cx="7.5" cy="7" r="2.7"/><circle cx="13.5" cy="8" r="2.2"/><path d="M2.5 16c.6-2.6 2.6-4 5-4s4.4 1.4 5 4M12.5 12.2c2-.2 4 1 4.8 3.3"/>',
    storage: '<ellipse cx="10" cy="5" rx="6.5" ry="2.5"/><path d="M3.5 5v10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5M3.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5"/>',
    // batch 2
    mic: '<rect x="7.5" y="2.5" width="5" height="9.5" rx="2.5"/><path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v2.5"/>',
    msg: '<path d="M3.5 5A1.5 1.5 0 015 3.5h10A1.5 1.5 0 0116.5 5v7.5A1.5 1.5 0 0115 14H8l-3.5 3v-3H5a1.5 1.5 0 01-1.5-1.5z"/>',
    clip: '<path d="M15.5 9.5l-5.8 5.8a3.5 3.5 0 01-5-5l6.4-6.4a2.3 2.3 0 013.3 3.3l-6.3 6.3a1.2 1.2 0 01-1.7-1.7l5.6-5.6"/>',
    send: '<path d="M3 10l14-6.5L12 17l-2.5-5.5z"/><path d="M9.5 11.5L17 3.5"/>',
    x: '<path d="M5 5l10 10M15 5L5 15"/>',
    edit: '<path d="M12.5 4l3.5 3.5L7.5 16H4v-3.5z"/>',
    download: '<path d="M10 3.5V13M6.5 9.5L10 13l3.5-3.5M3.5 13.5v2A1.5 1.5 0 005 17h10a1.5 1.5 0 001.5-1.5v-2"/>',
    link: '<path d="M8.5 11.5a3.2 3.2 0 004.6 0l2.6-2.6a3.2 3.2 0 00-4.6-4.6l-1 1"/><path d="M11.5 8.5a3.2 3.2 0 00-4.6 0l-2.6 2.6a3.2 3.2 0 004.6 4.6l1-1"/>',
    inbox: '<path d="M3 11l2-6.5h10l2 6.5v4.5a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M3 11h4l1 2h4l1-2h4"/>',
    tag: '<path d="M3 3.5h6.5L17 11l-6 6-7.5-7.5V4a.5.5 0 01.5-.5z"/><circle cx="7" cy="7" r="1.2"/>',
    grip: '<circle cx="8" cy="5" r=".9"/><circle cx="12" cy="5" r=".9"/><circle cx="8" cy="10" r=".9"/><circle cx="12" cy="10" r=".9"/><circle cx="8" cy="15" r=".9"/><circle cx="12" cy="15" r=".9"/>',
    cloud: '<path d="M6 15.5h8.5a3.5 3.5 0 00.4-7A5 5 0 005.3 9 3.3 3.3 0 006 15.5z"/>',
    key: '<circle cx="7" cy="12" r="3.5"/><path d="M9.5 9.5L16 3M13.5 5.5l2 2M11.5 7.5l1.5 1.5"/>',
    file: '<path d="M5.5 2.5h6l4 4v10.5a.5.5 0 01-.5.5h-9.5a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z"/><path d="M11.5 2.5v4h4"/>',
    image: '<rect x="3" y="3.5" width="14" height="13" rx="2"/><circle cx="7.5" cy="8" r="1.5"/><path d="M3.5 14.5l4-4 3 3 2-2 4 4"/>',
    bolt: '<path d="M11 2.5L4.5 11H10l-1 6.5L15.5 9H10z"/>',
    copy: '<rect x="6.5" y="6.5" width="10" height="10" rx="2"/><path d="M13.5 6.5V5A1.5 1.5 0 0012 3.5H5A1.5 1.5 0 003.5 5v7A1.5 1.5 0 005 13.5h1.5"/>',
    at: '<circle cx="10" cy="10" r="3"/><path d="M13 10v1.2a2.3 2.3 0 004.5 0V10a7.5 7.5 0 10-3 6"/>',
    chat: '<path d="M10 2.8a7.2 7.2 0 00-6.3 10.7L2.8 17.2l3.8-.9A7.2 7.2 0 1010 2.8z"/><path d="M7.5 7.5c0 2.8 2.2 5 5 5l1-1.2-1.6-.9-.8.7a3.3 3.3 0 01-2.2-2.2l.7-.8-.9-1.6z"/>',
    sort: '<path d="M6 4v12M3.5 13.5L6 16l2.5-2.5M14 16V4M11.5 6.5L14 4l2.5 2.5"/>',
    refresh: '<path d="M16 10a6 6 0 11-1.8-4.3L16 7.5"/><path d="M16 3.5v4h-4"/>',
    flag: '<path d="M4.5 17.5V3.5M4.5 4h10l-2 3.5 2 3.5h-10"/>',
    thumb: '<path d="M7 9.5l3.2-6.2c1.1 0 1.9.9 1.9 2v3.2h3.9a1.5 1.5 0 011.5 1.8l-1.1 5.6a1.5 1.5 0 01-1.5 1.2H7z"/><path d="M3.5 9.5H7v7.6H3.5z"/>',
    briefcase: '<rect x="3" y="6.5" width="14" height="10" rx="2"/><path d="M7.5 6.5V5a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0112.5 5v1.5M3 10.5h14"/>',
    star: '<path d="M10 2.8l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 8.1l5-.7z"/>',
    bell2: '<path d="M5 8a5 5 0 0110 0c0 4 1.5 5.5 1.5 5.5h-13S5 12 5 8z"/>',
    // batch 8
    info: '<circle cx="10" cy="10" r="7.5"/><path d="M10 9v4.5M10 6.5h.01"/>',
    play: '<path d="M7 4.5v11l9-5.5z"/>',
    stop: '<rect x="5" y="5" width="10" height="10" rx="2"/>',
    code: '<path d="M7 6l-4 4 4 4M13 6l4 4-4 4"/>',
  };
  // YouTooPreneur hexagon icon (from assets/brand/icon.svg), drawn in the theme's logo colour.
  const LOGO = '<svg class="mark" viewBox="0 0 190.43 211.82" fill="currentColor" role="img" aria-label="YouTooPreneur"><path d="M61.3,70l6.31,4c2.56,1.65,5.11,3.31,7.68,4.94a2.67,2.67,0,0,1,1.24,1.68Q81.9,100,87.32,119.4c.05.18.11.35.19.6a1.61,1.61,0,0,0,.48-.93c2.59-8.49,5.21-17,7.76-25.49.32-1,.65-1,1.47-.52,4.32,2.83,8.64,5.63,13,8.39a1.4,1.4,0,0,1,.67,2c-5,14.75-10,29.52-15,44.26a10.8,10.8,0,0,0-.47,4q.35,7.95.68,15.92.57,13.32,1.13,26.64c0,.85,0,1.7,0,2.54s-.25.76-.78.42c-4-2.61-8.08-5.23-12.14-7.82a1.72,1.72,0,0,1-.73-1.58c-.09-2.15-.2-4.31-.28-6.46-.25-6.73-.48-13.46-.76-20.19s-.52-13.46-.92-20.19c-.13-2.1-1.06-4.08-1.65-6.11Q70.79,103.16,61.5,71.5A2.64,2.64,0,0,1,61.3,70Z" transform="translate(-29.13 -19.65)"/><path d="M182.9,59.67q-28.05,20-56.51,39.21l.12.25,3.7-1.48c1.54-.63,1.55-.63,1.69,1q1.07,12,2.14,24c.81,8.85,1.66,17.69,2.49,26.54.31,3.33.59,6.66.93,10a1.43,1.43,0,0,1-1.11,1.78c-8,2.88-16,5.82-24.07,8.73-1.27.46-1.33.45-1.21-.87.41-4.87.87-9.73,1.31-14.6l1-11.14q.66-7.12,1.31-14.25l1.23-13.56c.44-4.82.89-9.65,1.32-14.48.14-1.57.23-3.14.4-4.71.08-.73-.44-.92-.86-1.22L91,76.92Q79,68.58,67,60.23c-.25-.17-.48-.36-.87-.66a1.91,1.91,0,0,1,1.24.4Q88,70.66,108.65,81.39a4.52,4.52,0,0,0,2.09.52c9.28,0,18.56,0,27.84,0a7.78,7.78,0,0,0,3.66-1.26q19.56-10.05,39.07-20.19C181.84,60.19,182.37,59.94,182.9,59.67Z" transform="translate(-29.13 -19.65)"/><path d="M35.83,96.69c0,7.85,0,15.71,0,23.56,0,1.08-.23,1.53-1.39,1.43a30.27,30.27,0,0,0-3.81,0c-.81,0-1.11-.3-1.11-1.06,0-1.43,0-2.85,0-4.28-.08-5.89-.09-11.78-.27-17.67-.13-4.2-.15-8.39.05-12.58.29-6.13,1.4-12,5.6-16.85a33.82,33.82,0,0,1,7.7-6.41c5.5-3.46,11.25-6.5,17-9.61,15.15-8.25,29.92-17.15,44.69-26a78.58,78.58,0,0,1,11.19-5.72,23,23,0,0,1,18.18.15,118,118,0,0,1,16,8.5c16,9.84,32.35,19.1,48.82,28.13a67.59,67.59,0,0,1,13.4,9,22.17,22.17,0,0,1,7,13.43c1,6.39.76,12.83.62,19.25-.09,4.58-.11,9.16-.24,13.74-.06,2.35-.12,4.69-.13,7,0,.74-.23,1-1,1-1.38,0-2.77-.06-4.15,0-1,0-1.18-.35-1.16-1.21.11-5.35.15-10.71.28-16,.16-6.62.25-13.24-.06-19.86-.35-7.53-4.2-12.68-10.4-16.52-6.94-4.31-14.16-8.11-21.29-12.08-12.84-7.16-25.43-14.75-38.06-22.27a98.82,98.82,0,0,0-11.84-6.22,17.28,17.28,0,0,0-14.1,0A109.5,109.5,0,0,0,103.39,35q-23.69,14.4-48,27.67c-3.69,2-7.31,4.12-10.8,6.44s-6.38,5.1-7.7,9.21a28.71,28.71,0,0,0-1.27,8c-.09,3.46,0,6.93,0,10.4Z" transform="translate(-29.13 -19.65)"/><path d="M32.85,167.59c.83.09,2-.38,2.77.2s.49,1.87.67,2.84a16.43,16.43,0,0,0,7.12,10.54A128.12,128.12,0,0,0,57,189.31c17.1,9.25,33.81,19.18,50.46,29.2a71.76,71.76,0,0,0,10.35,5.33,16.79,16.79,0,0,0,13.14,0c1.74-.71,3.45-1.51,5.11-2.39,8.55-4.51,16.69-9.73,25-14.64,12-7.08,24.17-13.7,36.27-20.53a57,57,0,0,0,10-6.81,15.72,15.72,0,0,0,5.2-9.76c0-.15,0-.31.06-.46.27-1.66.27-1.66,2-1.67,1.12,0,2.24,0,3.35,0,.91,0,1.24.28,1.14,1.2-.7,6.2-3,11.57-7.84,15.71a79.51,79.51,0,0,1-14.12,9.15c-18.26,9.86-36.08,20.48-53.87,31.14a75.36,75.36,0,0,1-9.39,4.68,23.49,23.49,0,0,1-19.15-.07,121.32,121.32,0,0,1-15.6-8.5c-16-9.8-32.34-19.08-48.82-28.1-4.66-2.54-9.31-5.1-13.28-8.72a22.59,22.59,0,0,1-7.25-14.54c-.23-1.93-.19-1.94,1.8-1.94Z" transform="translate(-29.13 -19.65)"/><path d="M108.28,199.21c.42-4.75.84-9.35,1.23-14a1.38,1.38,0,0,1,1.06-1.31q13.55-4.92,27.08-9.89c1-.37,1.15,0,1.23.88.57,6.43,1.18,12.86,1.77,19.29.16,1.77.32,3.53.49,5.29a1.71,1.71,0,0,1-.44,1.26q-7.68,10-15.35,20c-.52.67-.8.72-1.34,0q-7.58-9.92-15.21-19.77A2.3,2.3,0,0,1,108.28,199.21Z" transform="translate(-29.13 -19.65)"/><path d="M124.84,78.21A12.14,12.14,0,0,1,112.71,66a12.16,12.16,0,1,1,24.32.1A12.06,12.06,0,0,1,124.84,78.21Z" transform="translate(-29.13 -19.65)"/><path d="M192.17,108.93c-.43-5.18-.88-10.35-1.3-15.52s-.79-10.43-1.24-15.64a13.87,13.87,0,0,0-.83-4.63,4.09,4.09,0,0,0-5.31-2.38,9.37,9.37,0,0,0-2.71,1.51l-10.53,7.9q-13.35,10-26.7,20a1.76,1.76,0,0,0-.87,1.81c.23,2.14.33,4.29.5,6.44q.51,6.27,1,12.53.65,7.88,1.3,15.75.51,6.33,1,12.65.65,7.88,1.3,15.75c.42,5.18.81,10.35,1.24,15.53s.86,10.34,1.3,15.52c0,.39-.18,1,.28,1.14s.74-.33,1.07-.57c4.37-3.28,8.72-6.59,13.13-9.82a2.3,2.3,0,0,0,1-2.43c-.34-3.36-.59-6.74-.86-10.11l-1-12.65c-.35-4.41-.7-8.82-1.08-13.22a1.8,1.8,0,0,1,.88-1.81q10.88-8.11,21.7-16.28c4.78-3.62,6.82-8.66,7.27-14.18C192.52,113.6,192.36,111.26,192.17,108.93Zm-13.59,6.95-17.31,12.29a1.87,1.87,0,0,1-.45.16c-.23-1.63-.47-3.21-.68-4.79-.6-4.41-1.16-8.83-1.8-13.24a2.3,2.3,0,0,1,1.08-2.59c5.4-3.75,10.74-7.6,16.1-11.41.47-.33,1-.87,1.14.25.8,6.06,1.58,12.11,2.4,18.16A1.06,1.06,0,0,1,178.58,115.88Z" transform="translate(-29.13 -19.65)"/><path d="M138.38,169.73a1,1,0,0,1-.73,1.25q-13.38,4.88-26.75,9.81c-.66.24-1,.21-.92-.66q.34-3,.59-6a1.09,1.09,0,0,1,.85-1.06l25.43-9.37c.68-.25,1-.14,1.07.62C138.06,166.17,138.23,168,138.38,169.73Z" transform="translate(-29.13 -19.65)"/></svg>';
  const icon = (k) => `<svg class="i" viewBox="0 0 20 20" aria-hidden="true">${ICONS[k] || ''}</svg>`;

  const NAV = [
    ['Command Centre', 'grid'], ['Tasks', 'tasks'], ['Calendar', 'cal'], null,
    ['CRM', 'users'], ['Contracts & Renewals', 'doc'], ['Projects', 'folder'], ['WebCare', 'globe'],
    ['Finance', 'wallet'], ['Team', 'user'], ['Academy', 'cap'], null,
    ['Reports', 'chart'], ['Settings', 'gear'],
  ];
  const esc = (s) => s.replace(/&/g, '&amp;');
  // Short labels for the slim icon menu, and section names for the grouped menu.
  const SHORT = { 'Command Centre': 'Home', 'Contracts & Renewals': 'Contracts' };
  const GROUPS = ['Daily work', 'Business', 'Insights & admin'];
  // Clickable preview: screens built so far, and the batch that brings the others.
  const PAGES = { 'Command Centre': 'dashboard.html', Tasks: 'tasks.html', Calendar: 'calendar.html', CRM: 'leads.html', 'Contracts & Renewals': 'renewals.html', Projects: 'projects.html', WebCare: 'webcare.html', Finance: 'finance.html', Team: 'people.html', Academy: 'academy.html', Reports: 'reports.html', Settings: 'settings.html' };
  const SOON = {};
  const BATCHES = { 2: 'Core', 3: 'CRM + Team', 4: 'WebCare + Finance', 5: 'Contracts + Command Centre', 6: 'Projects + meetings', 7: 'Sales + Payroll', 8: 'Portals, Reports, API, AI', 9: 'Academy' };
  const link = (name) => (PAGES[name] ? ` href="${PAGES[name]}"` : SOON[name] ? ` data-soon="${SOON[name]}"` : '');

  // Section menus for big areas (batch 4 on): <div class="app" data-sec="finance" data-sec-on="invoices">.
  const SECNAV = {
    finance: [['overview', 'Overview', 'finance.html'], ['invoices', 'Invoices', 'invoices.html'], ['payments', 'Payments', 'payments.html'], ['collections', 'Collections', 'collections.html'], ['adspend', 'Ad spend', 'ad-spend.html'], ['vendors', 'Vendors and bills', 'vendors.html'], ['expenses', 'Expenses', 'expenses.html'], ['payouts', 'Payouts', 'payouts.html'], ['subs', 'YTP subscriptions', 'subscriptions.html'], ['partners', 'LLP partners', 'partners.html', 'lock'], ['settings', 'Settings', 'finance-settings.html']],
    crm: [['leads', 'Leads and clients', 'leads.html'], ['pipeline', 'Pipeline', 'pipeline.html'], ['proposals', 'Proposals', 'proposals.html'], ['campaigns', 'Campaigns', 'campaigns.html'], ['broadcasts', 'Broadcasts', 'broadcasts.html'], ['live', 'Live chat', 'live-chat.html']],
    academy: [['dash', 'Dashboard', 'academy.html'], ['courses', 'Courses', 'courses.html'], ['batches', 'Batches', 'batches.html'], ['admissions', 'Admissions', 'admissions.html'], ['students', 'Students', 'students.html'], ['assess', 'Assessments', 'assessments.html'], ['certs', 'Certificates', 'certificates.html'], ['fees', 'Fees', 'academy-fees.html']],
    reports: [['home', 'All reports', 'reports.html'], ['report', 'Revenue and profitability', 'report.html'], ['results', 'Client results', 'client-results.html'], ['creports', 'Client reports', 'client-reports.html']],
    projects: [['projects', 'Projects', 'projects.html'], ['content', 'Content calendar', 'content-calendar.html'], ['support', 'Support', 'support.html'], ['changes', 'Change requests', 'change-requests.html'], ['inputs', 'Client inputs', 'client-inputs.html'], ['testimonials', 'Testimonials', 'testimonials.html'], ['cases', 'Case studies', 'case-studies.html']],
    calendar: [['calendar', 'Calendar', 'calendar.html'], ['meetings', 'Meetings', 'meetings.html']],
    contracts: [['renewals', 'Renewals board', 'renewals.html'], ['services', 'Services sold', 'services-sold.html'], ['agreements', 'Agreements', 'agreements.html'], ['amc', 'AMC and free maintenance', 'amc.html'], ['subs', 'Subscriptions and products', 'subscriptions-sold.html']],
    webcare: [['assets', 'Digital assets', 'webcare.html'], ['expiry', 'Expiry monitor', 'expiry.html'], ['servers', 'Servers and hosting', 'servers.html'], ['providers', 'Provider accounts', 'providers.html'], ['dossiers', 'Technical dossiers', 'dossier.html'], ['handover', 'Handovers', 'handover.html']],
  };
  function secnav(app) {
    const list = SECNAV[app.dataset.sec];
    if (!list) return;
    const on = app.dataset.secOn;
    const html = `<nav class="secnav" aria-label="Section">${list.map(([k, n, href, ic]) => `<a class="${k === on ? 'on' : ''}" href="${href}">${ic ? icon(ic) : ''}${esc(n)}</a>`).join('')}</nav>`;
    app.querySelector('main header.top').insertAdjacentHTML('afterend', html);
  }
  // Pseudo QR codes for UPI and secret links: <span class="upi-qr" data-qr="seed"></span>.
  function qr(el) {
    const n = 29;
    let seed = [...(el.dataset.qr || 'nexus')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const cells = [];
    const finder = (x, y) => {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        if (edge || core) cells.push([x + i, y + j]);
      }
    };
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) if (!inFinder(x, y) && rnd() < 0.47) cells.push([x, y]);
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    el.innerHTML = `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" role="img" aria-label="UPI QR code (sample)"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/>${cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`).join('')}</svg>`;
  }

  // Client portal frame (batch 8): <div class="portal" data-pon="home" data-who="KH|Kaveri Hospitals|Dr. Rao|#047857" data-lang="en">
  const PORTAL = [['home', 'Home', 'portal-home.html'], ['invoices', 'Invoices', 'portal-invoices.html'], ['services', 'Services', 'portal-services.html'], ['projects', 'Projects', 'portal-projects.html'], ['content', 'Content', 'portal-content.html'], ['support', 'Support', 'portal-support.html'], ['inputs', 'Files we need', 'portal-inputs.html'], ['proposals', 'Proposals', 'portal-proposals.html'], ['docs', 'Documents', 'portal-docs.html']];
  const STUDENT = [['home', 'Home', 'student-home.html'], ['courses', 'My courses', 'student-courses.html'], ['fees', 'Fees', 'student-fees.html'], ['results', 'Attendance and results', 'student-results.html'], ['certs', 'Certificates', 'student-certificates.html']];
  // Portal languages (D-083): code, name shown in the switch, English name on hover.
  // All 5 are built, but each opens only after a native speaker's check (choice 11, 22 Oct):
  // in the sample Tamil is checked; Hindi, Malayalam and Telugu are drafts, so they are not offered yet.
  const PLANGS = [['en', 'EN', 'English'], ['ta', 'தமிழ்', 'Tamil']];
  function portalShell(el, list, kind) {
    const [ini, org, person, col] = (el.dataset.who || 'KH|Kaveri Hospitals|Dr. Rao|#047857').split('|');
    const on = el.dataset.pon;
    const ta = el.dataset.lang === 'ta';
    const TA = { home: 'முகப்பு', invoices: 'இன்வாய்ஸ்கள்', services: 'சேவைகள்', projects: 'திட்டங்கள்', content: 'பதிவுகள்', support: 'உதவி', inputs: 'தேவையான கோப்புகள்', proposals: 'முன்மொழிவுகள்', docs: 'ஆவணங்கள்' };
    const nav = list.map(([k, n, href]) => `<a class="${k === on ? 'on' : ''}" href="${href}">${esc(ta && TA[k] ? TA[k] : n)}</a>`).join('');
    const brand = kind === 'student' ? 'YouTooPreneur Academy' : 'YouTooPreneur';
    // Fonts for the language names in the switch (Tamil, Hindi, Malayalam, Telugu).
    if (!document.getElementById('nx-lang-fonts')) document.head.insertAdjacentHTML('beforeend', '<link id="nx-lang-fonts" rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@700&family=Noto+Sans+Devanagari:wght@700&family=Noto+Sans+Malayalam:wght@700&family=Noto+Sans+Telugu:wght@700&display=swap">');
    el.insertAdjacentHTML('afterbegin', `<header class="ptop">
      <div class="pbrand">${LOGO}<span><b>${brand}</b><small>${kind === 'student' ? 'Student portal' : 'Client portal'}</small></span></div>
      <nav class="pnav">${nav}</nav>
      <div class="pme"><div class="plang" aria-label="Language">${PLANGS.map(([k, n, t]) => `<span class="${k === (ta ? 'ta' : 'en') ? 'on' : ''}" lang="${k}" title="${t}">${n}</span>`).join('')}</div><a class="pwho" href="${kind === 'student' ? 'student-home.html' : 'portal-profile.html'}"><span class="lg-av" style="--av:${col}">${ini}</span><span><b>${esc(person)}</b><small>${esc(org)}</small></span></a></div>
    </header>`);
  }

  function shell(app) {
    const active = app.hasAttribute('data-active') ? app.dataset.active : 'Command Centre';
    const [meIn, meName, meRole, meCol] = (app.dataset.me || 'YP|Owner|YouTooPreneur').split('|');
    const hidden = (app.dataset.hide || '').split(',').map((x) => x.trim()).filter(Boolean);
    const badge = app.dataset.badge || '5';
    const avStyle = meCol ? ` style="background:color-mix(in srgb,${meCol} 16%,#fff);color:${meCol};border-color:transparent"` : '';
    const item = (n) => `<a class="${n[0] === active ? 'on' : ''}"${link(n[0])}>${icon(n[1])}<span class="lbl">${esc(navStyle === 'rail' ? SHORT[n[0]] || n[0] : n[0])}</span>${n[0] === 'Command Centre' ? `<span class="badge">${badge}</span>` : ''}</a>`;
    // Menu groups (split at the gaps in NAV); a group whose items are all hidden for this person is left out.
    const groups = [[]];
    NAV.forEach((n) => { if (n) groups[groups.length - 1].push(n); else groups.push([]); });
    const shown = groups.map((grp) => grp.filter((n) => !hidden.includes(n[0])));
    const nav = navStyle === 'grouped'
      ? shown.map((grp, i) => (grp.length ? `<div class="navlabel">${esc(GROUPS[i])}</div>` + grp.map(item).join('') : '')).join('')
      : shown.filter((grp) => grp.length).map((grp) => grp.map(item).join('')).join('<div class="gap"></div>');
    app.insertAdjacentHTML('afterbegin', `<aside class="side">
      <div class="brand">${LOGO}<span class="word serif">Nexus</span></div>
      ${navStyle === 'wide' ? '<div class="navlabel">Workspace</div>' : ''}<nav>${nav}</nav>
      <a class="me" href="my-profile.html" style="text-decoration:none;color:inherit"><div class="av"${avStyle}>${meIn}</div><div><b>${esc(meName)}</b><span>${esc(meRole)}</span></div></a>
    </aside>`);
    app.querySelector('main').insertAdjacentHTML('afterbegin', `<header class="top">
      <a class="search" href="search.html" title="Search or ask Nexus">${icon('search')}<span class="q">Search or ask Nexus…</span><span class="mic" data-go="voice.html" title="Voice assistant: press to talk">${icon('mic')}</span><kbd>Ctrl K</kbd></a>
      <div class="spacer"></div>
      ${theme === 'mixed'
        ? `<div class="colour-switch" role="radiogroup" aria-label="Colour">${[['E', 'Emerald'], ['N', 'Navy']].map(([k, n]) => `<button role="radio" aria-checked="${k === look}" data-look="${k}" title="${n}"><span class="pv pv-${k}"><i></i></span><span class="nm">${n}</span></button>`).join('')}</div>`
        : `<div class="seg" aria-label="Theme"><button data-set="light" title="Light">${icon('sun')}</button><button data-set="dark" title="Dark">${icon('moon')}</button></div>`}
      <a class="ghost" href="my-profile.html#preferences" style="text-decoration:none" title="Language">EN</a>
      <a class="icon-btn ai-ib" href="ask-nexus.html" title="Ask Nexus (AI chat)">${icon('spark')}</a>
      <a class="icon-btn" href="notifications.html" title="Notifications">${icon('bell')}<span class="dot"></span></a>
      <a class="primary" href="quick-add.html">${icon('plus')}Quick add</a>
      <a class="av" href="my-profile.html" style="text-decoration:none${meCol ? `;background:color-mix(in srgb,${meCol} 16%,#fff);color:${meCol};border-color:transparent` : ''}" title="My profile">${meIn}</a>
    </header>`);
  }

  let toastTimer = 0;
  function toast(msg) {
    let t = document.querySelector('.nx-toast');
    if (!t) { t = document.createElement('div'); t.className = 'nx-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }
  // Large screens are designed at 1600 px; in a smaller window they are scaled down to fit, never cut off.
  function fit() {
    if (root.classList.contains('shot')) return;
    const w = document.documentElement.clientWidth;
    if (!w) return; // a hidden window reports 0; keep the last size
    const z = Math.min(1, w / 1600);
    document.querySelectorAll('.app, .auth').forEach((el) => { el.style.zoom = z < 1 ? String(z) : ''; });
  }
  window.NX = { toast, store };

  const SCREENS = [['dashboard.html', 'Dashboard'], ['client-profile.html', 'Client'], ['pipeline.html', 'Pipeline'], ['phone.html', 'Phone']];
  const LOOKS = [['E', 'Emerald'], ['N', 'Navy'], ['M', 'Mono']];
  function switcher() {
    const page = location.pathname.split('/').pop() || 'dashboard.html';
    const state = { look, theme, side: theme === 'mixed' ? '' : side, font, nav: navStyle, density };
    const url = (p, change = {}) => {
      const s = { ...state, ...change };
      const q = new URLSearchParams({ look: s.look, theme: s.theme });
      if (s.side && s.theme !== 'mixed') q.set('side', s.side);
      for (const [k, def] of [['font', 'geo'], ['nav', 'grouped'], ['density', 'airy']]) if (s[k] !== def) q.set(k, s[k]);
      return `${p}?${q}`;
    };
    const cap = (t) => t[0].toUpperCase() + t.slice(1);
    const seg = (label, links) => `<div class="sw-row"><span class="sw-lbl">${label}</span><div class="sw-seg">${links.join('')}</div></div>`;
    const row = (label, key, opts) => seg(label, opts.map(([v, n]) => `<a class="${state[key] === v ? 'on' : ''}" href="${url(page, { [key]: v })}">${n}</a>`));
    // The panel can be folded away; the choice is remembered in this browser only.
    let folded = false;
    try { folded = localStorage.getItem('nx-switcher-folded') === '1'; } catch { /* storage may be blocked */ }
    document.body.insertAdjacentHTML('beforeend', `<div class="switcher${folded ? ' folded' : ''}">
      <button class="sw-head" type="button"><span>Style preview</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 12.5l5-5 5 5"/></svg></button>
      <div class="sw-body">
        ${row('Look', 'look', LOOKS)}
        ${row('Theme', 'theme', ['dark', 'light', 'mixed'].map((t) => [t, cap(t)]))}
        ${row('Menu', 'side', [['', 'Same'], ['dark', 'Dark']])}
        ${row('Font', 'font', [['serif', 'Classic'], ['sans', 'Modern'], ['geo', 'Bold']])}
        ${row('Nav', 'nav', [['wide', 'Wide'], ['grouped', 'Grouped'], ['rail', 'Slim']])}
        ${row('Spacing', 'density', [['airy', 'Airy'], ['balanced', 'Balanced'], ['compact', 'Compact']])}
        ${seg('Screen', SCREENS.map(([p, n]) => `<a class="${p === page ? 'on' : ''}" href="${url(p)}">${n}</a>`))}
      </div>
    </div>`);
    const panel = document.querySelector('.switcher');
    panel.querySelector('.sw-head').addEventListener('click', () => {
      panel.classList.toggle('folded');
      try { localStorage.setItem('nx-switcher-folded', panel.classList.contains('folded') ? '1' : '0'); } catch { /* ignore */ }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('.app');
    if (app) { shell(app); secnav(app); }
    const portal = document.querySelector('.portal');
    if (portal) portalShell(portal, portal.dataset.kind === 'student' ? STUDENT : PORTAL, portal.dataset.kind);
    document.querySelectorAll('[data-qr]').forEach(qr);
    document.querySelectorAll('span.mark').forEach((el) => { const st = el.getAttribute('style'); el.outerHTML = st ? LOGO.replace('class="mark"', `class="mark" style="${st}"`) : LOGO; });
    document.querySelectorAll('i[data-i]').forEach((el) => { el.outerHTML = icon(el.dataset.i); });
    // Colour switch: changes Emerald / Navy at once and remembers it in this browser.
    const colourButtons = () => document.querySelectorAll('.colour-switch button');
    colourButtons().forEach((b) => {
      b.classList.toggle('on', b.dataset.look === look);
      b.addEventListener('click', () => {
        look = b.dataset.look;
        root.dataset.look = look;
        store.set('nx-look', look);
        colourButtons().forEach((x) => { x.classList.toggle('on', x.dataset.look === look); x.setAttribute('aria-checked', String(x.dataset.look === look)); });
      });
    });
    document.querySelectorAll('.seg button').forEach((b) => {
      b.classList.toggle('on', b.dataset.set === theme);
      b.addEventListener('click', () => { P.set('theme', b.dataset.set); location.search = `?${P}`; });
    });
    // Tabs: <div data-tabs="g"><button data-tab="x"> … and panels <section data-group="g" data-panel="x">.
    document.querySelectorAll('[data-tabs]').forEach((group) => {
      const btns = [...group.querySelectorAll('button[data-tab]')];
      const show = (t) => {
        btns.forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
        document.querySelectorAll(`[data-group="${group.dataset.tabs}"][data-panel]`).forEach((pnl) => { pnl.hidden = pnl.dataset.panel !== t; });
      };
      btns.forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
      const h = location.hash.slice(1);
      show(btns.some((b) => b.dataset.tab === h) ? h : btns[0].dataset.tab);
    });
    // Screens that come in a later batch show a short notice instead.
    document.addEventListener('click', (e) => {
      // AI helpers (✦): explained, not run, in the preview.
      const ai = e.target.closest('[data-ai]');
      if (ai) { e.preventDefault(); toast(ai.dataset.ai || 'AI helper: comes with the step that builds this screen, once AI is switched on. The result arrives as a draft for you to check.'); return; }
      const go = e.target.closest('[data-go]');
      if (go) { e.preventDefault(); location.href = go.dataset.go; return; }
      const el = e.target.closest('[data-soon]');
      if (!el) return;
      e.preventDefault();
      const n = el.dataset.soon;
      toast(el.dataset.msg || (BATCHES[n] ? `This screen comes in batch ${n} (${BATCHES[n]}).` : 'This screen comes in a later batch.'));
    });
    fit();
    addEventListener('resize', fit);
    if (location.search) switcher();
  });
})();
