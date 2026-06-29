// POST /api/contact — terryharmer.com contact form, emailed via Resend
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const CONTACT_TO = process.env.CONTACT_TO || 'terry.harmer@mac.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'portal@conestogastrategies.com';

const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, message, website } = req.body || {};
    if (website) return res.status(200).json({ ok: true }); // honeypot
    if (!name || typeof name !== 'string' || name.length > 120) return res.status(400).json({ error: 'Name required' });
    if (!email || typeof email !== 'string' || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return res.status(400).json({ error: 'Valid email required' });
    if (!message || typeof message !== 'string' || message.length > 5000) return res.status(400).json({ error: 'Message required' });
    if (!RESEND_API_KEY) return res.status(503).json({ error: 'Email not configured' });

    const html = `<div style="font-family:Georgia,serif;max-width:600px">
      <p style="font-family:monospace;font-size:11px;letter-spacing:2px;color:#6366f1">TERRYHARMER.COM · CONTACT FORM</p>
      <p><strong>${esc(name)}</strong><br>
      <a href="mailto:${esc(email)}">${esc(email)}</a></p>
      <div style="border-left:3px solid #6366f1;padding:10px 16px;color:#333;white-space:pre-wrap">${esc(message)}</div>
      <p style="color:#999;font-size:12px">Reply goes straight to them.</p></div>`;

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `Terry Harmer <${FROM_EMAIL}>`,
        to: [CONTACT_TO],
        reply_to: email,
        subject: `terryharmer.com — message from ${name}`,
        html,
      }),
    });
    if (!r.ok) { console.error('Resend error:', await r.text()); return res.status(502).json({ error: 'Send failed' }); }
    return res.status(200).json({ ok: true });
  } catch (e) { console.error(e); return res.status(500).json({ error: 'Server error' }); }
};
