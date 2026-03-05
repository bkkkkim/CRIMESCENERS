
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dataService } from '../src/services/dataService';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';

interface LoadingScreenProps {
  logoUrl?: string | null;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ logoUrl }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);
  const defaultLogo = 'https://gkkgprsflomawizioiao.supabase.co/storage/v1/object/public/images/brand/1772555492065-xn1njp.webp';
  const [displayUrl, setDisplayUrl] = useState<string>(logoUrl || defaultLogo);

  useEffect(() => {
    if (logoUrl) {
      setDisplayUrl(logoUrl);
      setUseTextFallback(false);
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
          className="relative z-10"
        >
          {!useTextFallback && displayUrl ? (
            <img 
              key={displayUrl}
              src={displayUrl} 
              alt="CRIME SCENERS" 
              className="h-16 md:h-20 w-auto object-contain" 
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                setUseTextFallback(true);
              }}
              loading="eager"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-2xl md:text-3xl font-black tracking-tighter text-white font-en uppercase">
              Crime Sceners
            </span>
          )}
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
