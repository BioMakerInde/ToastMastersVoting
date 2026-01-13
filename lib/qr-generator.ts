import QRCode from 'qrcode'

/**
 * Generate QR code for member ID
 * @param memberId - Unique member identifier
 * @returns Base64 encoded QR code image
 */
export async function generateMemberQRCode(memberId: string): Promise<string> {
    try {
        const qrCodeDataURL = await QRCode.toDataURL(memberId, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF',
            },
        })
        return qrCodeDataURL
    } catch (error) {
        console.error('Error generating QR code:', error)
        throw new Error('Failed to generate QR code')
    }
}

/**
 * Generate QR code as buffer for storage
 * @param memberId - Unique member identifier
 * @returns Buffer containing QR code image
 */
export async function generateQRCodeBuffer(memberId: string): Promise<Buffer> {
    try {
        const buffer = await QRCode.toBuffer(memberId, {
            width: 300,
            margin: 2,
        })
        return buffer
    } catch (error) {
        console.error('Error generating QR code buffer:', error)
        throw new Error('Failed to generate QR code buffer')
    }
}
