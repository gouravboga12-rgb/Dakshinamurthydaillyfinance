import fs from 'fs';

/**
 * Uploads a local file to Cloudinary using native fetch and FormData (Node.js 18+).
 * Uses the unsigned upload preset 'daily_preset' for the cloud 'dstfeohbw'.
 * 
 * @param filePath Path to the local file
 * @returns The secure URL of the uploaded asset in Cloudinary
 */
export async function uploadToCloudinary(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dstfeohbw';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'daily_preset';

  console.log(`Uploading file ${filePath} to Cloudinary (Cloud: ${cloudName}, Preset: ${uploadPreset})...`);

  // Read file into a Buffer and create a Blob
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = filePath.split(/[\\/]/).pop() || 'upload';
  const blob = new Blob([fileBuffer]);

  // Construct FormData
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000), // 30s timeout for image uploads
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload error (HTTP ${response.status}): ${errorText}`);
  }

  const data: any = await response.json();
  console.log(`Cloudinary upload successful! URL: ${data.secure_url}`);
  return data.secure_url;
}
