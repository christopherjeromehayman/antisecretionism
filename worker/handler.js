const options = new Set(['petition-platform-label','hat','shirt','stickers','grocer','brand']);
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
  if(path==='/api/support'){
    const visitor=req.headers.get('oai-authenticated-user-id');
    try{
      if(req.method==='POST'){
        if(req.headers.get('origin')!==url.origin)return json({error:'Invalid origin'},403);
        if(!visitor)return json({error:'Sign in first'},401);
        const {choice}=await req.json(); if(!options.has(choice))return json({error:'Unknown choice'},400);
        await env.DB.prepare('INSERT OR IGNORE INTO support(visitor,choice) VALUES (?,?)').bind(visitor,choice).run();
      }else if(req.method!=='GET')return json({error:'Method not allowed'},405);
      const count=await env.DB.prepare("SELECT COUNT(*) AS total FROM support WHERE choice='petition-platform-label'").first();
      const choices=visitor?(await env.DB.prepare('SELECT choice FROM support WHERE visitor=?').bind(visitor).all()).results.map(row=>row.choice):[];
      return json({total:count.total,signedIn:Boolean(visitor),choices});
    }catch{return json({error:'The signup service is temporarily unavailable. Please try again.'},503)}
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
