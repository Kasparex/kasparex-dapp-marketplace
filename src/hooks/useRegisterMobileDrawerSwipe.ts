'use client';

import { useEffect, useRef } from 'react';
import {
  registerMobileLeftDrawer,
  registerMobileRightDrawer,
} from '@/lib/mobileDrawerSwipeCoordinator';

export function useRegisterMobileLeftDrawerSwipe(options: {
  enabled: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  canOpen?: () => boolean;
}) {
  const isOpenRef = useRef(options.isOpen);
  const onOpenRef = useRef(options.onOpen);
  const onCloseRef = useRef(options.onClose);
  const canOpenRef = useRef(options.canOpen);

  isOpenRef.current = options.isOpen;
  onOpenRef.current = options.onOpen;
  onCloseRef.current = options.onClose;
  canOpenRef.current = options.canOpen;

  useEffect(() => {
    if (!options.enabled) {
      registerMobileLeftDrawer(null);
      return;
    }

    registerMobileLeftDrawer({
      isOpen: () => isOpenRef.current,
      open: () => onOpenRef.current(),
      close: () => onCloseRef.current(),
      enabled: () => canOpenRef.current?.() ?? true,
    });

    return () => registerMobileLeftDrawer(null);
  }, [options.enabled]);
}

export function useRegisterMobileRightDrawerSwipe(options: {
  enabled: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  canOpen?: () => boolean;
}) {
  const isOpenRef = useRef(options.isOpen);
  const onOpenRef = useRef(options.onOpen);
  const onCloseRef = useRef(options.onClose);
  const canOpenRef = useRef(options.canOpen);

  isOpenRef.current = options.isOpen;
  onOpenRef.current = options.onOpen;
  onCloseRef.current = options.onClose;
  canOpenRef.current = options.canOpen;

  useEffect(() => {
    if (!options.enabled) {
      registerMobileRightDrawer(null);
      return;
    }

    registerMobileRightDrawer({
      isOpen: () => isOpenRef.current,
      open: () => onOpenRef.current(),
      close: () => onCloseRef.current(),
      enabled: () => canOpenRef.current?.() ?? true,
    });

    return () => registerMobileRightDrawer(null);
  }, [options.enabled]);
}
