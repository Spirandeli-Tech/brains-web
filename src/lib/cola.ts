// Markdown → HTML renderer + slide parser for a video script's cola (recording
// cue). Ported from labs/apps/sites/estudos/lib/render.mjs — same house
// grammar, so a cola written for the old standalone site still renders
// correctly here:
//   - "***" / "---" (alone on a line) → scene break <hr>
//   - a line fully wrapped in **…** → section header (<h4>)
//   - "* "/"- " bullets, with 📖 (verse) / ☎️ (CVV) / "[destaque] " (curated
//     takeaway) getting highlight classes
//   - "[pausa …]" → a chip, inline or on its own line
//   - **bold**, *italic*, `code`

const DESTAQUE_RE = /^\[destaque\]\s*/i

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(raw: string): string {
  let s = esc(raw)
  s = s.replace(/`([^`]+)`/g, '$1')
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  s = s.replace(/\[pausa[^\]]*\]/gi, (m) => `<span class="pausa">${m}</span>`)
  return s
}

export function renderCola(md: string): string {
  const lines = String(md || '').split('\n')
  let html = ''
  let inList = false
  const closeList = () => {
    if (inList) {
      html += '</ul>'
      inList = false
    }
  }

  for (const rawLine of lines) {
    const t = rawLine.trim()
    if (t === '') {
      closeList()
      continue
    }
    if (t === '***' || t === '---') {
      closeList()
      html += '<hr>'
      continue
    }
    const mBullet = t.match(/^[*-]\s+(.*)$/)
    if (mBullet) {
      if (!inList) {
        html += '<ul>'
        inList = true
      }
      const item = mBullet[1]
      let cls = ''
      let text = item
      if (item.indexOf('📖') === 0) cls = ' class="verse"'
      else if (item.indexOf('☎️') === 0) cls = ' class="cvv"'
      else if (DESTAQUE_RE.test(item)) {
        cls = ' class="destaque"'
        text = item.replace(DESTAQUE_RE, '')
      }
      html += `<li${cls}>${inline(text)}</li>`
      continue
    }
    if (/^\*\*[^*].*\*\*$/.test(t)) {
      closeList()
      html += `<h4 class="sect">${inline(t.replace(/^\*\*|\*\*$/g, ''))}</h4>`
      continue
    }
    if (/^\[pausa[^\]]*\]$/i.test(t)) {
      closeList()
      html += `<p class="pausaline">${inline(t)}</p>`
      continue
    }
    closeList()
    html += `<p>${inline(t)}</p>`
  }
  closeList()
  return html
}

export interface SlideItem {
  text: string
  kind: 'normal' | 'verse' | 'cvv'
}

export interface Slide {
  title: string | null
  items: SlideItem[]
  // The section's curated single takeaway (a "[destaque]" bullet), when one
  // was marked. The Presenter shows this alone instead of the full item list.
  highlight: { text: string } | null
}

// Slide é ÂNCORA, não teleprompter: só o título e, quando houver, o versículo.
// Bullet comum não entra — texto na tela faz a audiência ler em vez de ouvir, e
// faz o apresentador ler em vez de falar. Versículo é a exceção porque as
// pessoas querem VER o texto bíblico.
export function parseSlides(md: string): Slide[] {
  const lines = String(md || '').split('\n')
  const slides: Slide[] = []
  let current: Slide | null = null

  for (const rawLine of lines) {
    const t = rawLine.trim()
    if (t === '' || t === '***' || t === '---') continue
    if (/^\[pausa[^\]]*\]$/i.test(t)) continue

    if (/^\*\*[^*].*\*\*$/.test(t)) {
      current = { title: inline(t.replace(/^\*\*|\*\*$/g, '')), items: [], highlight: null }
      slides.push(current)
      continue
    }

    const mBullet = t.match(/^[*-]\s+(.*)$/)
    if (mBullet) {
      const item = mBullet[1]
      const isVerse = item.indexOf('\u{1F4D6}') === 0
      const isCvv = item.indexOf('☎️') === 0
      if (!isVerse && !isCvv) continue
      if (!current) {
        current = { title: null, items: [], highlight: null }
        slides.push(current)
      }
      current.items.push({
        text: inline(item.replace(/^(\u{1F4D6}|☎️)\s*/u, '')),
        kind: isVerse ? 'verse' : 'cvv',
      })
    }
  }

  // Slide sem título e sem versículo não tem o que mostrar.
  return slides.filter((s) => s.title || s.items.length)
}
