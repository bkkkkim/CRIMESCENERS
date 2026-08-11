
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  logoUrl?: string | null;
}

const DEFAULT_LOGO = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';

const LoadingScreen: React.FC<LoadingScreenProps> = ({ logoUrl }) => {
  const [displayUrl, setDisplayUrl] = useState<string>(logoUrl || DEFAULT_LOGO);

  useEffect(() => {
    if (logoUrl && !logoUrl.includes('unsplash.com')) {
      setDisplayUrl(logoUrl);
    } else {
      setDisplayUrl(DEFAULT_LOGO);
    }
  }, [logoUrl]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          animate={{ 
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative z-10 flex items-center justify-center min-h-[64px]"
        >
          <img 
            key={displayUrl}
            src={displayUrl} 
            alt="Crime Sceners Logo" 
            className="h-16 md:h-20 w-auto object-contain opacity-100" 
            onError={(e) => {
              if (e.currentTarget.src !== DEFAULT_LOGO) {
                e.currentTarget.src = DEFAULT_LOGO;
              }
            }}
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-3 text-center"
        >
          <p className="text-white/30 text-[8px] md:text-[9px] tracking-widest uppercase font-en animate-pulse">Investigating the scene...</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
