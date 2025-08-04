import { Octokit } from '@octokit/rest'
import { User } from '../types/auth.js'
import { OAuthService } from './oauth.js'
import { UserService } from './user.js'
import { EncryptionService } from '../utils/encryption.js'

type OrgSummary = { login: string; id: number; avatar_url?: string };

export class GitHubService {
  private octokit: Octokit
  private user?: User
  private oauthService?: OAuthService
  private userService?: UserService

  constructor(userOrToken?: User | string) {
    let token: string;

    if (typeof userOrToken === 'string') {
      // Direct token provided
      token = userOrToken;
    } else if (userOrToken && typeof userOrToken === 'object') {
      // User object provided, prefer PAT over OAuth token
      this.user = userOrToken;
      
      // Try to use PAT first if available
      if (userOrToken.github_pat_encrypted) {
        try {
          token = EncryptionService.decrypt(userOrToken.github_pat_encrypted);
          console.log('Using PAT for GitHub authentication for user:', userOrToken.login);
        } catch (error) {
          console.warn('Failed to decrypt PAT, falling back to OAuth token for user:', userOrToken.login);
          token = userOrToken.access_token;
        }
      } else {
        // Use OAuth token as fallback
        token = userOrToken.access_token;
      }

      // Initialize OAuth and User services for token refresh
      this.oauthService = new OAuthService();
      this.userService = new UserService();
    } else {
      // Fallback to environment variable (legacy support)
      token = process.env.GITHUB_TOKEN || '';
      if (!token) {
        throw new Error('GitHub authentication required. Provide user token or set GITHUB_TOKEN environment variable.');
      }
    }

    this.octokit = new Octokit({
      auth: token,
      userAgent: 'PR-Tracker/1.0.0',
    })
  }

  /**
   * Create a GitHub service instance for a specific user
   */
  static forUser(user: User): GitHubService {
    return new GitHubService(user);
  }

  /**
   * Create a GitHub service instance with a specific token
   */
  static withToken(token: string): GitHubService {
    return new GitHubService(token);
  }

  /**
   * Get the Octokit instance for debugging purposes
   */
  getOctokit(): Octokit {
    return this.octokit;
  }

  /**
   * Check if user token is expired and refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.user || !this.oauthService || !this.userService) {
      return; // No user context, can't refresh
    }

    // Check if token is expired or will expire soon
    if (this.oauthService.isTokenExpired(this.user.token_expires_at, 5)) {
      if (!this.user.refresh_token) {
        throw new Error('Access token expired and no refresh token available. Please re-authenticate.');
      }

      try {
        console.log('Refreshing expired GitHub token for user:', this.user.login);

        // Refresh the token
        const tokenResponse = await this.oauthService.refreshToken(this.user.refresh_token);

        // Update user with new tokens
        const scopes = this.oauthService.parseScopes(tokenResponse.scope);
        const expiresAt = this.oauthService.calculateExpirationDate(tokenResponse.expires_in);

        const updatedUser = await this.userService.createOrUpdateUser(
          {
            id: this.user.github_id,
            login: this.user.login,
            name: this.user.name,
            email: this.user.email,
            avatar_url: this.user.avatar_url
          },
          tokenResponse.access_token,
          tokenResponse.refresh_token || this.user.refresh_token,
          scopes,
          expiresAt
        );

        // Update local user object and recreate Octokit instance
        this.user = updatedUser;
        this.octokit = new Octokit({
          auth: updatedUser.access_token,
          userAgent: 'PR-Tracker/1.0.0',
        });

        console.log('Successfully refreshed GitHub token for user:', this.user.login);
      } catch (error) {
        console.error('Failed to refresh GitHub token:', error);
        throw new Error('Failed to refresh access token. Please re-authenticate.');
      }
    }
  }

  /**
   * Wrapper for API calls that handles token refresh
   */
  private async withTokenRefresh<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
      await this.ensureValidToken();
      return await apiCall();
    } catch (error: any) {
      // If we get a 401 Unauthorized, try refreshing the token once
      if (error.status === 401 && this.user && this.user.refresh_token) {
        console.log('Received 401, attempting token refresh for user:', this.user.login);

        try {
          await this.ensureValidToken();
          return await apiCall();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Authentication failed. Please re-authenticate.');
        }
      }

      throw error;
    }
  }

  async getCurrentUser() {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.users.getAuthenticated()
      return response.data
    })
  }

  async getRepository(owner: string, repo: string) {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      })
      return response.data
    })
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
    return this.withTokenRefresh(async () => {
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
    })
  }

  async getPullRequestDetails(owner: string, repo: string, pull_number: number) {
    return this.withTokenRefresh(async () => {
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
    })
  }

  async getPullRequestFiles(owner: string, repo: string, pull_number: number) {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number,
      })

      return response.data
    })
  }

  async getReviewComments(owner: string, repo: string, pull_number: number) {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.pulls.listReviewComments({
        owner,
        repo,
        pull_number,
      })

      return response.data
    })
  }

  async getRateLimit() {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.rateLimit.get()
      return response.data
    })
  }

  /**
   * List organizations for the authenticated user
   * Tries memberships endpoint first for private organizations, falls back to public orgs
   */
  async getUserOrganizations(): Promise<OrgSummary[]> {
    return this.withTokenRefresh(async () => {
      try {
        // Try memberships endpoint first - this shows private organizations
        const membershipsResponse = await this.octokit.request('GET /user/memberships/orgs', {
          per_page: 100,
          state: 'active'
        })

        if (membershipsResponse.data.length > 0) {
          return membershipsResponse.data.map((membership: any) => ({
            login: membership.organization.login,
            id: membership.organization.id,
            avatar_url: membership.organization.avatar_url ?? undefined,
          }))
        }
      } catch (error) {
        console.log('Memberships endpoint failed, falling back to public orgs:', error)
      }

      // Fallback to public organizations endpoint
      const response = await this.octokit.rest.orgs.listForAuthenticatedUser({
        per_page: 100,
        page: 1,
      })
      return response.data.map(org => ({
        login: org.login,
        id: org.id,
        avatar_url: org.avatar_url ?? undefined,
      }))
    })
  }

  /**
   * List repositories for a specific organization
   */
  async getOrganizationRepositories(
    org: string,
    options: {
      page?: number
      per_page?: number
      sort?: 'created' | 'updated' | 'pushed' | 'full_name'
      direction?: 'asc' | 'desc'
      type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member'
    } = {}
  ) {
    return this.withTokenRefresh(async () => {
      const response = await this.octokit.rest.repos.listForOrg({
        org,
        page: options.page || 1,
        per_page: Math.min(options.per_page || 100, 100),
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        type: (options.type as any) || 'all',
      })

      // Filter out archived repos and ensure user has at least read permissions if present
      const repos = response.data.filter(repo => {
        return !repo.archived && (repo.permissions?.pull ?? true)
      })

      return repos
    })
  }

  /**
   * Get all repositories the authenticated user has access to
   * Includes personal repos, organization repos, and collaborator repos
   */
  async getUserAccessibleRepositories(options: {
    page?: number
    per_page?: number
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    affiliation?: string
    visibility?: 'all' | 'public' | 'private'
  } = {}) {
    return this.withTokenRefresh(async () => {
      // Build parameters - cannot use both affiliation and type together
      const params: any = {
        page: options.page || 1,
        per_page: Math.min(options.per_page || 100, 100), // GitHub API limit
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
      }

      // Use affiliation to get repos from personal, collaborator, and organization contexts
      // This is more comprehensive than using 'type' parameter
      if (options.affiliation) {
        params.affiliation = options.affiliation
      } else {
        params.affiliation = 'owner,collaborator,organization_member'
      }

      // Optionally filter by visibility (public/private)
      if (options.visibility && options.visibility !== 'all') {
        params.visibility = options.visibility
      }

      const response = await this.octokit.rest.repos.listForAuthenticatedUser(params)

      // Filter out archived repositories and ensure user has at least read access
      const accessibleRepos = response.data.filter(repo => {
        return !repo.archived && (repo.permissions?.pull || repo.permissions?.push || repo.permissions?.admin)
      })

      return {
        repositories: accessibleRepos,
        total_count: response.data.length,
        has_next_page: response.data.length === (options.per_page || 100)
      }
    })
  }
}
