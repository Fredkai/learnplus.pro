import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {contact} from '../src/worker.mjs';
const valid = {name: 'Anna Kowalska', email: 'anna@example.com', service: 'Study abroad application support', message: 'I would like to study in Canada.', consent: 'on', website: ''};
const request = (fields = {}, origin = 'https://learnplus.pro') => new Request('https://learnplus.pro/api/contact', {
  method: 'POST', headers: {Origin: origin, 'CF-Connecting-IP': '192.0.2.1'}, body: new URLSearchParams({...valid, ...fields})
});
function environment() {
  const sent = [];
  return {sent, CONTACT_EMAIL: {send: async data => {sent.push(data);}}, CONTACT_LIMITER: {limit: async () => ({success: true})}};
}
test('valid enquiries go only to the fixed inbox with visitor Reply-To', async () => {
  const env = environment();
  const response = await contact(request({name: 'Zoë', message: 'I am interested in studying français.'}), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.equal(env.sent.length, 1);
  assert.equal(env.sent[0].to, 'learnreachabroad@gmail.com');
  assert.equal(env.sent[0].from, 'info@learnplus.pro');
  assert.equal(env.sent[0].replyTo, valid.email);
  assert.match(env.sent[0].text, /Zoë/);
});
test('foreign origins, missing consent, bots, injection and invalid inputs never send mail', async () => {
  for (const [fields, origin] of [[{}, 'https://evil.example'], [{consent: ''}], [{website: 'spam'}], [{name: 'Anna\r\nBcc: spam@example.com'}], [{email: 'anna@example.com\r\nBcc:x'}], [{service: 'invalid'}], [{message: 'short'}], [{message: 'x'.repeat(5001)}]]) {
    const env = environment();
    const response = await contact(request(fields, origin), env);
    assert.ok(response.status >= 400);
    assert.equal(env.sent.length, 0);
  }
});
test('oversized requests are rejected even without Content-Length', async () => {
  const env = environment();
  const response = await contact(request({message: 'x'.repeat(41000)}), env);
  assert.equal(response.status, 413);
  assert.equal(env.sent.length, 0);
});
test('rate limits prevent mail delivery and supply retry guidance', async () => {
  const env = environment(); env.CONTACT_LIMITER.limit = async () => ({success: false});
  const response = await contact(request(), env);
  assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60'); assert.equal(env.sent.length, 0);
});
test('delivery failures and missing bindings do not report success', async () => {
  const env = environment(); env.CONTACT_EMAIL.send = async () => {throw new Error('secret provider details');};
  const response = await contact(request(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).success, false);
  assert.equal((await contact(request(), {})).status, 503);
});
test('API method and routing boundaries are enforced', async () => {
  assert.equal((await contact(new Request('https://learnplus.pro/api/contact'), {})).status, 405);
  assert.equal((await worker.fetch(new Request('https://learnplus.pro/api/other'), {})).status, 404);
  const response = await worker.fetch(new Request('https://learnplus.pro/services.html'), {ASSETS: {fetch: async () => new Response('static page')}});
  assert.equal(await response.text(), 'static page');
});