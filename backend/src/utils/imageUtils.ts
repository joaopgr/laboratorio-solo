import * as fs from 'fs';
import * as path from 'path';

/**
 * Converte uma imagem para base64
 */
export function imageToBase64(imagePath: string): string | null {
  try {
    const fullPath = path.resolve(imagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Imagem não encontrada: ${fullPath}`);
      return null;
    }
    
    const imageBuffer = fs.readFileSync(fullPath);
    const base64String = imageBuffer.toString('base64');
    
    // Determina o tipo MIME baseado na extensão
    const extension = path.extname(fullPath).toLowerCase();
    let mimeType = 'image/png';
    
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
    }
    
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Erro ao converter imagem para base64: ${error}`);
    return null;
  }
}

/**
 * Obtém o logo da UFES em base64
 */
export function getUfesLogoBase64(): string {
  // Tenta primeiro .png, depois .jpg
  const logoPathPng = path.join(__dirname, '../../public/logos/ufes-logo.png');
  const logoPathJpg = path.join(__dirname, '../../public/logos/ufes-logo.jpg');
  
  return imageToBase64(logoPathPng) || imageToBase64(logoPathJpg) || '';
}

/**
 * Obtém o logo do laboratório em base64
 */
export function getLabLogoBase64(): string {
  // Tenta primeiro .jpg, depois .png
  const logoPathJpg = path.join(__dirname, '../../public/logos/lab-logo.jpg');
  const logoPathPng = path.join(__dirname, '../../public/logos/lab-logo.png');
  
  return imageToBase64(logoPathJpg) || imageToBase64(logoPathPng) || '';
}

/**
 * Obtém o selo em base64
 */
export function getSeloBase64(): string {
  const seloPathPng = path.join(__dirname, '../../public/logos/selo.png');
  return imageToBase64(seloPathPng) || '';
}

/**
 * Obtém a assinatura em base64
 */
export function getAssinaturaBase64(): string {
  const assinaturaPathPng = path.join(__dirname, '../../public/logos/assinatura.png');
  return imageToBase64(assinaturaPathPng) || '';
}
