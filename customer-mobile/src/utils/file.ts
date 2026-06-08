import { Platform } from 'react-native';

/**
 * Converts a local file URI (content:// or file://) to a Base64 Data URL.
 * Works natively in both React Native (Hermes/JSC) and Web environments.
 * 
 * @param uri Local file path or content URI
 */
export const fileUriToBase64 = async (uri: string): Promise<string> => {
  if (!uri) return '';
  
  // If it's already a base64 string, return it directly
  if (uri.startsWith('data:')) {
    return uri;
  }
  
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('FileReader returned non-string result.'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('[File Util] Failed to convert URI to Base64:', err);
    throw err;
  }
};
