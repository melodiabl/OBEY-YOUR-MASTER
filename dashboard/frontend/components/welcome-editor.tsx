'use client'
import { useEffect, useRef } from 'react'
import { useWelcome } from '../lib/use-welcome'
import { canPublish, sameConfig, type WelcomeConfig } from '../lib/welcome-state'

export function WelcomeEditor({ guildId, csrfToken, verify, onEditingChange }: {
  guildId: string; csrfToken: string; verify: () => void; onEditingChange: (dirty: boolean, pending: boolean) => void;
}) {
  const editor = useWelcome(guildId, csrfToken)
  const { source, form, local, channels, operation, invalid } = editor
  const statusRef = useRef<HTMLParagraphElement>(null)
  const channelRef = useRef<HTMLSelectElement>(null), messageRef = useRef<HTMLTextAreaElement>(null)
  const t = (key: string, values: Record<string, string | number> = {}) => (form?.messages[key] || ({ loading: 'Cargando configuración…', reading: 'Leyendo la configuración actual…', unknownResult: 'No pude confirmar el resultado. Vuelve a cargar la configuración.', accessUnavailable: 'Tu acceso a esta configuración ya no está disponible.' } as Record<string, string>)[key] || 'No pude completar la operación.').replace(/\{([a-zA-Z]+)\}/g, (token, name: string) => Object.hasOwn(values, name) ? String(values[name]) : token)
  useEffect(() => { onEditingChange(editor.dirty, operation === 'saving' || operation === 'publishing') }, [editor.dirty, operation, onEditingChange])
  useEffect(() => () => onEditingChange(false, false), [onEditingChange])
  useEffect(() => {
    if (invalid.includes('channelId')) channelRef.current?.focus()
    else if (invalid.includes('message')) messageRef.current?.focus()
    else if (editor.error) statusRef.current?.focus()
  }, [invalid, editor.error])
  const channelName = (id: string | null) => id ? `#${channels.find(channel => channel.id === id)?.name || t('inaccessibleChannel')}` : t('disabledDelivery')
  const describe = (key: keyof WelcomeConfig, config: WelcomeConfig) => key === 'channelId' ? channelName(config.channelId) : config.message || t('emptyValue')
  const missingChannel = !!local.channelId && !channels.some(channel => channel.id === local.channelId)
  const outdatedDraft = !!source?.draft && source.draft.baseRevision !== source.published.revision
  return <section className="welcome-settings" lang={form?.locale || 'es'} aria-labelledby="welcome-title" aria-busy={!!operation}>
    <header className="settings-heading"><div><h2 id="welcome-title">{form?.messages.title || 'Bienvenida'}</h2><p>{form?.messages.description || 'Prepara el mensaje de entrada y revisa los cambios antes de publicarlos.'}</p></div><button className="secondary" disabled={!!operation} onClick={editor.denied ? verify : editor.refresh}>{editor.denied ? form?.messages.reverify || 'Volver a verificar' : form?.messages.refresh || 'Volver a cargar'}</button></header>
    <p className={`settings-status ${editor.error ? 'error' : ''}`} role={editor.error ? 'alert' : 'status'} tabIndex={-1} ref={statusRef}>{t(operation || editor.status)}</p>
    {source && form && <div className="welcome-grid">
      <div className="settings-card">
        <form onSubmit={event => { event.preventDefault(); void editor.save() }}>
          <fieldset disabled={!!operation || editor.denied}>
            <legend>{t('draft')}</legend>
            <label htmlFor="welcome-channel">{form.channel.label}</label>
            <select id="welcome-channel" ref={channelRef} value={local.channelId || ''} onChange={event => editor.edit({ channelId: event.target.value || null })} aria-invalid={invalid.includes('channelId')} aria-describedby={`welcome-channel-help${invalid.includes('channelId') ? ' welcome-channel-error' : ''}`}>
              <option value="">{t('disableOption')}</option>
              {missingChannel && <option value={local.channelId!} disabled>{t('inaccessibleChannel')}</option>}
              {channels.map(channel => <option value={channel.id} key={channel.id}>#{channel.name}</option>)}
            </select>
            <p className="field-help" id="welcome-channel-help">{form.channel.help}</p>
            {invalid.includes('channelId') && <p className="field-error" id="welcome-channel-error">{t('invalidChannel')}</p>}
            {!channels.length && <p className="field-help">{t('noChannels')}</p>}
            <label htmlFor="welcome-message">{form.message.label}</label>
            <textarea id="welcome-message" ref={messageRef} value={local.message} maxLength={form.message.maxLength} rows={6} onChange={event => editor.edit({ message: event.target.value })} aria-invalid={invalid.includes('message')} aria-describedby={`welcome-message-help welcome-count${invalid.includes('message') ? ' welcome-message-error' : ''}`} />
            <div className="message-help"><p className="field-help" id="welcome-message-help">{form.message.help}</p><span id="welcome-count">{local.message.length}/{form.message.maxLength}</span></div>
            {invalid.includes('message') && <p className="field-error" id="welcome-message-error">{t('invalidMessage')}</p>}
            <p className="draft-status">{outdatedDraft ? t('conflictDescription') : editor.dirty ? t('localChanges') : source.draft ? t('savedDraft', { revision: source.draft.revision }) : t('prepareDraft')}</p>
            <div className="settings-actions"><button className="primary" type="submit" disabled={editor.blocked || !editor.dirty && !outdatedDraft}>{t('saveButton')}</button><button className="secondary" type="button" disabled={editor.blocked} onClick={editor.showPreview}>{t('previewButton')}</button><button className="text-button" type="button" disabled={!editor.dirty} onClick={editor.discard}>{t('discardButton')}</button></div>
          </fieldset>
        </form>
        {editor.blocked && <p className="notice" role="alert">{t('unknownResult')}</p>}
        {editor.preview !== null && <section className="welcome-preview" aria-labelledby="welcome-preview-title"><h3 id="welcome-preview-title">{t('previewTitle')}</h3><pre>{editor.preview}</pre></section>}
      </div>
      <aside className="settings-card published-settings" aria-labelledby="welcome-published-title"><h3 id="welcome-published-title">{t('published')}</h3><p className="published-channel">{channelName(source.published.config.channelId)}</p><pre>{source.published.config.message || t('emptyMessage')}</pre><p className="field-help">{source.published.updatedAt ? t('lastPublication', { date: new Date(source.published.updatedAt).toLocaleString(form.locale) }) : t('existingConfiguration')}</p><p className="field-help scope-note">{t('scopeNote')}</p></aside>
      <section className="settings-card changes-review" aria-labelledby="welcome-review-title"><div className="review-heading"><div><h3 id="welcome-review-title">{t('changesTitle')}</h3><p className="field-help">{editor.dirty ? t('localChanges') : source.draft ? t('savedDraft', { revision: source.draft.revision }) : t('noChanges')}</p></div><button className="primary" disabled={!!operation || editor.blocked || !canPublish(source, local)} onClick={editor.publish}>{t('publishButton')}</button></div>
        {!sameConfig(local, source.published.config) && <dl className="welcome-diff">{(['channelId', 'message'] as const).filter(key => local[key] !== source.published.config[key]).map(key => <div key={key}><dt>{key === 'channelId' ? form.channel.label : form.message.label}</dt><dd><span>{t('publishedValue', { before: describe(key, source.published.config) })}</span><strong>{t('draftValue', { after: describe(key, local) })}</strong></dd></div>)}</dl>}
        {source.draft && !sameConfig(local, source.draft.config) && <p className="field-help stored-draft">{t('savedCurrentDraft', { channel: channelName(source.draft.config.channelId), message: source.draft.config.message })}</p>}
      </section>
    </div>}
  </section>
}
