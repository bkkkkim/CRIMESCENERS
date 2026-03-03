
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dataService } from '../src/services/dataService';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';

const LoadingScreen = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [useTextFallback, setUseTextFallback] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const settings = await dataService.getSettings();
        if (settings.logoUrl && settings.logoUrl !== '/logo.jpg') {
          setLogoUrl(settings.logoUrl);
        } else {
          setUseTextFallback(true);
        }
      } catch (error) {
        console.error("Failed to load logo in loading screen:", error);
        setUseTextFallback(true);
      }
    };
    loadLogo();
  }, []);

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
            opacity: [0.3, 1, 0.3],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative z-10"
        >
          {logoUrl && !useTextFallback ? (
            <img 
              src={logoUrl} 
              alt="CRIME SCENERS" 
              className="h-16 md:h-24 w-auto object-contain" 
              onLoad={() => setIsImageLoaded(true)}
              onError={() => {
                setUseTextFallback(true);
              }}
            />
          ) : (
            <span className="text-2xl md:text-4xl font-black tracking-tighter text-white font-en uppercase">
              Crime Sceners
            </span>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="text-white/40 text-[10px] md:text-xs tracking-normal uppercase font-en animate-pulse">Investigating the scene...</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
