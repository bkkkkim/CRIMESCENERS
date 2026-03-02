
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dataService } from '../src/services/dataService';
import { DEFAULT_ADMIN_SETTINGS } from '../constants';

const LoadingScreen = () => {
  const [logoUrl, setLogoUrl] = useState(DEFAULT_ADMIN_SETTINGS.logoUrl);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await dataService.getSettings();
      if (settings.logoUrl) setLogoUrl(settings.logoUrl);
    };
    loadSettings();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-[#121212] flex flex-col items-center justify-center"
    >
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10"
        >
          <img src={logoUrl} alt="CRIME SCENERS" className="h-16 md:h-24 w-auto object-contain" />
        </motion.div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-white/40 text-xs tracking-[0.4em] uppercase font-en animate-pulse">Investigating the scene...</p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingScreen;
