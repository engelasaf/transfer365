// netlify/functions/setup-email.mjs — DELETE after use
// v2 — reads from Netlify env vars
export default async req => {
  const u=new URL(req.url);
  if(u.searchParams.get("run")!=="yes")return new Response("Add ?run=yes",{status:400});

  const PAT = Netlify.env.get("SUPABASE_PAT");
  const RK  = Netlify.env.get("RESEND_KEY");
  const REF = "hivyothlbntxcbsilktp";

  if(!PAT||!RK) return new Response("Missing env vars SUPABASE_PAT or RESEND_KEY",{status:500});

  const res=await fetch(`https://api.supabase.com/v1/projects/${REF}/config/auth`,{
    method:"PATCH",
    headers:{"Authorization":`Bearer ${PAT}`,"Content-Type":"application/json"},
    body:JSON.stringify({
      smtp_host:"smtp.resend.com",smtp_port:465,
      smtp_user:"resend",smtp_pass:RK,
      smtp_admin_email:"noreply@transfer365.net",
      smtp_sender_name:"Transfer365",
      mailer_sender_name:"Transfer365",
      mailer_subjects_confirmation:"Transfer365 — אמת את כתובת האימייל שלך",
      mailer_subjects_recovery:"Transfer365 — איפוס סיסמא",
      mailer_subjects_magic_link:"Transfer365 — קישור כניסה",
    })
  });
  const d=await res.json();
  if(!res.ok)return new Response(JSON.stringify(d,null,2),{status:res.status,headers:{"Content-Type":"application/json"}});
  return new Response(
    `<html dir=rtl><body style="font:16px sans-serif;padding:40px;max-width:500px;margin:auto;direction:rtl">
    <h1 style="color:#22C55E">&#x2705; מייל Transfer365 מוכן!</h1>
    <p>Sender: <b>${d.smtp_sender_name}</b></p>
    <p>SMTP: <b>${d.smtp_host}:${d.smtp_port}</b></p>
    <p>נושא אימות: <b>${d.mailer_subjects_confirmation}</b></p>
    <p>נושא איפוס: <b>${d.mailer_subjects_recovery}</b></p>
    <hr><p style="color:#9CA3AF">מחק setup-email.mjs מ-GitHub עכשיו</p>
    </body></html>`,
    {headers:{"Content-Type":"text/html;charset=utf-8"}}
  );
};
export const config={path:"/.netlify/functions/setup-email"};
