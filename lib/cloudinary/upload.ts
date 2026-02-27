import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function getSignedUploadParams(personId: string) {
  const timestamp = Math.round(Date.now() / 1000)
  const params = {
    timestamp,
    folder: `familygraph/${personId}`,
    tags: `person_${personId}`,
  }
  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  )
  return {
    ...params,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  }
}

export function getPublicUrl(publicId: string, options: { width?: number; height?: number } = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options.width ?? 400,
        height: options.height ?? 400,
        crop: 'fill',
        quality: 'auto',
        fetch_format: 'auto',
      },
    ],
  })
}
