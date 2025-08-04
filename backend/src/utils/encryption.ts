import crypto from 'crypto'

/**
 * Encryption utilities for securing sensitive data like PATs
 */
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32 // 256 bits
  private static readonly IV_LENGTH = 12 // 96 bits for GCM
  private static readonly TAG_LENGTH = 16 // 128 bits

  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is required for PAT encryption')
    }
    
    // Ensure key is exactly 32 bytes
    if (key.length === 64) {
      // Assume hex string
      return Buffer.from(key, 'hex')
    } else if (key.length === 32) {
      // Assume raw bytes
      return Buffer.from(key, 'utf8')
    } else {
      // Hash the key to get consistent 32 bytes
      return crypto.createHash('sha256').update(key).digest()
    }
  }

  /**
   * Encrypt a string (like a PAT) for secure storage
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey()
      const iv = crypto.randomBytes(this.IV_LENGTH)

      // Node's modern API uses createCipheriv/createDecipheriv for GCM
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv, { authTagLength: this.TAG_LENGTH })
      cipher.setAAD(Buffer.from('pat-encryption', 'utf8')) // Additional authenticated data

      const encryptedBuf = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
      const tag = cipher.getAuthTag()

      // Combine IV + tag + encrypted data
      const combined = Buffer.concat([iv, tag, encryptedBuf])
      
      return combined.toString('base64')
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  /**
   * Decrypt an encrypted string (like a PAT)
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey()
      const combined = Buffer.from(encryptedData, 'base64')
      
      // Extract IV, tag, and encrypted data
      const iv = combined.subarray(0, this.IV_LENGTH)
      const tag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.TAG_LENGTH)
      const encrypted = combined.subarray(this.IV_LENGTH + this.TAG_LENGTH)
      
      // Node's modern API uses createDecipheriv for GCM
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv, { authTagLength: this.TAG_LENGTH })
      decipher.setAuthTag(tag)
      decipher.setAAD(Buffer.from('pat-encryption', 'utf8'))

      const decryptedBuf = Buffer.concat([decipher.update(encrypted), decipher.final()])
      return decryptedBuf.toString('utf8')
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data - data may be corrupted or key may be incorrect')
    }
  }

  /**
   * Generate a secure encryption key for initial setup
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex')
  }

  /**
   * Validate that encryption/decryption is working correctly
   */
  static validateEncryption(): boolean {
    try {
      const testData = 'test-pat-token-12345'
      const encrypted = this.encrypt(testData)
      const decrypted = this.decrypt(encrypted)
      return decrypted === testData
    } catch (error) {
      console.error('Encryption validation failed:', error)
      return false
    }
  }
}
