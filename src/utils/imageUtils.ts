
export const compressImage = (
  file: File, 
  quality: number = 0.8, 
  format: 'image/webp' | 'image/jpeg' | 'image/png' = 'image/webp',
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate optimal dimensions while preserving aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // If converting to JPEG, fill with white background first to avoid black backgrounds on transparent PNGs
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          format,
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Inline SVG Brand Logo (Zero-network failure proof)
export const BRAND_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80" width="100%" height="100%">
  <rect width="100%" height="100%" fill="none"/>
  <text x="200" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Montserrat', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="4" text-anchor="middle">
    CRIME SCENERS
  </text>
  <rect x="50" y="66" width="300" height="2" fill="#dc2626" opacity="0.8"/>
</svg>
`)}`;

// Generate a high-contrast thriller poster SVG data URI
export const getThrillerPosterSvg = (title: string = 'CRIME SCENE') => {
  const safeTitle = title.replace(/[<>&"]/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="100%" height="100%">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#2a0a0a" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="#141414" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#0a0a0a" stop-opacity="1"/>
    </radialGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>
  
  <rect width="100%" height="100%" fill="#111111"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <rect width="100%" height="100%" fill="url(#vignette)"/>
  
  <!-- Outer border -->
  <rect x="24" y="24" width="552" height="852" fill="none" stroke="rgba(220,38,38,0.3)" stroke-width="2"/>
  <rect x="30" y="30" width="540" height="840" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  
  <!-- Header Tag -->
  <rect x="230" y="55" width="140" height="26" rx="4" fill="#dc2626"/>
  <text x="300" y="73" font-family="-apple-system, sans-serif" font-weight="900" font-size="12" fill="#ffffff" letter-spacing="2" text-anchor="middle">
    CRIME SCENE
  </text>
  
  <!-- Center Mystery Graphic -->
  <circle cx="300" cy="380" r="110" fill="none" stroke="rgba(220,38,38,0.2)" stroke-width="2" stroke-dasharray="6,6"/>
  <circle cx="300" cy="380" r="85" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <path d="M 270 380 L 330 380 M 300 350 L 300 410" stroke="#dc2626" stroke-width="2" opacity="0.6"/>
  
  <!-- Crime Evidence Number -->
  <text x="300" y="390" font-family="-apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" letter-spacing="1" text-anchor="middle" opacity="0.9">
    CASE FILE
  </text>
  
  <!-- Theme Title -->
  <text x="300" y="580" font-family="-apple-system, 'Pretendard', sans-serif" font-weight="900" font-size="34" fill="#ffffff" letter-spacing="-0.5" text-anchor="middle">
    ${safeTitle}
  </text>
  
  <!-- Subtitle / Footer -->
  <rect x="180" y="620" width="240" height="1.5" fill="rgba(255,255,255,0.2)"/>
  <text x="300" y="650" font-family="-apple-system, sans-serif" font-weight="600" font-size="14" fill="#a3a3a3" letter-spacing="3" text-anchor="middle">
    IMMERSIVE THRILLER CAFE
  </text>
  
  <text x="300" y="830" font-family="-apple-system, sans-serif" font-weight="800" font-size="13" fill="rgba(255,255,255,0.4)" letter-spacing="4" text-anchor="middle">
    CRIME SCENERS
  </text>
</svg>
`)}`;
};

export const isDummyOrInvalidUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  if (url.includes('unsplash.com') || url.includes('picsum.photos') || url === '/logo.jpg' || url === '/hero.jpg') {
    return true;
  }
  return false;
};

// Keep backwards-compatibility alias
export const isBrokenSupabaseUrl = (url?: string | null): boolean => {
  return isDummyOrInvalidUrl(url);
};


