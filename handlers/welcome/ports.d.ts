import type { z } from 'zod'
import type { configSchema } from './contract'

export type WelcomeConfig = z.infer<typeof configSchema>
export type PublishedConfig = WelcomeConfig & { revision: string }
export interface Snapshot {
  published: {
    guildId: string; moduleId: 'welcome'; schemaVersion: number; revision: string
    enabled: boolean; config: WelcomeConfig; updatedBy: string | null; updatedAt: Date | null
  }
  draft: {
    guildId: string; moduleId: 'welcome'; schemaVersion: number; revision: number
    baseRevision: string; state: 'editing'; config: WelcomeConfig; updatedBy: string; updatedAt: Date
  } | null
  draftRevision: number
  lastPublication: { operationId: string; actorId: string; draftRevision: number; publishedRevision: string } | null
}
export interface DraftRepository {
  read(guildId: string, moduleId: 'welcome'): Promise<Snapshot>
  saveDraft(guildId: string, moduleId: 'welcome', actorId: string, config: WelcomeConfig, draftRevision: number, publishedRevision: string): Promise<Snapshot>
  publish(guildId: string, moduleId: 'welcome', actorId: string, draftRevision: number, publishedRevision: string, operationId: string): Promise<Snapshot>
}
export interface PublishedRepository {
  read(guildId: string): Promise<PublishedConfig>
  save(guildId: string, patch: Partial<WelcomeConfig>, revision: string, operationId?: string): Promise<PublishedConfig>
}
