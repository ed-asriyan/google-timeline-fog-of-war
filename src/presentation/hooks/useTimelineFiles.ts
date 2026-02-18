// Presentation Layer: Custom hooks for timeline files

import { useState, useCallback, useEffect } from 'react';
import { TimelineFileService } from '../../application/timeline-file-service';
import { analytics } from '../../infrastructure/analytics';

export function useTimelineFiles(service: TimelineFileService) {
  const [dataVersion, setDataVersion] = useState(0);
  const [hasData, setHasData] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check on mount whether IndexedDB already has data
  useEffect(() => {
    service.hasData().then(setHasData).catch(() => setHasData(false));
  }, [service]);

  // Upload files one at a time
  const uploadFiles = useCallback(async (fileList: File[]) => {
    setIsProcessing(true);
    try {
      for (const file of fileList) {
        await service.uploadFile(file);
      }
      setDataVersion(v => v + 1);
      setHasData(true);
      analytics.track('Files Processed', { fileCount: fileList.length });
    } catch (error) {
      console.error('Failed to upload files:', error);
      analytics.track('File Processing Failed', { fileCount: fileList.length });
    } finally {
      setIsProcessing(false);
    }
  }, [service]);

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
    isProcessing,
    uploadFiles,
    clearAll,
  };
}
