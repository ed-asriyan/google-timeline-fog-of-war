// Presentation Layer: Custom hooks for timeline files

import { useState, useCallback, useEffect } from 'react';
import { MapApp, MapSegmentRepository } from '../../domains/map/ports';
import { analytics } from '../../infrastructure/analytics';

export type LoadingState = {
  status: 'idle' | 'reading' | 'parsing' | 'saving';
  progress?: number;
};

export function useTimelineFiles(mapApp: MapApp, mapSegmentRepo: MapSegmentRepository) {
  const [dataVersion, setDataVersion] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle' });

  // Check on mount whether IndexedDB already has data
  useEffect(() => {
    mapSegmentRepo.hasData().then(setHasData).catch(() => setHasData(false));
  }, [mapSegmentRepo]);

  // Upload files one at a time
  const uploadFiles = useCallback(async (fileList: File[]) => {
    setLoadingState({ status: 'reading', progress: 0 });
    try {
      let filesProcessed = 0;
      for (const file of fileList) {
        setLoadingState({ status: 'reading', progress: (filesProcessed / fileList.length) * 100 });
        const text = await file.text();
        
        setLoadingState({ status: 'parsing', progress: ((filesProcessed + 0.5) / fileList.length) * 100 });
        await mapApp.loadPoints(text);

        filesProcessed++;
      }
      
      setDataVersion(v => v + 1);
      setHasData(true);
      analytics.track('Files Processed', { fileCount: fileList.length });
    } catch (error) {
      console.error('Failed to upload files:', error);
      analytics.track('File Processing Failed', { fileCount: fileList.length });
    } finally {
      setLoadingState({ status: 'idle' });
    }
  }, [mapApp]);

  // Clear all imported data
  const clearAll = useCallback(async () => {
    try {
      await mapApp.clear();
      setDataVersion(v => v + 1);
      setHasData(false);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }, [mapApp]);

  return {
    dataVersion,
    hasData,
    isProcessing: loadingState.status !== 'idle',
    loadingState,
    uploadFiles,
    clearAll,
  };
}
