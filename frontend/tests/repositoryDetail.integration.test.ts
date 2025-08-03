import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import RepositoryDetail from '@/views/RepositoryDetail.vue'
import * as pullRequestsApi from '@/lib/api/pullRequests'
import * as repositoriesApi from '@/lib/api/repositories'
import * as reviewsApi from '@/lib/api/reviews'
import * as analyticsApi from '@/lib/api/analytics'
import * as syncApi from '@/lib/api/sync'

// Mock dependent API modules
vi.mock('@/lib/api/pullRequests', () => ({
  pullRequestsApi: {
    listByRepo: vi.fn(),
    statsByRepo: vi.fn(),
    syncRepo: vi.fn(),
  },
}))
vi.mock('@/lib/api/repositories', () => ({
  repositoriesApi: {
    get: vi.fn(),
  },
}))
vi.mock('@/lib/api/reviews', () => ({
  reviewsApi: {
    metricsByRepo: vi.fn(),
  },
}))
vi.mock('@/lib/api/analytics', () => ({
  analyticsApi: {
    trendsByRepo: vi.fn(),
  },
}))
vi.mock('@/lib/api/sync', () => ({
  syncApi: {
    repoHistory: vi.fn(),
  },
}))

// Mock vue-router useRoute to provide :id
vi.mock('vue-router', () => {
  return {
    useRoute: () => ({ params: { id: '1' } }),
  }
})

function mountWithQuery() {
  const queryClient = new QueryClient()
  return mount(RepositoryDetail, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient }]],
      stubs: {
        TerminalWindow: { template: '<div><slot name="title" /><slot /></div>' },
        TerminalHeader: { template: '<div><slot name="title" /><slot name="actions" /></div>' },
        TerminalTitle: { template: '<div><slot /></div>' },
        TerminalButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
        MetricTile: { template: '<div><slot /></div>' },
        TrendChart: { template: '<div><slot name="summary" /></div>' },
      },
    },
  })
}

describe('RepositoryDetail.vue integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders repository info, PR stats, review metrics, and trends when APIs resolve', async () => {
    vi.mocked(repositoriesApi.repositoriesApi.get).mockResolvedValueOnce({ id: 1, owner: 'me', name: 'repo' } as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.listByRepo).mockResolvedValueOnce([{ id: 11, number: 1, title: 'PR 1', state: 'open' }] as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.statsByRepo).mockResolvedValueOnce({ total: 5, open: 2, merged: 2, closed: 1, merge_rate: 0.4 } as any)
    vi.mocked(reviewsApi.reviewsApi.metricsByRepo).mockResolvedValueOnce({ approvals: 3, change_requests: 1, comments: 10 } as any)
    vi.mocked(analyticsApi.analyticsApi.trendsByRepo).mockResolvedValueOnce({ labels: ['2024-01-01'], comments: [2], change_request_rate: [0.2] } as any)
    vi.mocked(syncApi.syncApi.repoHistory).mockResolvedValueOnce([] as any)

    const wrapper = mountWithQuery()
    // flush promises
    await Promise.resolve()
    await Promise.resolve()

    expect(wrapper.text()).toContain('Repository Details')
    // shows PR count (tile or list placeholder text)
    expect(vi.mocked(pullRequestsApi.pullRequestsApi.listByRepo)).toHaveBeenCalled()
    expect(vi.mocked(pullRequestsApi.pullRequestsApi.statsByRepo)).toHaveBeenCalled()
    expect(vi.mocked(reviewsApi.reviewsApi.metricsByRepo)).toHaveBeenCalled()
    expect(vi.mocked(analyticsApi.analyticsApi.trendsByRepo)).toHaveBeenCalled()
  })

  it('clicking Sync triggers mutation and invalidations', async () => {
    vi.mocked(repositoriesApi.repositoriesApi.get).mockResolvedValue({ id: 1, owner: 'me', name: 'repo' } as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.listByRepo).mockResolvedValue([{ id: 11, number: 1, title: 'PR 1', state: 'open' }] as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.statsByRepo).mockResolvedValue({ total: 5, open: 2, merged: 2, closed: 1, merge_rate: 0.4 } as any)
    vi.mocked(reviewsApi.reviewsApi.metricsByRepo).mockResolvedValue({ approvals: 3, change_requests: 1, comments: 10 } as any)
    vi.mocked(analyticsApi.analyticsApi.trendsByRepo).mockResolvedValue({ labels: ['2024-01-01'], comments: [2], change_request_rate: [0.2] } as any)
    vi.mocked(syncApi.syncApi.repoHistory).mockResolvedValue([] as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.syncRepo).mockResolvedValue({ success: true } as any)

    const wrapper = mountWithQuery()
    await Promise.resolve()
    await Promise.resolve()

    // find Sync buttons (toolbar & header), click one
    const syncBtn = wrapper.findAll('button').find((b: any) => b.text().includes('Sync'))
    expect(syncBtn).toBeTruthy()
    await syncBtn!.trigger('click')

    expect(pullRequestsApi.pullRequestsApi.syncRepo).toHaveBeenCalledWith(1)
  })

  it('sync history renders empty state and updates when data arrives', async () => {
    vi.mocked(repositoriesApi.repositoriesApi.get).mockResolvedValue({ id: 1, owner: 'me', name: 'repo' } as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.listByRepo).mockResolvedValue([] as any)
    vi.mocked(pullRequestsApi.pullRequestsApi.statsByRepo).mockResolvedValue({ total: 0, open: 0, merged: 0, closed: 0, merge_rate: 0 } as any)
    vi.mocked(reviewsApi.reviewsApi.metricsByRepo).mockResolvedValue({ approvals: 0, change_requests: 0, comments: 0 } as any)
    vi.mocked(analyticsApi.analyticsApi.trendsByRepo).mockResolvedValue({ labels: [], comments: [], change_request_rate: [] } as any)
    vi.mocked(syncApi.syncApi.repoHistory)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([
        { id: 1, status: 'completed', type: 'incremental', started_at: new Date().toISOString() },
      ] as any)

    const wrapper = mountWithQuery()
    await Promise.resolve()
    await Promise.resolve()

    expect(wrapper.text()).toContain('No sync events yet.')

    // change limit to trigger refetch
    const select = wrapper.find('select#history-limit')
    await select.setValue('25')
    await Promise.resolve()
    await Promise.resolve()

    expect(vi.mocked(syncApi.syncApi.repoHistory)).toHaveBeenCalledTimes(2)
  })
})
