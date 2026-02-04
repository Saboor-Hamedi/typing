import React from 'react';
import { motion } from 'framer-motion';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <motion.div
        className="loader-pill"
        initial={{ width: 0, opacity: 0 }}
        animate={{ 
          width: ['0%', '150px', '200px'],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 0.4,
          times: [0, 0.5, 1],
          ease: "circOut"
        }}
      />
    </div>
  );
};

export default Loader;
