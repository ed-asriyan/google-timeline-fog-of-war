// Presentation Layer: Custom hooks for timeline files

import { useState, useEffect, useCallback, useRef } from 'react';
import { TimelineFile } from '../../domains/map';
import { TimelineFileService } from '../../application/timeline-file-service';
import { analytics } from '../../infrastructure/analytics';

type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

export function useTimelineFiles(service: TimelineFileService) {
  const [files, setFiles] = useState<TimelineFile[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const initializedRef = useRef(false);

  // Load files on mount
  useEffect(() => {
    const loadFiles = async () => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      setLoadingState('loading');
      try {
        await service.initialize();
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
      await service.uploadFiles(fileList);
      // Reload ALL files from service after upload to ensure consistency
      const allFiles = await service.loadAll();
      setFiles(allFiles);
      
      // Track successful file processing (aggregate stats only, no location data)
      const totalPoints = allFiles.reduce((sum, f) => sum + f.data.getStatistics().totalPoints, 0);
      analytics.track('Files Processed', {
        filesProcessed: allFiles.length,
        totalPoints,
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
  const removeFile = useCallback(async (file: TimelineFile) => {
    try {
      await service.remove(file);
      setFiles(prev => prev.filter(f => f.id !== file.id));
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
