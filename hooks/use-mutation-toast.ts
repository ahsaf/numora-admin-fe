'use client';

import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { notify } from '@/store/slices/ui-slice';

type ThunkResult = { meta: { requestStatus: 'fulfilled' | 'rejected' }; payload?: unknown };

/** Toasts the result of a mutation thunk: its server message on success, the error otherwise. */
export function useMutationToast() {
  const dispatch = useAppDispatch();
  return useCallback(
    (result: ThunkResult, fallbackSuccess: string) => {
      if (result.meta.requestStatus === 'fulfilled') {
        const message = (result.payload as { message?: string } | undefined)?.message;
        dispatch(notify('success', message || fallbackSuccess));
      } else {
        dispatch(notify('error', typeof result.payload === 'string' ? result.payload : 'Something went wrong'));
      }
    },
    [dispatch],
  );
}
