'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QorIdAuthFlow } from '@/components/auth/QorIdAuthFlow';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(true);
  
  // Check if we should start at signup step
  const stepParam = searchParams.get('step');
  const initialStep = stepParam === 'register' ? 'register-username' : 'login';

  const handleSuccess = () => {
    // Redirect to portal after successful login
    router.push('/portal');
  };

  const handleClose = () => {
    // If user closes, redirect to home
    router.push('/');
  };

  return (
    <QorIdAuthFlow
      isOpen={isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      variant="page"
      initialStep={initialStep}
    />
  );
}
