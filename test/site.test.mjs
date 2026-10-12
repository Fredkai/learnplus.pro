import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
test('every local page reference and deployment path exists', () => {
  let count=0;
  for(const file of ['index.html','services.html','privacy.html','404.html']) {
    const html=fs.readFileSync(path.join('public_html',file),'utf8');
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      let value=match[1];
      if(/^(https?:|mailto:|#)/.test(value))continue;
      value=value.split(/[?#]/)[0]; if(!value)continue;
      const target=value.startsWith('/')?path.join('public_html',value):path.join('public_html',path.dirname(file),value);
      assert.ok(fs.existsSync(target),`${file}: missing ${value}`); count++;
    }
  }
  assert.ok(count>10);
  const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8'));
  assert.ok(fs.existsSync(config.main)); assert.ok(fs.existsSync(config.assets.directory));
});