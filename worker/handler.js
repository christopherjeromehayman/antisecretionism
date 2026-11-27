const petitionChoice = 'petition-platform-label';
const petitionReceipt = 'petition-browser-receipt';
const options = new Set([petitionChoice,'hat','shirt','stickers','grocer','brand']);
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store'}});
function publisher(env){return /^pub-\d{16}$/.test(env.ADSENSE_PUBLISHER||'')?env.ADSENSE_PUBLISHER:null}
const legacyBrandRoutes = new Map([
  ['/maple', '/gemmy'],
  ['/maple.html', '/gemmy'],
  ['/assets/maple-scout.png', '/assets/gemmy.png'],
  ['/assets/maple-mark.png', '/assets/gemmy-mark.png'],
  ['/assets/maple.webp', '/assets/gemmy.png'],
  ['/assets/mark.svg', '/assets/gemmy-mark.png'],
  ['/favicon.ico', '/assets/gemmy-mark.png']
]);
// A receipt lets the same browser recognize a signature made while signed in.
function petitionBrowser(req) {
  const id = req.headers.get('X-Petition-Browser');
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id || '')
    ? 'petition-browser:' + id.toLowerCase() : null;
}

async function recordPetition(db, account, browser) {
  const signer = account || browser;
  const signature = db.prepare(
    'INSERT OR IGNORE INTO support(visitor, choice) SELECT ?, ? WHERE NOT EXISTS ' +
    '(SELECT 1 FROM support WHERE visitor IN (?, ?) AND choice IN (?, ?))'
  ).bind(signer, petitionChoice, account, browser, petitionChoice, petitionReceipt);
  if (account && browser) {
    const receipt = db.prepare('INSERT OR IGNORE INTO support(visitor, choice) VALUES (?, ?)')
      .bind(browser, petitionReceipt);
    await db.batch([signature, receipt]);
  } else {
    await signature.run();
  }
}

async function supportState(db, account, browser) {
  const count = db.prepare('SELECT COUNT(*) AS total FROM support WHERE choice = ?').bind(petitionChoice);
  const choices = db.prepare(
    'SELECT choice FROM support WHERE visitor = ? AND choice != ? ' +
    'UNION SELECT ? WHERE EXISTS ' +
    '(SELECT 1 FROM support WHERE visitor = ? AND choice IN (?, ?))'
  ).bind(account, petitionReceipt, petitionChoice, browser, petitionChoice, petitionReceipt);
  const [totals, selected] = await db.batch([count, choices]);
  return { total: totals.results[0].total, signedIn: Boolean(account), choices: selected.results.map(row => row.choice) };
}
export default {
 async fetch(req,env){
  const url=new URL(req.url), path=url.pathname;
  const domain = 'https://antisecretionist.com';
  const platform = 'https://anti-secretarian.drinktobasco.chatgpt.site';
  const platformRequest = url.origin === platform;
  if (['GET','HEAD'].includes(req.method) && !path.startsWith('/api/') &&
      (url.hostname === 'www.antisecretionist.com' || (platformRequest && env.CUSTOM_DOMAIN_LIVE === 'yes'))) {
    return Response.redirect(domain + path + url.search, 301);
  }
  if(path==='/api/milk-poll'){
    const kinds=['coconut','oat','soy','almond','pea','rice','other'];
    const visitor=req.headers.get('oai-authenticated-user-id');
    try{
      if(req.method==='POST'){
        if(req.headers.get('origin')!==url.origin)return json({error:'Invalid origin'},403);
        if(!visitor)return json({error:'Sign in first'},401);
        const body=await req.json().catch(()=>null);
        if(!kinds.includes(body?.kind))return json({error:'Unknown milk'},400);
        await env.DB.batch([
          env.DB.prepare("DELETE FROM support WHERE visitor=? AND choice GLOB 'milk-*'").bind(visitor),
          env.DB.prepare('INSERT INTO support(visitor,choice) VALUES (?,?)').bind(visitor,'milk-'+body.kind)
        ]);
      }else if(req.method!=='GET')return json({error:'Method not allowed'},405);
      const rows=await env.DB.prepare("SELECT substr(choice,6) AS kind, COUNT(*) AS votes FROM support WHERE choice GLOB 'milk-*' GROUP BY choice").all();
      const own=visitor?await env.DB.prepare("SELECT substr(choice,6) AS kind FROM support WHERE visitor=? AND choice GLOB 'milk-*'").bind(visitor).first():null;
      return json({signedIn:Boolean(visitor),mine:own?.kind??null,counts:Object.fromEntries(rows.results.map(row=>[row.kind,row.votes]))});
    }catch{return json({error:'Voting is temporarily unavailable'},503)}
  }
  if (path === '/api/support') {
    const account = req.headers.get('oai-authenticated-user-id');
    const browser = petitionBrowser(req);
    try {
      if (req.method === 'POST') {
        if (req.headers.get('origin') !== url.origin) return json({error:'Invalid origin'}, 403);
        const payload = await req.json().catch(() => null);
        const choice = payload?.choice;
        if (!options.has(choice)) return json({error:'Unknown choice'}, 400);
        if (choice === petitionChoice) {
          if (!account && !browser) return json({error:'Refresh the petition and try again.'}, 400);
          await recordPetition(env.DB, account, browser);
        } else {
          if (!account) return json({error:'Sign in first'}, 401);
          await env.DB.prepare('INSERT OR IGNORE INTO support(visitor,choice) VALUES (?,?)').bind(account,choice).run();
        }
      } else if (req.method !== 'GET') {
        return json({error:'Method not allowed'}, 405);
      }
      return json(await supportState(env.DB, account, browser));
    } catch {
      return json({error:'The signup service is temporarily unavailable. Please try again.'}, 503);
    }
  }
  if(!['GET','HEAD'].includes(req.method))return new Response(null,{status:405});
  const brandRedirect = legacyBrandRoutes.get(path);
  if (brandRedirect) return Response.redirect(url.origin + brandRedirect + url.search, 301);
  const pub=publisher(env);
  if(path==='/ads.txt'&&pub)return new Response('google.com, '+pub+', DIRECT, f08c47fec0942fa0\n',{headers:{'content-type':'text/plain'}});
  const asset=ASSETS[path==='/'?'/index.html':path];
  if(!asset)return new Response('Page not found',{status:404});
  const [type,b64]=asset;
  let bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  if (platformRequest && (type.startsWith('text/html') || path === '/sitemap.xml' || path === '/robots.txt')) {
    const page = new TextDecoder().decode(bytes).replaceAll(domain, platform);
    bytes = new TextEncoder().encode(page);
  }
  if(type.startsWith('text/html')&&pub){
    let tags='<meta name="google-adsense-account" content="ca-'+pub+'">';
    if(env.ADS_APPROVED==='yes'&&['/pantry','/pizza','/los-gatos','/beyond'].includes(path))tags+='<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-'+pub+'"></script>';
    bytes=new TextEncoder().encode(new TextDecoder().decode(bytes).replace('</head>',tags+'</head>'));
  }
  return new Response(req.method==='HEAD'?null:bytes,{headers:{'content-type':type,'x-content-type-options':'nosniff'}});
 }
};
