// Presentation Layer: File List Component


import { FileJson, Trash2 } from 'lucide-react';
import { TimelineFile } from '../../domains/map';
import { analytics } from '../../infrastructure/analytics';

interface FileListProps {
  files: TimelineFile[];
  loadingState: 'idle' | 'loading' | 'ready' | 'error';
  onRemove: (file: TimelineFile) => void;
}

export function FileList({ files, loadingState, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">
        <FileJson className="w-8 h-8 mx-auto mb-2 opacity-20" />
        {loadingState === 'loading' ? 'Checking storage...' : 'No files loaded yet'}
      </div>
    );
  }

  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="divide-y divide-gray-100">
      {sortedFiles.map((file) => {
        const stats = file.data.getStatistics();
        return (
          <div
            key={file.id}
            className="p-3 flex items-start justify-between group hover:bg-white transition-colors"
          >
            <div className="min-w-0 pr-2">
              <div className="text-sm font-medium text-gray-700 truncate" title={file.name}>
                {file.name}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {stats.totalPoints.toLocaleString()} pts
              </div>
            </div>
            <button
              onClick={() => {
                analytics.track('File Deleted', {
                  pointCount: stats.totalPoints,
                });
                onRemove(file);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
