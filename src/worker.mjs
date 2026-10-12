const recipient = 'learnreachabroad@gmail.com';
const services = new Set(['Study abroad application support', 'Work opportunities in Poland']);
const json = (status, success, message, headers = {}) => Response.json({success, data: {message}}, {
  status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers}
});

export async function contact(request, env) {
  if (request.method !== 'POST') return json(405, false, 'Please submit the contact form.', {'Allow': 'POST'});
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return json(403, false, 'Please send your enquiry from this website.');
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) {
    return json(415, false, 'Unsupported form format.');
  }
  const declaredSize = Number(request.headers.get('Content-Length'));
  if (declaredSize > 40000) return json(413, false, 'Please shorten your message.');
  let raw;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json(400, false, 'Please complete the contact form.');
    const chunks = [];
    let size = 0;
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 40000) { await reader.cancel(); return json(413, false, 'Please shorten your message.'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    raw = new TextDecoder().decode(bytes);
  } catch { return json(400, false, 'Unable to read the form. Please try again.'); }
  const form = new URLSearchParams(raw);
  if (form.get('website')?.trim()) return json(400, false, 'Unable to submit this enquiry.');
  const name = (form.get('name') || '').trim();
  const email = (form.get('email') || '').trim();
  const service = (form.get('service') || '').trim();
  const message = (form.get('message') || '').trim();
  if (!name || name.length > 120 || /[\r\n\x00-\x1f\x7f]/.test(name) || email.length > 254 ||
      !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(email) ||
      !services.has(service) || message.length < 10 || message.length > 5000 || /\x00/.test(message) || form.get('consent') !== 'on') {
    return json(400, false, 'Check your name, email, service and message, and agree to the use of your details.');
  }
  try {
    if (!env.CONTACT_EMAIL || !env.CONTACT_LIMITER) return json(503, false, 'Please email info@learnplus.pro directly while we restore the form.');
    const key = request.headers.get('CF-Connecting-IP') || 'unknown';
    const {success} = await env.CONTACT_LIMITER.limit({key: `contact:${key}`});
    if (!success) return json(429, false, 'Please wait a minute before sending another enquiry.', {'Retry-After': '60'});
    await env.CONTACT_EMAIL.send({
      from: 'info@learnplus.pro', to: recipient, replyTo: email,
      subject: `LearnPlus enquiry: ${service}`,
      text: `Name: ${name}\nEmail: ${email}\nService: ${service}\n\n${message}\n\nThe visitor agreed to the use of their details to respond to this enquiry.`
    });
    return json(200, true, 'Thank you. Your enquiry has been submitted to LearnPlus.');
  } catch {
    return json(503, false, 'We could not confirm your submission. Please email info@learnplus.pro directly.');
  }
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/contact') return contact(request, env);
    if (path.startsWith('/api/')) return json(404, false, 'This endpoint does not exist.');
    return env.ASSETS.fetch(request);
  }
};