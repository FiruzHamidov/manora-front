'use client';

import { useRef } from 'react';
import { createLeadSubmission } from './client';
import { postLeadRequest } from './api';

export function useLeadSubmission() {
  const submission = useRef<ReturnType<typeof createLeadSubmission> | null>(null);
  if (submission.current === null) submission.current = createLeadSubmission(postLeadRequest);
  return submission.current;
}
