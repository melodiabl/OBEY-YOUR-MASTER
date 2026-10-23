export interface WelcomeConfig { channelId: string | null; message: string }
export interface WelcomeSnapshot {
  published: { config: WelcomeConfig; revision: string; updatedAt: string | null };
  draft: { config: WelcomeConfig; revision: number; baseRevision: string } | null;
  draftRevision: number; lastPublication: { operationId: string } | null;
}
interface Field { label: string; help: string }
export interface WelcomeForm {
  locale: string; messages: Record<string, string>;
  channel: Field; message: Field & { maxLength: number };
}
export interface Channel { id: string; name: string }
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const revision = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
const count = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0
function config(value: unknown): WelcomeConfig | null {
  const data = object(value)
  if (!data || typeof data.message !== 'string' || data.channelId !== null && (typeof data.channelId !== 'string' || !/^[a-zA-Z0-9_:-]{1,100}$/.test(data.channelId))) return null
  return { channelId: data.channelId as string | null, message: data.message }
}
export function parseWelcome(value: unknown, guildId: string): WelcomeSnapshot | null {
  const data = object(value), published = object(data?.published), draft = object(data?.draft)
  const active = config(published?.config), editing = config(draft?.config)
  if (!data || !published || published.guildId !== guildId || published.moduleId !== 'welcome' || !active || !revision(published.revision) || !count(data.draftRevision)) return null
  if (data.draft !== null && (!draft || draft.guildId !== guildId || !editing || !count(draft.revision) || draft.revision < 1 || draft.revision !== data.draftRevision || !revision(draft.baseRevision))) return null
  const last = object(data.lastPublication)
  return { published: { config: active, revision: published.revision, updatedAt: typeof published.updatedAt === 'string' && Number.isFinite(Date.parse(published.updatedAt)) ? published.updatedAt : null },
    draft: draft ? { config: editing!, revision: draft.revision as number, baseRevision: draft.baseRevision as string } : null,
    draftRevision: data.draftRevision, lastPublication: typeof last?.operationId === 'string' ? { operationId: last.operationId } : null }
}
export function parseWelcomeForm(value: unknown): WelcomeForm | null {
  const data = object(value), messages = object(data?.messages)
  if (!data || !Array.isArray(data.sections) || !messages || !Object.values(messages).every(value => typeof value === 'string') || typeof data.locale !== 'string' || !['es', 'en'].includes(data.locale)) return null
  if (!['title', 'saveButton', 'publishButton', 'refresh', 'unknownResult'].every(key => typeof messages[key] === 'string')) return null
  const fields = data.sections.flatMap(section => { const row = object(section); return Array.isArray(row?.fields) ? row.fields : [] }).map(object)
  const channel = fields.find(field => field?.path === 'channelId'), message = fields.find(field => field?.path === 'message')
  if (!channel || !message || channel.component !== 'guild-text-channel' || channel.nullable !== true || message.component !== 'message-template' || !count(message.maxLength)) return null
  if ([channel, message].some(field => typeof field.label !== 'string' || typeof field.help !== 'string')) return null
  return { locale: data.locale, messages: messages as Record<string, string>, channel: { label: channel.label as string, help: channel.help as string },
    message: { label: message.label as string, help: message.help as string, maxLength: message.maxLength } }
}
export function parseChannels(value: unknown): Channel[] | null {
  const data = object(value)
  if (!data || !Array.isArray(data.channels)) return null
  const channels: Channel[] = []
  for (const item of data.channels) {
    const channel = object(item)
    if (!channel || typeof channel.id !== 'string' || !/^\d{17,20}$/.test(channel.id) || typeof channel.name !== 'string') return null
    channels.push({ id: channel.id, name: channel.name.slice(0, 100) })
  }
  return channels
}
export const sameConfig = (a: WelcomeConfig, b: WelcomeConfig) => a.channelId === b.channelId && a.message === b.message
export const editingConfig = (snapshot: WelcomeSnapshot) => snapshot.draft?.config || snapshot.published.config
export const canPublish = (snapshot: WelcomeSnapshot | null, local: WelcomeConfig) => !!snapshot?.draft && sameConfig(snapshot.draft.config, local) && snapshot.draft.baseRevision === snapshot.published.revision
