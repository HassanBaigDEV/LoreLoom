'use client';
import React, { Suspense } from 'react';
import ResetPasswordContent from '@/components/forgetPassword/page.jsx';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading reset form…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
