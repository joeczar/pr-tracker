import { Octokit } from '@octokit/rest'

export class GitHubService {
  private octokit: Octokit

  constructor() {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required')
    }

    this.octokit = new Octokit({
      auth: token,
      userAgent: 'PR-Tracker/1.0.0',
    })
  }

  async getCurrentUser() {
    const response = await this.octokit.rest.users.getAuthenticated()
    return response.data
  }

  async getRepository(owner: string, repo: string) {
    const response = await this.octokit.rest.repos.get({
      owner,
      repo,
    })
    return response.data
  }

  async getPullRequests(
    owner: string, 
    repo: string, 
    options: {
      state?: 'open' | 'closed' | 'all'
      page?: number
      per_page?: number
    } = {}
  ) {
    const response = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: options.state || 'all',
      page: options.page || 1,
      per_page: Math.min(options.per_page || 30, 100), // GitHub API limit
      sort: 'updated',
      direction: 'desc',
    })
    
    return response.data
  }

  async getPullRequestDetails(owner: string, repo: string, pull_number: number) {
    const [prResponse, reviewsResponse, commitsResponse] = await Promise.all([
      this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number,
      }),
      this.octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number,
      }),
      this.octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number,
      }),
    ])

    return {
      pullRequest: prResponse.data,
      reviews: reviewsResponse.data,
      commits: commitsResponse.data,
    }
  }

  async getPullRequestFiles(owner: string, repo: string, pull_number: number) {
    const response = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
    })
    
    return response.data
  }

  async getReviewComments(owner: string, repo: string, pull_number: number) {
    const response = await this.octokit.rest.pulls.listReviewComments({
      owner,
      repo,
      pull_number,
    })
    
    return response.data
  }

  async getRateLimit() {
    const response = await this.octokit.rest.rateLimit.get()
    return response.data
  }
}
