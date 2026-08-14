
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  logoUrl?: string | null;
}

const DEFAULT_LOGO = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';

const isValidLogoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  if (url === '/logo.jpg' || url.includes('unsplash.com') || url.includes('picsum.photos')) return false;
  return true;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ logoUrl }) => {
  const targetUrl = isValidLogoUrl(logoUrl) ? logoUrl! : DEFAULT_LOGO;
  const [displayUrl, setDisplayUrl] = useState<string>(targetUrl);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const valid = isValidLogoUrl(logoUrl) ? logoUrl! : DEFAULT_LOGO;
    setDisplayUrl(valid);
    setHasError(false);
  }, [logoUrl]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center select-none"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{ 
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 1.6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative z-10 flex items-center justify-center min-h-[64px] px-4"
        >
          {/* Typography Brand Fallback while image is decoding/loading */}
          {(!isLoaded || hasError) && (
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-white font-en uppercase transition-opacity duration-300">
              Crime Sceners
            </span>
          )}

          {/* Actual Logo Image - hidden until fully loaded & decoded to prevent mobile broken icon flash */}
          {!hasError && (
            <img 
              src={displayUrl} 
              alt="Crime Sceners" 
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                if (displayUrl !== DEFAULT_LOGO) {
                  setDisplayUrl(DEFAULT_LOGO);
                } else {
                  setHasError(true);
                }
              }}
              className={`h-16 md:h-20 w-auto object-contain transition-opacity duration-300 ${
                isLoaded ? 'opacity-100 block' : 'opacity-0 absolute pointer-events-none'
              }`}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center"
        >
          <p className="text-white/30 text-[8px] md:text-[9px] tracking-widest uppercase font-en animate-pulse">
            Investigating the scene...
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
