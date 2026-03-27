// Presentation Layer: File Upload Component

import React, { useRef, useState, useEffect } from 'react';
import { Plus, Database, ExternalLink } from 'lucide-react';
import { LoadingState } from '../../application/Map';
import { analytics } from '../../infrastructure/analytics';

const PROCESSING_MESSAGES = [
  'Processing files…',
  'Parsing locations…',
  'Mapping your journey…',
  'Storing data…',
  'Almost there…',
];

interface FileUploadProps {
  loadingState: LoadingState;
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({ loadingState, onFilesSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState('');
  const isProcessing = loadingState.status !== 'idle';

  useEffect(() => {
    if (!isProcessing) {
      setCurrentTime('');
      return;
    }
    const tick = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      analytics.track('Files Selected', {
        fileCount: files.length,
      });
      onFilesSelected(files);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const processingLabel = loadingState.status === 'parsing'
    ? `Parsing locations... ${loadingState.progress}%`
    : 'Loading files...';

  return (
    <div>
      <div className="relative mb-3">
        <input
          ref={inputRef}
          type="file"
          id="file-upload"
          multiple
          accept=".json"
          onChange={handleChange}
          disabled={isProcessing}
          className="hidden"
        />
        <label
          htmlFor={isProcessing ? undefined : 'file-upload'}
          className={`flex flex-col items-center justify-center w-full h-10 px-4 rounded-lg transition-all shadow-sm border border-transparent font-medium text-sm ${
            isProcessing
              ? 'bg-blue-500 text-white cursor-wait opacity-80'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300 cursor-pointer'
          }`}
        >
          {isProcessing ? (
            <>
              <span className="flex items-center gap-2 leading-none">
                <svg
                  className="animate-spin w-4 h-4 flex-shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-30"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {processingLabel}
              </span>
              <span className="text-[10px] font-normal opacity-75 leading-none mt-0.5">
                As of {currentTime}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Google Timeline files
            </span>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-1 mt-1 items-center text-[10px] text-gray-400">
        <p className="flex items-center gap-1 text-center leading-tight max-w-[90%] mx-auto opacity-75">
          <Database className="w-3 h-3 flex-shrink-0" />
          <span>Your data is <b>never</b> uploaded to any server</span>
        </p>
        <div>
          <span>Export Google Timeline files:</span>
          &nbsp;
          <a
            href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DAndroid&oco=1#androidimport"
            target="_blank"
            rel="noreferrer"
            className="items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-3 h-3 inline" />
            &nbsp;
            <u>Android</u>
          </a>
          &nbsp;
          <span>and</span>
          &nbsp;
          <a
            href="https://support.google.com/maps/answer/6258979?co=GENIE.Platform%3DiOS&oco=1#iosimport"
            target="_blank"
            rel="noreferrer"
            className="items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <ExternalLink className="w-3 h-3 inline" />
            &nbsp;
            <u>iOS</u>
          </a>
        </div>
      </div>
    </div>
  );
}
