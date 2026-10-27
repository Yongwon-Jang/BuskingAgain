// Two-browser E2E: artist streams a fake camera, viewer receives it, chat + reaction + end.
// Run server (8080) and frontend dev server (5173) first, then: npm install && npm test
import { chromium } from 'playwright';
const B = 'http://localhost:5173';
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
const mk = async (name) => {
  const ctx = await browser.newContext({ permissions: ['camera', 'microphone'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log(name, 'pageerror', e.message));
  await p.goto(B + '/signup');
  await p.fill('input[type=email]', `${name}@t.com`);
  await p.locator('label:has-text("닉네임") input').fill(name);
  const pw = p.locator('input[type=password]');
  await pw.nth(0).fill('password1'); await pw.nth(1).fill('password1');
  await p.click('button:has-text("가입하기")');
  await p.waitForURL('**/me');
  return p;
};
const artist = await mk('artist');
const viewer = await mk('viewer');

await artist.click('text=버스킹 시작');
await artist.fill('input[maxlength="40"]', '퇴근길 라이브');
await artist.selectOption('select', '어쿠스틱');
await artist.click('button:has-text("카메라 켜고 시작")');
await artist.waitForURL('**/buskings/*');
await artist.waitForTimeout(1500);

await viewer.goto(B + '/');
await viewer.click('text=퇴근길 라이브');
await viewer.waitForURL('**/buskings/*');
// wait until the viewer's <video> is actually playing frames from the artist
await viewer.waitForFunction(() => { const v = document.querySelector('video'); return v && v.srcObject && v.videoWidth > 0; }, null, { timeout: 15000 });
const size = await viewer.evaluate(() => { const v = document.querySelector('video'); return [v.videoWidth, v.videoHeight, v.srcObject.getTracks().map(t => t.kind)]; });
console.log('viewer video:', JSON.stringify(size));

await viewer.fill('aside input', '앵콜!');
await viewer.click('aside button:has-text("전송")');
await artist.waitForSelector('aside li:has-text("앵콜!")', { timeout: 5000 });
console.log('artist got chat');

await viewer.click('.reaction-bar button >> nth=0');
await artist.waitForSelector('.float', { timeout: 5000 });
console.log('artist saw reaction');
console.log('viewer count on artist:', await artist.textContent('.stage-info p'));
await viewer.screenshot({ path: '../docs/viewer.jpg' });
await artist.screenshot({ path: '../docs/artist.jpg' });

await artist.click('button:has-text("공연 종료")');
await viewer.waitForSelector('text=공연이 끝났어요', { timeout: 5000 });
console.log('viewer saw ended');
await browser.close();
