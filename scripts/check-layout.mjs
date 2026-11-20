// Isolated headless development checks; never opens or reuses a personal browser profile.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const systemChrome = 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync(systemChrome) ? systemChrome : undefined)
const browser = await chromium.launch({ executablePath, headless: true })
const url = process.env.PREVIEW_URL || 'http://127.0.0.1:5173/'
const sizes = [[320,480],[320,568],[360,640],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080],[844,390],[568,320]]
await mkdir(new URL('../.local/', import.meta.url), { recursive: true })
const report = []
try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break } catch { /* Preview may still be starting in CI. */ }
    if (attempt === 39) throw new Error('Preview did not become ready: ' + url)
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  for (const [width,height] of sizes) {
    const context = await browser.newContext({ viewport: { width,height }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    await page.getByText('۰ از ۶ تلاش', { exact:true }).waitFor()
    await page.evaluate(() => document.fonts.ready)
    let logoSize
    for (const theme of ['dark','light']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.getByRole('button', { name:'تغییر پوسته', exact:true }).click()
      await page.locator('.identity img').evaluate(image => image.decode())
      const logo = await page.locator('.identity').evaluate(element => {
        const image = element.querySelector('img').getBoundingClientRect()
        const style = getComputedStyle(element)
        return { width:image.width,height:image.height,background:style.backgroundColor,padding:style.padding,src:element.querySelector('img').getAttribute('src') }
      })
      assert.equal(logo.background,'rgba(0, 0, 0, 0)')
      assert.equal(logo.padding,'0px')
      assert.match(logo.src, theme === 'dark' ? /alpha-mark-dark\.svg$/ : /alpha-mark\.svg$/)
      const size = { width:logo.width,height:logo.height }
      if (logoSize) assert.deepEqual(size,logoSize,`${width}x${height}: theme changes logo size`)
      logoSize = size
      const layout = await page.evaluate(() => {
        const rect = selector => {
          const r = document.querySelector(selector).getBoundingClientRect()
          return { top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height }
        }
        const controls = [...document.querySelectorAll('.key,.tile,.header-actions button,.site-footer')].map(el => {
          const r=el.getBoundingClientRect();return {name:el.getAttribute('aria-label')||el.className,top:r.top,bottom:r.bottom,left:r.left,right:r.right}
        })
        return {documentHeight:document.documentElement.scrollHeight,documentWidth:document.documentElement.scrollWidth,viewportHeight:innerHeight,viewportWidth:innerWidth,board:rect('.board'),frame:rect('.board-frame'),keyboard:rect('.keyboard'),stage:rect('.game-stage'),tile:rect('.board .tile'),controls,font:getComputedStyle(document.body).fontFamily}
      })
      const label = `${width}x${height} ${theme}`
      assert.ok(layout.documentHeight <= height+1, `${label}: vertical page overflow`)
      assert.ok(layout.documentWidth <= width+1, `${label}: horizontal page overflow`)
      assert.ok(layout.board.top >= layout.frame.top-1 && layout.board.bottom <= layout.frame.bottom+1, `${label}: board clipped inside frame`)
      assert.ok(layout.board.bottom <= layout.keyboard.top || layout.board.right <= layout.keyboard.left || layout.board.left >= layout.keyboard.right, `${label}: board overlaps keyboard`)
      assert.ok(layout.tile.height >= 20, `${label}: tiles too small`)
      for (const control of layout.controls) assert.ok(control.top>=-1 && control.bottom<=height+1 && control.left>=-1 && control.right<=width+1, `${label}: clipped control ${control.name}`)
      assert.match(layout.font, /Vazirmatn/)
      assert.equal(await page.getByRole('button', { name:'حالت ضبط', exact:true }).count(),0)
      assert.deepEqual(errors,[])
      report.push({size:`${width}x${height}`,theme,tile:Math.round(layout.tile.height),noScroll:true})
      if ((width===1440 && height===900) || (width===390 && height===844)) await page.screenshot({path:`.local/design-${width}-${theme}.png`})
    }
    await context.close()
  }
  const context = await browser.newContext({ viewport: { width:390,height:844 } })
  const page = await context.newPage()
  await page.goto(url)
  await page.getByText('۰ از ۶ تلاش', { exact:true }).waitFor()
  assert.equal(await page.locator('.identity').innerText(), '')
  assert.match(await page.locator('.identity img').getAttribute('src'), /alpha-mark\.svg$/)
  for (const letter of 'باران') await page.getByRole('button', { name:letter,exact:true }).click()
  await page.getByRole('button', { name:'ثبت حدس',exact:true }).click()
  const result = page.getByRole('dialog')
  await result.waitFor()
  await page.screenshot({path:'.local/result-390-light.png'})
  await result.getByRole('button', { name:'بازی دوباره',exact:true }).click()
  await page.getByText('۰ از ۶ تلاش', { exact:true }).waitFor()
  for (const letter of 'آرامش') await page.getByRole('button', { name:letter,exact:true }).click()
  await page.getByRole('button', { name:'ثبت حدس',exact:true }).click()
  await page.getByText('۱ از ۶ تلاش', { exact:true }).waitFor()
  await page.getByRole('button', { name:'شروع دوباره',exact:true }).click()
  await page.getByRole('dialog').getByRole('button', { name:'شروع دوباره',exact:true }).click()
  await page.getByText('۰ از ۶ تلاش', { exact:true }).waitFor()
  await page.reload()
  await page.getByText('۰ از ۶ تلاش', { exact:true }).waitFor()
  await context.close()
  await writeFile('.local/layout-report.json',JSON.stringify(report,null,2)+'\n')
  console.log(`Passed ${report.length} viewport/theme checks and real-browser win/replay/reset/reload journey.`)
} finally { await browser.close() }
