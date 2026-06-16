// netlify/functions/setup-db.mjs — one-time DB setup, DELETE after use
const SQL = atob("Q1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgcHVibGljLmFsZXJ0cyAoCiAgaWQgVVVJRCBERUZBVUxUIGdlbl9yYW5kb21fdXVpZCgpIFBSSU1BUlkgS0VZLAogIHBsYXllcl9pZCBURVhUIE5PVCBOVUxMLAogIHBsYXllcl9uYW1lIFRFWFQgTk9UIE5VTEwsCiAgdHJpZ2dlcl90eXBlIFRFWFQgTk9UIE5VTEwsCiAgaGVhZGxpbmUgVEVYVCBOT1QgTlVMTCwKICBzdW1tYXJ5IFRFWFQsCiAgc291cmNlIFRFWFQsCiAgdXJsIFRFWFQgVU5JUVVFLAogIGljb24gVEVYVCwKICBzZXZlcml0eSBURVhUIERFRkFVTFQgJ21lZGl1bScsCiAgcHVibGlzaGVkX2F0IFRJTUVTVEFNUFRaLAogIGNyZWF0ZWRfYXQgVElNRVNUQU1QVFogREVGQVVMVCBOT1coKQopOwpBTFRFUiBUQUJMRSBwdWJsaWMuYWxlcnRzIEVOQUJMRSBST1cgTEVWRUwgU0VDVVJJVFk7CkRST1AgUE9MSUNZIElGIEVYSVNUUyBwdWJfciBPTiBwdWJsaWMuYWxlcnRzOwpEUk9QIFBPTElDWSBJRiBFWElTVFMgcHViX2kgT04gcHVibGljLmFsZXJ0czsKQ1JFQVRFIFBPTElDWSBwdWJfciBPTiBwdWJsaWMuYWxlcnRzIEZPUiBTRUxFQ1QgVVNJTkcgKHRydWUpOwpDUkVBVEUgUE9MSUNZIHB1Yl9pIE9OIHB1YmxpYy5hbGVydHMgRk9SIElOU0VSVCBXSVRIIENIRUNLICh0cnVlKTsKQ1JFQVRFIFRBQkxFIElGIE5PVCBFWElTVFMgcHVibGljLnNjYW5fbG9nICgKICBpZCBVVUlEIERFRkFVTFQgZ2VuX3JhbmRvbV91dWlkKCkgUFJJTUFSWSBLRVksCiAgc2Nhbm5lZF9hdCBUSU1FU1RBTVBUWiBERUZBVUxUIE5PVygpLAogIHBsYXllcnNfc2Nhbm5lZCBJTlRFR0VSLCBhcnRpY2xlc19mb3VuZCBJTlRFR0VSLCBhbGVydHNfY3JlYXRlZCBJTlRFR0VSCik7CkFMVEVSIFRBQkxFIHB1YmxpYy5zY2FuX2xvZyBFTkFCTEUgUk9XIExFVkVMIFNFQ1VSSVRZOwpEUk9QIFBPTElDWSBJRiBFWElTVFMgcHViX3JsIE9OIHB1YmxpYy5zY2FuX2xvZzsKRFJPUCBQT0xJQ1kgSUYgRVhJU1RTIHB1Yl9pbCBPTiBwdWJsaWMuc2Nhbl9sb2c7CkNSRUFURSBQT0xJQ1kgcHViX3JsIE9OIHB1YmxpYy5zY2FuX2xvZyBGT1IgU0VMRUNUIFVTSU5HICh0cnVlKTsKQ1JFQVRFIFBPTElDWSBwdWJfaWwgT04gcHVibGljLnNjYW5fbG9nIEZPUiBJTlNFUlQgV0lUSCBDSEVDSyAodHJ1ZSk7CkNSRUFURSBJTkRFWCBJRiBOT1QgRVhJU1RTIGlkeF9hbF9wIE9OIHB1YmxpYy5hbGVydHMocGxheWVyX2lkKTsKQ1JFQVRFIElOREVYIElGIE5PVCBFWElTVFMgaWR4X2FsX3QgT04gcHVibGljLmFsZXJ0cyhjcmVhdGVkX2F0IERFU0MpOw==");
const REF = "hivyothlbntxcbsilktp";
export default async req => {
  const u = new URL(req.url);
  const p = u.searchParams.get("p");
  if (!p) return new Response("Add ?p=SUPABASE_PAT", {status:400});
  const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method:"POST",
    headers:{"Authorization":`Bearer ${p}`,"Content-Type":"application/json"},
    body:JSON.stringify({query:SQL})
  });
  const txt = await res.text();
  if(res.ok) return new Response(
    `<html><body style="font:16px sans-serif;padding:40px;max-width:500px;margin:auto">
    <h1 style="color:#22C55E">&#x2705; Database ready!</h1>
    <p><b>alerts</b> table created with RLS</p>
    <p><b>scan_log</b> table created with RLS</p>
    <p>Indexes on player_id + created_at</p>
    <hr><p style="color:#9CA3AF">Now run the scan function, then delete setup-db.mjs</p>
    </body></html>`,
    {headers:{"Content-Type":"text/html;charset=utf-8"}}
  );
  return new Response(
    `<html><body style="font:14px sans-serif;padding:32px"><h2 style="color:orange">Run this SQL in Supabase Dashboard &#8594; SQL Editor:</h2>
    <pre style="background:#f5f5f5;padding:14px;border-radius:8px;font-size:11px;overflow:auto;white-space:pre-wrap">` +
    SQL.replace(/</g,'&lt;') + `</pre>
    <p>Status: ${res.status} | ${txt.slice(0,300)}</p>
    </body></html>`,
    {headers:{"Content-Type":"text/html;charset=utf-8"}}
  );
};
export const config = {path:"/.netlify/functions/setup-db"};
