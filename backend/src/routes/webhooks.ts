import { Hono } from 'hono'
import crypto from 'crypto'

const webhookRoutes = new Hono()

// GitHub webhook endpoint
webhookRoutes.post('/github', async (c) => {
  try {
    const signature = c.req.header('x-hub-signature-256')
    const event = c.req.header('x-github-event')
    const delivery = c.req.header('x-github-delivery')
    
    if (!signature || !event || !delivery) {
      console.log('Missing required webhook headers')
      return c.json({ error: 'Missing required headers' }, 400)
    }

    const body = await c.req.text()
    
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    if (webhookSecret) {
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(body, 'utf8')
        .digest('hex')}`

      // Use timingSafeEqual to prevent timing attacks
      if (!crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      )) {
        console.log('Invalid webhook signature')
        return c.json({ error: 'Invalid signature' }, 401)
      }
    }

    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.log('Invalid JSON payload')
      return c.json({ error: 'Invalid JSON' }, 400)
    }

    console.log(`Received GitHub webhook: ${event} (${delivery})`)

    // Handle different webhook events
    switch (event) {
      case 'pull_request':
        await handlePullRequestEvent(payload)
        break
      case 'pull_request_review':
        await handlePullRequestReviewEvent(payload)
        break
      case 'push':
        await handlePushEvent(payload)
        break
      case 'installation':
        await handleInstallationEvent(payload)
        break
      case 'installation_repositories':
        await handleInstallationRepositoriesEvent(payload)
        break
      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return c.json({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Webhook event handlers
async function handlePullRequestEvent(payload: any) {
  console.log(`PR ${payload.action}: ${payload.pull_request.title}`)
  // TODO: Implement PR sync logic
  // This could trigger automatic sync of the PR data
}

async function handlePullRequestReviewEvent(payload: any) {
  console.log(`PR Review ${payload.action}: ${payload.review.state}`)
  // TODO: Implement review sync logic
  // This could trigger automatic sync of review data
}

async function handlePushEvent(payload: any) {
  console.log(`Push to ${payload.ref} in ${payload.repository.full_name}`)
  // TODO: Handle push events if needed
}

async function handleInstallationEvent(payload: any) {
  console.log(`App installation ${payload.action}`)
  // TODO: Handle app installation/uninstallation
  // This could automatically add/remove repositories from tracking
}

async function handleInstallationRepositoriesEvent(payload: any) {
  console.log(`Installation repositories ${payload.action}`)
  // TODO: Handle repository addition/removal from installation
}

export { webhookRoutes }
