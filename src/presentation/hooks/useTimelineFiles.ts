// Presentation Layer: Custom hooks for timeline files

import { useState, useEffect, useCallback } from 'react';
import { TimelineFile } from '../../domain/entities';
import { TimelineFileService } from '../../application/timeline-file-service';
import { analytics } from '../../infrastructure/analytics';

type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

export function useTimelineFiles(service: TimelineFileService) {
  const [files, setFiles] = useState<TimelineFile[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      setLoadingState('loading');
      try {
        const storedFiles = await service.loadAll();
        setFiles(storedFiles);
        setLoadingState('ready');
      } catch (error) {
        console.error('Failed to load files:', error);
        setLoadingState('error');
      }
    };

    loadFiles();
  }, [service]);

  // Upload files
  const uploadFiles = useCallback(async (fileList: File[]) => {
    setIsProcessing(true);
    try {
      const newFiles = await service.uploadFiles(fileList);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Track successful file processing (aggregate stats only, no location data)
      analytics.track('Files Processed', {
        filesProcessed: newFiles.length,
        totalPoints: newFiles.reduce((sum, f) => sum + f.pointCount, 0),
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      analytics.track('File Processing Failed', {
        fileCount: fileList.length,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [service]);

  // Remove file
  const removeFile = useCallback(async (id: string) => {
    try {
      await service.remove(id);
      setFiles(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  }, [service]);

  return {
    files,
    loadingState,
    isProcessing,
    uploadFiles,
    removeFile,
  };
}
