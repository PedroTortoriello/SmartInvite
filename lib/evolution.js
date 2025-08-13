// Evolution API Service
class EvolutionAPI {
  constructor() {
    this.baseUrl = process.env.EVOLUTION_BASE_URL?.replace('/dashboard', '') || ''
    this.token = process.env.EVOLUTION_TOKEN
    this.webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET
    this.webhookBase = process.env.EVOLUTION_WEBHOOK_BASE
    
    // Check if we should use mock mode
    this.isMockMode = !this.token || !this.baseUrl
    
    if (this.isMockMode) {
      console.log('🟡 Using Mock Evolution API - Set EVOLUTION_TOKEN to enable real API')
    }
  }

  async createInstance({ orgId }) {
    if (this.isMockMode) {
      // Mock response for development
      const mockInstanceId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log('🟡 Mock: Created Evolution instance:', mockInstanceId)
      
      return {
        instanceId: mockInstanceId,
        status: 'pending',
        qrCode: null,
        webhookConfigured: true
      }
    }

    try {
      // Create instance via Evolution Manager API
      const response = await fetch(`${this.baseUrl}/manager/instance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: `org-${orgId}`,
          token: this.token,
          qrcode: true
        })
      })

      if (!response.ok) {
        throw new Error(`Evolution API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Configure webhook
      const webhookUrl = `${this.webhookBase}?secret=${this.webhookSecret}&org=${orgId}`
      await this.setWebhook({ instanceId: data.instance.instanceName, url: webhookUrl })

      return {
        instanceId: data.instance.instanceName,
        status: data.instance.connectionStatus || 'pending',
        qrCode: data.qrcode?.base64,
        webhookConfigured: true
      }
    } catch (error) {
      console.error('Evolution API createInstance error:', error)
      throw new Error(`Failed to create Evolution instance: ${error.message}`)
    }
  }

  async setWebhook({ instanceId, url }) {
    if (this.isMockMode) {
      console.log('🟡 Mock: Set webhook for instance:', instanceId, 'URL:', url)
      return { success: true }
    }

    try {
      const response = await fetch(`${this.baseUrl}/webhook/${instanceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          enabled: true,
          events: ['messages', 'connection.update']
        })
      })

      if (!response.ok) {
        throw new Error(`Webhook setup failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Evolution API setWebhook error:', error)
      throw error
    }
  }

  async sendMessage({ instanceId, to, message }) {
    if (this.isMockMode) {
      console.log('🟡 Mock: Sending message to', to, 'via instance:', instanceId)
      console.log('🟡 Mock: Message:', message)
      
      return {
        messageId: `mock-msg-${Date.now()}`,
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${instanceId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          number: to,
          text: message
        })
      })

      if (!response.ok) {
        throw new Error(`Send message failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Evolution API sendMessage error:', error)
      throw error
    }
  }

  async getConnectionStatus({ instanceId }) {
    if (this.isMockMode) {
      return {
        status: 'connected',
        qrCode: null
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/instance/${instanceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Get status failed: ${response.status}`)
      }

      const data = await response.json()
      return {
        status: data.connectionStatus || 'disconnected',
        qrCode: data.qrcode?.base64
      }
    } catch (error) {
      console.error('Evolution API getConnectionStatus error:', error)
      throw error
    }
  }

  validateWebhookSecret(providedSecret) {
    return providedSecret === this.webhookSecret
  }
}

export const evolutionAPI = new EvolutionAPI()