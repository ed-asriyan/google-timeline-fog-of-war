// Application Layer: File management use case

import { TimelineFile, TimelineData } from '../domain/entities';
import { TimelineFileRepository } from '../infrastructure/repositories/timeline-file-repository';
import { TimelineParserFactory } from '../infrastructure/parsers/timeline-parser';

/**
 * Use case for managing timeline files
 */
export class TimelineFileService {
  constructor(private repository: TimelineFileRepository) {}

  /**
   * Upload and process timeline files
   */
  async uploadFiles(files: File[]): Promise<TimelineFile[]> {
    const processedFiles: TimelineFile[] = [];

    for (const file of files) {
      try {
        const timelineFile = await this.processFile(file);
        if (!timelineFile.data.isEmpty()) {
          await this.repository.save(timelineFile);
          processedFiles.push(timelineFile);
        }
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
      }
    }

    return processedFiles;
  }

  /**
   * Load all timeline files
   */
  async loadAll(): Promise<TimelineFile[]> {
    return this.repository.getAll();
  }

  /**
   * Remove a timeline file
   */
  async remove(id: string): Promise<void> {
    return this.repository.remove(id);
  }

  /**
   * Get aggregated timeline data from all files
   */
  async getAggregatedData(files: TimelineFile[]): Promise<TimelineData> {
    if (files.length === 0) {
      return new TimelineData([], []);
    }

    return files.reduce((acc, file) => acc.merge(file.data), new TimelineData([], []));
  }

  /**
   * Process a single file
   */
  private async processFile(file: File): Promise<TimelineFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const data = TimelineParserFactory.parse(json);
          const timelineFile = new TimelineFile(
            crypto.randomUUID(),
            file.name,
            data
          );
          resolve(timelineFile);
        } catch (error) {
          reject(new Error(`Failed to parse ${file.name}: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  }
}
