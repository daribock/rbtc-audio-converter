export interface FileInfo {
  path: string;
  name: string;
  size?: number;
}

export interface ConversionProgress {
  currentFile: number;
  totalFiles: number;
  fileName: string;
  status: "converting" | "adding-metadata";
  fileProgress: number;
}

export interface ConversionResult {
  success: boolean;
  inputFile: string;
  outputFile?: string;
  error?: string;
}

export interface ConversionComplete {
  results: ConversionResult[];
  outputFolder: string;
}

export interface AppState {
  files: FileInfo[];
  subject: string;
  city: string;
  teacher: string;
  outputFolder: string;
  coverArt: FileInfo | null;
  isConverting: boolean;
  progress: ConversionProgress | null;
  results: ConversionResult[];
  error: string | null;
}
