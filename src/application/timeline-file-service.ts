// Application Layer: File management use case

import { Map, TimelineFile } from '../domains/map';
import { TimelineFileRepository } from '../infrastructure/repositories/timeline-file-repository';
import { TimelineParserFactory } from '../infrastructure/parsers/timeline-parser';

/**
 * Use case for managing timeline files and map
 */
export class TimelineFileService {
  private map: Map;

  constructor(private repository: TimelineFileRepository) {
    this.map = Map.createEmpty();
  }

  /**
   * Initialize service by loading map from storage
   */
  async initialize(): Promise<Map> {
    let a = new Date();
    this.map = await this.repository.loadMap();
    console.log('Init', new Date().getTime() - a.getTime());
    return this.map;
  }

  /**
   * Get current map
   */
  getMap(): Map {
    return this.map;
  }

  /**
   * Upload and process timeline files
   */
  async uploadFiles(files: File[]): Promise<TimelineFile[]> {
    const processedFiles: TimelineFile[] = [];

    for (const file of files) {
      try {
        const timelineFile = await this.processFile(file);
        const stats = timelineFile.data.getStatistics();
        if (stats.totalPoints > 0 || stats.totalPaths > 0) {
          this.map.addFile(timelineFile);
          processedFiles.push(timelineFile);
        }
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
      }
    }

    if (processedFiles.length > 0) {
      await this.repository.saveMap(this.map);
    }

    return processedFiles;
  }

  /**
   * Load all timeline files
   */
  async loadAll(): Promise<TimelineFile[]> {
    return this.map.getAllFiles();
  }

  /**
   * Remove a timeline file
   */
  async remove(file: TimelineFile): Promise<void> {
    this.map.removeFile(file);
    await this.repository.saveMap(this.map);
  }

  /**
   * Clear all files
   */
  async clearAll(): Promise<void> {
    this.map = Map.createEmpty();
    await this.repository.saveMap(this.map);
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
          const timelineFile = new TimelineFile(file.name, data);
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
