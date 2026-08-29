'use client';

import { API_BASE_URL } from '@/config/api';
import { sendResidentialEvent, measureResidentialLoad, type ResidentialEvent } from './analytics';

export function trackResidential(event: ResidentialEvent, data: Record<string, unknown>) {
  void sendResidentialEvent(API_BASE_URL, event, data);
}

export function measureResidential<T>(data: Record<string, unknown>, operation: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  return measureResidentialLoad(data, operation, trackResidential, signal);
}
