'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/router';
import React, { useState, FormEvent, MouseEventHandler } from 'react';
import { ReactTyped } from 'react-typed';

import Layout from '@/components/Layout';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 40ms between children
    },
  },
};

const childVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const Typewriter: React.FC<{ text: string }> = ({ text }) => {
  const letters = text.split('');

  return (
    <motion.div
      className="inline-block"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {letters.map((char, i) => (
        <motion.span key={i} variants={childVariants}>
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};

// Props for customizing certain aspects of the sign-up flow
interface SignupSplitLayoutProps {
  pageTitle?: string;
  typedStrings?: string[]; // For the typed text array
  onSignup?: (
    email: string,
    password: string,
    confirm: string
  ) => Promise<void> | void; // or a standard function
  isLoading?: boolean; // control the submit button
  error?: string | null; // for error display
  showConfirmField?: boolean; // if you want to optionally hide confirm
  children?: React.ReactNode; // for additional content
}

export const SignupSplitLayout: React.FC<SignupSplitLayoutProps> = ({
  pageTitle = 'Sign up',
  typedStrings = [
    '- y',
    '- yo',
    '- you',
    '- your next step in R2R excellence.',
  ],
  onSignup,
  isLoading = false,
  error = null,
  showConfirmField = true,
  children = null,
}) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Toggles for password text visibility
  const togglePasswordVisibility: MouseEventHandler<HTMLButtonElement> = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmVisibility: MouseEventHandler<HTMLButtonElement> = () => {
    setShowConfirm(!showConfirm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // If a callback is provided, pass email, password, confirm
    if (onSignup) {
      await onSignup(email, password, confirm);
    }
  };

  return (
    <Layout includeFooter={false} pageTitle={pageTitle}>
      <div className="flex min-h-screen w-full overflow-hidden">
        {/* LEFT SECTION: SIGNUP FORM */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 p-6">
          {children}
        </div>

        {/* RIGHT SECTION: BRAND/LOGO + TYPED MESSAGING */}
        <div className="hidden md:flex w-1/2 items-center justify-center relative bg-zinc-900 text-white p-8">
          {/* Subtle fade animation */}
          <motion.div
            className="absolute inset-0 object-cover object-center bg-gradient-to-br from-zinc-900 via-green-500/20 to-zinc-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9 }}
          />

          <motion.div
            className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 max-w-sm"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Logo className="w-32 h-32 mb-4" />
            <h2 className="text-3xl font-bold">Welcome to SciPhi Cloud</h2>

            {/* Typed message */}
            <p className="text-lg text-gray-300 leading-relaxed">
              {/* <Typewriter text={"The most advanced AI retrieval system."} /> */}
              <ReactTyped
                strings={[
                  'The most advanced AI retrieval system.',
                  // "Your next step in R2R excellence.",
                ]}
                typeSpeed={40}
                backSpeed={30}
                backDelay={800}
                // loop
                showCursor
              />
            </p>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default SignupSplitLayout;