const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { buildSelection } = require('../scripts/import-obey-materials')

async function fixture(t, sourcePath = 'images/play.png') {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'obey-materials-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, '10_ENTREGA_CODEX'), { recursive: true })
  await fs.mkdir(path.join(root, '12_REVISION_VISUAL_Y_CODIGO'))
  await fs.mkdir(path.join(root, 'images'))
  const buffer = Buffer.from('fixture-selected-content')
  const hash = createHash('sha256').update(buffer).digest('hex')
  await fs.writeFile(path.join(root, 'images/play.png'), buffer)
  const catalog = { assets: [{ key: 'icon.play', kind: 'icon', fallback: 'play', files: [
    { variant: 'oscuro_png', path: sourcePath, bytes: buffer.length, sha256: hash },
    { variant: 'unselected', path: 'missing-alternative.png', bytes: 1, sha256: '0'.repeat(64) },
  ] }] }
  const materials = { materials: [{ key: 'icon.play', kind: 'icon', uploadAsEmoji: true, discordVariant: 'oscuro_png' }] }
  const upload = { entries: [{ key: 'icon.play', storageKey: 'play', variant: 'oscuro_png', animated: false, sourceSha256: hash, name: `obey_play_${hash.slice(0, 8)}` }] }
  const aliases = { aliases: [{ existingKey: 'play', selectedKey: 'icon.play' }] }
  for (const [file, value] of Object.entries({
    '10_ENTREGA_CODEX/assets-registry.json': catalog,
    '10_ENTREGA_CODEX/production-materials.json': materials,
    '10_ENTREGA_CODEX/discord-upload-plan.json': upload,
    '12_REVISION_VISUAL_Y_CODIGO/resource-aliases.json': aliases,
  })) await fs.writeFile(path.join(root, file), JSON.stringify(value))
  return { root, hash, catalog }
}

test('imports only selected variants with content hashes and canonical aliases', async t => {
  const { root, hash } = await fixture(t)
  const { selection, files } = await buildSelection(root)
  assert.equal(selection.assets['icon.play'].files.oscuro_png.path, `selected/${hash}.png`)
  assert.deepEqual(Object.keys(selection.assets['icon.play'].files), ['oscuro_png'])
  assert.equal(selection.aliases.play, 'icon.play')
  assert.equal(selection.uploadPlan[0].key, 'icon.play')
  assert.equal(files.size, 1)
})

test('rejects modified selected files before importing any material', async t => {
  const { root } = await fixture(t)
  await fs.writeFile(path.join(root, 'images/play.png'), 'modified')
  await assert.rejects(buildSelection(root), /integrity/i)
})

test('rejects traversal and symlinks outside the package', async t => {
  const { root } = await fixture(t, '../external.png')
  await assert.rejects(buildSelection(root), /path/i)
  const second = await fixture(t)
  await fs.rename(path.join(second.root, 'images/play.png'), path.join(second.root, 'external.png'))
  await fs.symlink('../../external.png', path.join(second.root, 'images/play.png'))
  await assert.rejects(buildSelection(second.root), /path/i)
})

test('rejects duplicate canonical keys', async t => {
  const { root, catalog } = await fixture(t)
  catalog.assets.push(catalog.assets[0])
  await fs.writeFile(path.join(root, '10_ENTREGA_CODEX/assets-registry.json'), JSON.stringify(catalog))
  await assert.rejects(buildSelection(root), /duplicate/i)
})

test('rejects upload hashes or names that differ from the selected file', async t => {
  const { root } = await fixture(t)
  const filename = path.join(root, '10_ENTREGA_CODEX/discord-upload-plan.json')
  const upload = JSON.parse(await fs.readFile(filename, 'utf8'))
  upload.entries[0].sourceSha256 = '0'.repeat(64)
  await fs.writeFile(filename, JSON.stringify(upload))
  await assert.rejects(buildSelection(root), /Upload integrity/)
})
