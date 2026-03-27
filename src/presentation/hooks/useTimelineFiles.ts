// Presentation Layer: Custom hooks for timeline files

import { useState, useCallback, useEffect, useRef } from 'react';
import { LoadingState, TimelineFileService } from '../../application/Map';
import { analytics } from '../../infrastructure/analytics';

export function useTimelineFiles(service: TimelineFileService) {
  const [dataVersion, setDataVersion] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>(() => service.getCurrentLoadingState());
  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const syncLoadingState = useCallback(() => {
    const nextState = service.getCurrentLoadingState();
    setLoadingState(nextState);
    if (nextState.status === 'idle') {
      stopPolling();
    }
    return nextState;
  }, [service, stopPolling]);

  const startPolling = useCallback(() => {
    syncLoadingState();
    if (pollRef.current !== null) {
      return;
    }
    pollRef.current = window.setInterval(() => {
      syncLoadingState();
    }, 1000);
  }, [syncLoadingState]);

  // Check on mount whether IndexedDB already has data
  useEffect(() => {
    service.hasData().then(setHasData).catch(() => setHasData(false));
  }, [service]);

  useEffect(() => stopPolling, [stopPolling]);

  // Upload files one at a time
  const uploadFiles = useCallback(async (fileList: File[]) => {
    startPolling();
    try {
      await service.addFiles(...fileList);
      syncLoadingState();
      setDataVersion(v => v + 1);
      setHasData(true);
      analytics.track('Files Processed', { fileCount: fileList.length });
    } catch (error) {
      console.error('Failed to upload files:', error);
      analytics.track('File Processing Failed', { fileCount: fileList.length });
    } finally {
      syncLoadingState();
    }
  }, [service, startPolling, syncLoadingState]);

  // Clear all imported data
  const clearAll = useCallback(async () => {
    try {
      await service.clearAll();
      setDataVersion(v => v + 1);
      setHasData(false);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }, [service]);

  return {
    dataVersion,
    hasData,
    isProcessing: loadingState.status !== 'idle',
    loadingState,
    uploadFiles,
    clearAll,
  };
}
