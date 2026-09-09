// Uses Chrome's DevTools protocol; no browser-test dependency is installed.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const profile = await mkdtemp(join(tmpdir(), 'neko-inventory-browser-'))
const port = 10000 + Math.floor(Math.random() * 10000)
const chrome = spawn(process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
chrome.stderr.on('data', data => process.stderr.write(data))
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
let socket
const errors = []
try {
  let targets
  for (let n = 0; n < 50; n++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break } catch { await pause(200) } }
  if (!targets) throw new Error('Chrome debugging endpoint unavailable')
  socket = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl)
  socket.addEventListener('close', event => console.log('CDP closed', event.code, event.reason))
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let nextId = 0
  const pending = new Map()
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + message.params.exceptionDetails.exception?.description)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value).join(' '))
    if (message.id) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) }
  })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}; socket ${socket.readyState}`)), 15000); pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value) }, reject: err => { clearTimeout(timer); reject(err) } }); socket.send(JSON.stringify({ id, method, params })) })
  const evaluate = async expression => { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description); return result.result.value }
  const waitFor = async expression => { for (let n = 0; n < 70; n++) { if (await evaluate(`Boolean(${expression})`)) return; await pause(150) } throw new Error(`Timed out: ${expression}`) }
  const click = async text => { await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b) throw new Error('Button missing: ' + ${JSON.stringify(text)}); b.click() })()`); await pause(150) }
  const fill = async (label, value) => { await evaluate(`(() => { const label = [...document.querySelectorAll('dialog[open] label, .inventory label')].find(l => l.querySelector('span')?.textContent === ${JSON.stringify(label)}); const input = label?.querySelector('input,select'); if (!input) throw new Error('Field missing: ' + ${JSON.stringify(label)}); Object.getOwnPropertyDescriptor(input.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(String(value))}); input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); })()`); await pause(100) }
  await send('Runtime.enable'); await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await waitFor(`document.querySelector('nav button')`)
  await click('Tồn kho & HSD')
  await waitFor(`document.querySelectorAll('.inv-table tbody tr').length === 84`)
  await fill('Nhóm hàng', 'Kem')
  assert.equal(await evaluate(`document.querySelectorAll('.inv-table tbody tr').length`), 10)
  await click('Xóa bộ lọc')
  await fill('Tìm tên, SKU, hãng, nhà cung cấp', 'tra lai')
  await waitFor(`document.querySelectorAll('.inv-table tbody tr').length === 1`)
  await click('Xóa bộ lọc')
  await click('Nhập hàng')
  await fill('Nguyên liệu', 'excel-cost-3')
  await fill('Số lượng · đơn vị mua (6L)', '5')
  await fill('Giá / đơn vị mua (₫)', '100')
  await fill('Hạn sử dụng', '2026-10-01')
  await click('Xác nhận nhập kho')
  await waitFor(`!document.querySelector('dialog[open]')`)
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('my-store.inventory.v1')).batches[0].remainingQuantity`), 5)
  await click('Xuất kho')
  await fill('Nguyên liệu', 'excel-cost-3')
  await fill('Số lượng xuất (tồn 5 · 6L)', '2')
  await click('Xác nhận xuất kho')
  await waitFor(`!document.querySelector('dialog[open]')`)
  await click('Vani')
  await click('Các lô hàng')
  await click('Sửa / xóa hạn sử dụng')
  await click('Xóa ngày')
  await fill('Lý do sửa / xóa', 'Kiểm thử xóa hạn')
  await click('Xác nhận sửa hạn')
  await waitFor(`document.querySelectorAll('dialog[open]').length === 1`)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await waitFor(`!document.querySelector('dialog[open]')`)
  await click('Kiểm kho')
  await fill('Tìm nguyên liệu', 'vani')
  await fill('Tồn thực tế · Vani', '7')
  await click('Lưu nháp')
  await waitFor(`!document.querySelector('dialog[open]')`)
  await click('Kiểm kho')
  await fill('Tìm nguyên liệu', 'vani')
  assert.equal(await evaluate(`document.querySelector('dialog input[type=number]').value`), '7')
  await click('Xác nhận & điều chỉnh tồn')
  await waitFor(`!document.querySelector('dialog[open]')`)
  await send('Page.reload')
  await waitFor(`document.querySelector('nav button')`)
  await click('Tồn kho & HSD')
  await waitFor(`document.querySelectorAll('.inv-table tbody tr').length === 84`)
  const saved = await evaluate(`JSON.parse(localStorage.getItem('my-store.inventory.v1'))`)
  assert.equal(saved.batches.reduce((s, b) => s + b.remainingQuantity, 0), 7)
  assert.equal(saved.batches[0].expiryDate, '')
  assert.equal(saved.counts[0].status, 'CONFIRMED')
  const desktop = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(profile, 'desktop.png'), Buffer.from(desktop.data, 'base64'))
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await pause(200)
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`), true)
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.inv-table-wrap')).display`), 'none')
  await click('Menu')
  await click('Phân công ca')
  await click('Menu')
  await click('Tồn kho & HSD')
  await waitFor(`document.querySelector('.inventory h1')`)
  await click('Nhập hàng')
  assert.equal(await evaluate(`document.activeElement.closest('dialog') !== null`), true)
  for (let n = 0; n < 22; n++) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); assert.equal(await evaluate(`document.activeElement.closest('dialog') !== null || document.activeElement === document.body`), true) }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await waitFor(`!document.querySelector('dialog[open]')`)
  const mobile = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(join(profile, 'mobile.png'), Buffer.from(mobile.data, 'base64'))
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'PASS', checks: ['84 rows', 'category', 'accentless search', 'import', 'export', 'remove expiry', 'draft and confirmed count', 'reload persistence', 'desktop/mobile', 'mobile navigation', 'dialog keyboard', 'console errors'], screenshots: profile }, null, 2))
} finally {
  socket?.close()
  chrome.kill()
}
