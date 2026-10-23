'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, request } from './api'
import { canPublish, editingConfig, parseChannels, parseWelcome, parseWelcomeForm, sameConfig, type Channel, type WelcomeConfig, type WelcomeForm, type WelcomeSnapshot } from './welcome-state'

type Operation = 'loading' | 'saving' | 'publishing' | 'preparingPreview' | null
export function useWelcome(guildId: string, csrfToken: string) {
  const [source, setSource] = useState<WelcomeSnapshot | null>(null)
  const [form, setForm] = useState<WelcomeForm | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [local, setLocal] = useState<WelcomeConfig>({ channelId: null, message: '' })
  const [operation, setOperation] = useState<Operation>('loading')
  const [status, setStatus] = useState('loading'), [error, setError] = useState(false)
  const [blocked, setBlocked] = useState(false), [denied, setDenied] = useState(false)
  const [invalid, setInvalid] = useState<string[]>([]), [preview, setPreview] = useState<string | null>(null)
  const busy = useRef(false), lifecycle = useRef<AbortController | null>(null)
  const publication = useRef<{ draftRevision: number; expectedPublishedRevision: string; operationId: string } | null>(null)
  const invalidSession = useRef(false)
  const base = `/api/guilds/${guildId}/modules/welcome`
  const dirty = !!source && !sameConfig(local, editingConfig(source))
  const signal = () => AbortSignal.any([lifecycle.current!.signal, AbortSignal.timeout(15000)])
  const failure = useCallback((reason: unknown, mutating: boolean) => {
    setError(true); setPreview(null)
    const problem = reason instanceof ApiError ? reason : null
    if (problem && (problem.details.accessRevoked || [401, 404].includes(problem.status) || problem.status === 403 && !['configuration_permissions', 'csrf_invalid'].includes(problem.code))) {
      setDenied(true); setBlocked(true); setSource(null); setChannels([]); setLocal({ channelId: null, message: '' }); setInvalid([]); publication.current = null
      setStatus('accessUnavailable'); return
    }
    if (problem?.status === 409) {
      const current = parseWelcome(problem.details.current, guildId)
      if (current) setSource(current)
      setBlocked(true); setStatus('conflictDescription'); return
    }
    if (problem?.status === 400) { setInvalid(problem.details.fields || []); setStatus('invalidConfiguration'); return }
    if (problem?.code === 'configuration_permissions') { setInvalid(['channelId']); setStatus('channelPermissions'); return }
    if (problem?.code === 'csrf_invalid') invalidSession.current = true
    if (mutating || !problem || problem.code === 'csrf_invalid') setBlocked(true)
    setStatus(problem?.code === 'csrf_invalid' ? 'invalidSession' : 'unknownResult')
  }, [guildId])
  const refresh = useCallback(async (preserve?: WelcomeConfig) => {
    if (busy.current || !lifecycle.current) return
    const active = lifecycle.current.signal
    busy.current = true; setOperation('loading'); setStatus('reading'); setError(false); setPreview(null); setInvalid([])
    try {
      const options = { signal: AbortSignal.any([active, AbortSignal.timeout(15000)]) }
      const value = await request<{ configuration: unknown; channels: unknown; form: unknown }>(base + '/editor', options)
      if (active.aborted) return
      const parsed = parseWelcome(value.configuration, guildId), items = parseChannels({ channels: value.channels }), fields = parseWelcomeForm(value.form)
      if (!parsed || !items || !fields) throw new Error('invalid_configuration_response')
      const reconciled = publication.current && publication.current.operationId === parsed.lastPublication?.operationId
      if (reconciled) publication.current = null
      setSource(parsed); setForm(fields); setChannels(items); setLocal(preserve || editingConfig(parsed)); setBlocked(invalidSession.current); setDenied(false); setError(invalidSession.current)
      setStatus(invalidSession.current ? 'invalidSession' : reconciled ? 'reconciled' : preserve ? 'refreshedLocal' : parsed.draft ? 'draftRecovered' : 'publishedLoaded')
    } catch (reason) { if (!active.aborted) { setBlocked(true); failure(reason, false) } }
    finally { if (!active.aborted) { busy.current = false; setOperation(null) } }
  }, [base, guildId, failure])
  useEffect(() => {
    const controller = new AbortController(); lifecycle.current = controller
    busy.current = false; void refresh()
    return () => { controller.abort(); lifecycle.current = null }
  }, [refresh])
  useEffect(() => {
    if (!dirty && operation !== 'saving' && operation !== 'publishing') return
    const leave = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', leave)
    return () => window.removeEventListener('beforeunload', leave)
  }, [dirty, operation])
  const edit = (patch: Partial<WelcomeConfig>) => { if (busy.current || denied) return; setLocal(current => ({ ...current, ...patch })); setPreview(null); setInvalid([]); if (!blocked) { setStatus('localChanges'); setError(false) } }
  const discard = () => { if (!source || busy.current) return; setLocal(editingConfig(source)); setPreview(null); setInvalid([]); setError(false); setStatus('localDiscarded') }
  async function perform(kind: 'save' | 'publish' | 'preview') {
    if (busy.current || !source || !form || denied || blocked) return
    const invalidFields = [...(local.message.length > form.message.maxLength ? ['message'] : []), ...(local.channelId && !channels.some(channel => channel.id === local.channelId) ? ['channelId'] : [])]
    if (invalidFields.length) { setInvalid(invalidFields); setError(true); setStatus('fieldErrorSummary'); return }
    if (kind === 'publish' && !canPublish(source, local)) return
    const active = lifecycle.current?.signal
    if (!active || active.aborted) return
    busy.current = true; setOperation(kind === 'save' ? 'saving' : kind === 'publish' ? 'publishing' : 'preparingPreview'); setError(false); setInvalid([])
    try {
      const options = { csrfToken, signal: signal() }
      if (kind === 'preview') {
        const value = await request<{ fixture?: boolean; content?: unknown }>(base + '/preview', { ...options, body: { config: local } })
        if (active.aborted) return
        if (value.fixture !== true || typeof value.content !== 'string') throw new Error('invalid_preview')
        setPreview(value.content); setStatus('previewSuccess')
      } else {
        if (kind === 'publish' && (!publication.current || publication.current.draftRevision !== source.draft!.revision || publication.current.expectedPublishedRevision !== source.published.revision)) publication.current = { draftRevision: source.draft!.revision, expectedPublishedRevision: source.published.revision, operationId: crypto.randomUUID() }
        const body = kind === 'save' ? { config: local, expectedDraftRevision: source.draftRevision, expectedPublishedRevision: source.published.revision } : publication.current
        const value = await request<unknown>(base + (kind === 'save' ? '/draft' : '/publish'), { ...options, method: kind === 'save' ? 'PUT' : 'POST', body })
        if (active.aborted) return
        const parsed = parseWelcome(value, guildId)
        if (!parsed) throw new Error('invalid_configuration_response')
        publication.current = null; setSource(parsed); setLocal(editingConfig(parsed)); setPreview(null); setStatus(kind === 'save' ? 'draftSaved' : 'publishedSuccess')
      }
    } catch (reason) { if (!active.aborted) failure(reason, kind !== 'preview') }
    finally { if (!active.aborted) { busy.current = false; setOperation(null) } }
  }
  return { source, form, channels, local, dirty, operation, status, error, blocked, denied, invalid, preview, edit, discard,
    refresh: () => refresh(dirty ? local : undefined), save: () => perform('save'), publish: () => perform('publish'), showPreview: () => perform('preview') }
}
