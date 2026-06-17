import fs from 'fs';
import path from 'path';

export interface SavedFileInfo {
  path: string;
  filename: string;
  originalname: string;
}

/**
 * Saves a base64 Data URL to the local uploads directory.
 * Works symmetrically for development or production environment paths.
 * 
 * @param base64DataUrl The data URI (e.g. data:image/jpeg;base64,...)
 * @param prefix Prefix for the generated filename
 * @param targetSubfolder Subfolder under uploads/ (e.g. 'avatar', 'proof', 'aadhaar')
 */
export const saveBase64File = (
  base64DataUrl: string,
  prefix: string,
  targetSubfolder: string
): SavedFileInfo => {
  const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 file data. Must be a valid Data URL.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Enforce 5 MB limit (5 * 1024 * 1024 = 5,242,880 bytes)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (buffer.length > MAX_SIZE) {
    throw new Error('File size exceeds the maximum allowed limit of 5 MB.');
  }
  
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/pdf': '.pdf',
  };
  const ext = map[mimeType] || '.jpg';
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `${prefix}-${uniqueSuffix}${ext}`;
  const uploadDir = process.env.VERCEL
    ? '/tmp'
    : path.resolve(__dirname, `../../uploads/${targetSubfolder}`);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);
  
  return {
    path: filePath,
    filename,
    originalname: `${prefix}${ext}`,
  };
};
