import { requestApi } from './apiClient'
import type {
  TaskReadModel,
  CreateTaskPayload,
  Client,
  Consultant,
  Programmer,
  TaskHistoryReadModel,
  Attachment,
  UploadAttachmentPayload,
  UploadAttachmentResult,
} from '../types/task.types'

export const taskService = {
  isApiMode(): boolean {
    return import.meta.env.VITE_DATA_SOURCE === 'api'
  },

  async getTasks(includeArchived: boolean = false): Promise<TaskReadModel[]> {
    return requestApi<TaskReadModel[]>('listTasks', {
      params: { includeArchived: String(includeArchived) },
    })
  },

  async getTask(taskId: string): Promise<TaskReadModel> {
    return requestApi<TaskReadModel>('getTask', {
      params: { taskId },
    })
  },

  async createTask(payload: CreateTaskPayload): Promise<string> {
    const res = await requestApi<{ taskId: string }>('createTask', {
      method: 'POST',
      body: payload,
    })
    return res.taskId
  },

  async updateTask(taskId: string, updatedFields: Partial<CreateTaskPayload>): Promise<void> {
    await requestApi<void>('updateTask', {
      method: 'POST',
      body: {
        taskId,
        updatedFields,
      },
    })
  },

  async archiveTask(taskId: string): Promise<void> {
    await requestApi<void>('archiveTask', {
      method: 'POST',
      body: { taskId },
    })
  },

  async listClients(): Promise<Client[]> {
    return requestApi<Client[]>('listClients')
  },

  async listConsultants(): Promise<Consultant[]> {
    return requestApi<Consultant[]>('listConsultants')
  },

  async listProgrammers(): Promise<Programmer[]> {
    return requestApi<Programmer[]>('listProgrammers')
  },

  async getTaskHistory(taskId: string): Promise<TaskHistoryReadModel[]> {
    return requestApi<TaskHistoryReadModel[]>('getTaskHistory', {
      params: { taskId },
    })
  },

  async listRecentHistory(limit: number = 50): Promise<TaskHistoryReadModel[]> {
    return requestApi<TaskHistoryReadModel[]>('listRecentHistory', {
      params: { limit: String(limit) },
    })
  },

  async getTaskAttachments(taskId: string): Promise<Attachment[]> {
    return requestApi<Attachment[]>('getTaskAttachments', {
      params: { taskId },
    })
  },

  async uploadAttachment(payload: UploadAttachmentPayload): Promise<UploadAttachmentResult> {
    return requestApi<UploadAttachmentResult>('uploadAttachment', {
      method: 'POST',
      body: payload,
    })
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    await requestApi<void>('deleteAttachment', {
      method: 'POST',
      body: { attachmentId },
    })
  },
}
