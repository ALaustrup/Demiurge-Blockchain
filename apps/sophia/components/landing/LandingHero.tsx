"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@components/AnimatedBackground";
import Link from "next/link";

interface LandingHeroProps {
  onEnter?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnter }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  const glowVariants = {
    animate: {
      boxShadow: [
        "0 0 20px rgba(124, 58, 237, 0.3)",
        "0 0 40px rgba(124, 58, 237, 0.5)",
        "0 0 20px rgba(124, 58, 237, 0.3)",
      ],
      transition: {
        duration: 3,
        repeat: Infinity,
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 0 30px rgba(124, 58, 237, 0.8)",
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-navy-900">
      {/* Animated background */}
      <AnimatedBackground intensity="high" />

      {/* Animated background grid (OLD - can be removed) */}
      <motion.div
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 2 }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </motion.div>

      {/* Content container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        <motion.div
          className="text-center max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
        >
          {/* Logo/Icon */}
          <motion.div
            className="mb-8 inline-block"
            variants={logoVariants}
          >
            <motion.div
              className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center text-4xl font-bold text-white"
              animate="animate"
              variants={glowVariants}
            >
              ◇
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-4 text-white"
            variants={itemVariants}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-500 to-cyan-400">
              Sophia
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.h2
            className="text-xl md:text-2xl text-gray-300 mb-6 font-light"
            variants={itemVariants}
          >
            Immerse Yourself in the Demiurge Ecosystem
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-base md:text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Enter a next-generation mainnet experience. Sophia guides you through gaming, development, and blockchain
            interaction with unprecedented elegance.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            variants={buttonVariants}
            className="mt-10"
          >
            <Link
              href="/enter"
              className="group relative inline-block px-8 py-4 text-lg font-semibold text-white"
              onClick={onEnter}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-500 rounded-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-cyan-400 rounded-lg opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.3 }}
              />
              <span className="relative inline-flex items-center gap-2">
                Enter Portal
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </span>
            </Link>
          </motion.div>

          {/* Subtext */}
          <motion.p
            className="text-sm text-gray-500 mt-8"
            variants={itemVariants}
          >
            QOR ID authentication • Blockchain integrated • Zero-friction experience
          </motion.p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-gray-500 text-xs">Scroll to explore</div>
      </motion.div>
    </div>
  );
};

export default LandingHero;
