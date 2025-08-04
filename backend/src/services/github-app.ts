import { Octokit } from '@octokit/rest'
import jwt from 'jsonwebtoken'

export class GitHubAppService {
  private appId: string
  private privateKey: string
  private octokit: Octokit

  constructor() {
    this.appId = process.env.GITHUB_APP_ID || ''
    
    // Handle base64 encoded private key
    const privateKeyBase64 = process.env.GITHUB_PRIVATE_KEY_BASE64
    if (!privateKeyBase64) {
      throw new Error('GITHUB_PRIVATE_KEY_BASE64 environment variable is required')
    }
    
    try {
      // Decode base64 private key
      this.privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8')
    } catch (error) {
      throw new Error('Failed to decode GITHUB_PRIVATE_KEY_BASE64: ' + (error as Error).message)
    }

    if (!this.appId) {
      throw new Error('GITHUB_APP_ID environment variable is required')
    }

    // Initialize Octokit without auth for now - we'll generate JWTs as needed
    this.octokit = new Octokit({
      userAgent: 'PR-Tracker-App/1.0.0',
    })
  }

  /**
   * Generate a JWT for GitHub App authentication
   */
  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000)
    
    const payload = {
      iat: now - 60, // Issued at time (60 seconds ago to account for clock skew)
      exp: now + (10 * 60), // Expires in 10 minutes (GitHub's maximum)
      iss: this.appId, // Issuer (GitHub App ID)
    }

    return jwt.sign(payload, this.privateKey, { algorithm: 'RS256' })
  }

  /**
   * Get an installation access token for a specific installation
   */
  async getInstallationAccessToken(installationId: number): Promise<string> {
    const jwtToken = this.generateJWT()
    
    const response = await this.octokit.request('POST /app/installations/{installation_id}/access_tokens', {
      installation_id: installationId,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    })

    return response.data.token
  }

  /**
   * Get all installations for this GitHub App
   */
  async getInstallations() {
    const jwtToken = this.generateJWT()
    
    const response = await this.octokit.request('GET /app/installations', {
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    })

    return response.data
  }

  /**
   * Get a specific installation by ID
   */
  async getInstallation(installationId: number) {
    const jwtToken = this.generateJWT()
    
    const response = await this.octokit.request('GET /app/installations/{installation_id}', {
      installation_id: installationId,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    })

    return response.data
  }

  /**
   * Get repositories accessible to a specific installation
   */
  async getInstallationRepositories(installationId: number) {
    const accessToken = await this.getInstallationAccessToken(installationId)
    
    const installationOctokit = new Octokit({
      auth: accessToken,
      userAgent: 'PR-Tracker-App/1.0.0',
    })

    const response = await installationOctokit.request('GET /installation/repositories')
    return response.data.repositories
  }

  /**
   * Create an Octokit instance authenticated as an installation
   */
  async createInstallationOctokit(installationId: number): Promise<Octokit> {
    const accessToken = await this.getInstallationAccessToken(installationId)
    
    return new Octokit({
      auth: accessToken,
      userAgent: 'PR-Tracker-App/1.0.0',
    })
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.warn('GITHUB_WEBHOOK_SECRET not configured - webhook signature verification disabled')
      return true // Allow webhooks if no secret is configured
    }

    const crypto = require('crypto')
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', webhookSecret)
      .update(payload, 'utf8')
      .digest('hex')}`

    // Use timingSafeEqual to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }
}
