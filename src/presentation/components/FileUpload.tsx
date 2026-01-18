// Presentation Layer: File Upload Component

import React, { useRef } from 'react';
import { Plus, Database, ExternalLink } from 'lucide-react';
import { analytics } from '../../infrastructure/analytics';

interface FileUploadProps {
  isProcessing: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({ isProcessing, onFilesSelected }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="p-3 border-t border-gray-100 bg-white">
      <div className="relative mb-2">
        <input
          ref={inputRef}
          type="file"
          id="file-upload"
          multiple
          accept=".json"
          onChange={handleChange}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className={`flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg cursor-pointer transition-all shadow-sm border border-transparent font-medium text-sm ${
            isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-blue-300'
          }`}
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Google Timeline files
            </>
          )}
        </label>
      </div>

      <div className="flex flex-col gap-2 items-center text-[10px] text-gray-400">
        <p className="flex items-center gap-1 text-center leading-tight max-w-[90%] mx-auto opacity-75">
          <Database className="w-3 h-3 flex-shrink-0" />
          <span>Your location data is <b>never</b> uploaded to any server</span>
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
