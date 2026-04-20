// Constants for media types and file extensions
export const MEDIA_TYPES = {
  PDF: 'pdf',
  IMAGE: 'image',
  VIDEO: 'video',
  SPREADSHEET: 'spreadsheet',
  CSV: 'csv',
  DOCUMENT: 'document',
  UNKNOWN: 'unknown'
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

// File extension mappings
export const FILE_EXTENSIONS = {
  PDF: ['pdf'],
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
  VIDEO: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
  SPREADSHEET: ['xlsx', 'xls'],
  CSV: ['csv'],
  DOCUMENT: ['doc', 'docx', 'txt', 'rtf']
} as const;

// UI Constants
export const FULLSCREEN_HEADER_HEIGHT = 56; // px
export const FULLSCREEN_HEADER_PADDING = 14; // Tailwind pt-14 = 56px
export const MAX_SPREADSHEET_ROWS_DISPLAY = 1000;

// Error types for better error handling
export type MediaErrorType = 'cors' | 'network' | 'parse' | 'not_found' | 'generic';

export interface MediaError {
  type: MediaErrorType;
  message: string;
  userMessage: string;
  technicalDetails?: string;
}

// Utility functions
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getMediaType = (filename: string): MediaType => {
  const ext = getFileExtension(filename);

  if ((FILE_EXTENSIONS.PDF as readonly string[]).includes(ext)) return MEDIA_TYPES.PDF;
  if ((FILE_EXTENSIONS.IMAGE as readonly string[]).includes(ext)) return MEDIA_TYPES.IMAGE;
  if ((FILE_EXTENSIONS.VIDEO as readonly string[]).includes(ext)) return MEDIA_TYPES.VIDEO;
  if ((FILE_EXTENSIONS.SPREADSHEET as readonly string[]).includes(ext)) return MEDIA_TYPES.SPREADSHEET;
  if ((FILE_EXTENSIONS.CSV as readonly string[]).includes(ext)) return MEDIA_TYPES.CSV;
  if ((FILE_EXTENSIONS.DOCUMENT as readonly string[]).includes(ext)) return MEDIA_TYPES.DOCUMENT;

  return MEDIA_TYPES.UNKNOWN;
};

export const getMediaTypeLabel = (mediaType: MediaType): string => {
  const labels: Record<MediaType, string> = {
    [MEDIA_TYPES.PDF]: 'PDF',
    [MEDIA_TYPES.IMAGE]: 'Image',
    [MEDIA_TYPES.VIDEO]: 'Video',
    [MEDIA_TYPES.SPREADSHEET]: 'Spreadsheet',
    [MEDIA_TYPES.CSV]: 'CSV',
    [MEDIA_TYPES.DOCUMENT]: 'Document',
    [MEDIA_TYPES.UNKNOWN]: 'File'
  };
  return labels[mediaType];
};

// Helper function to convert number to Excel column name (0->A, 1->B, ..., 25->Z, 26->AA, etc.)
export const numberToColumnName = (num: number): string => {
  let result = '';
  let n = num;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
};

// CORS error detection helper
export const isCORSRelatedError = (error: Error): boolean => {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  const corsPatterns = [
    'cors',
    'cross-origin',
    'failed to fetch',
    'network error',
    'access to fetch',
    'blocked by cors policy',
    'cross origin requests are only supported for protocol schemes',
    'request blocked by cors',
    "no 'access-control-allow-origin' header",
    'access-control-allow-origin',
    'preflight',
    'opaque response',
  ];

  const hasCORSPattern = corsPatterns.some((pattern) => errorMessage.includes(pattern));

  const isTypeErrorWithFetch = errorName === 'typeerror' && (errorMessage.includes('fetch') || errorMessage.includes('network'));

  const isBrowserCORSError =
    errorName === 'typeerror' &&
    (errorMessage === 'failed to fetch' ||
     errorMessage === 'network error' ||
     errorMessage === 'load failed' ||
     errorMessage.includes('cors'));

  return hasCORSPattern || isTypeErrorWithFetch || isBrowserCORSError;
};

// Enhanced helper function to detect and categorize errors
export const categorizeError = (error: Error): MediaError => {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  if (isCORSRelatedError(error)) {
    return {
      type: 'cors',
      message: error.message,
      userMessage: 'Unable to preview this file. You can download the file to view its contents.',
      technicalDetails: error.message,
    };
  }

  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('unreachable') ||
    errorName === 'networkerror'
  ) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Network error occurred while loading the file. Please check your connection and try again.',
      technicalDetails: error.message,
    };
  }

  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('404') ||
    errorMessage.includes('resource not found') ||
    errorMessage.includes('file not found')
  ) {
    return {
      type: 'not_found',
      message: error.message,
      userMessage: 'Media file not found or no longer available.',
      technicalDetails: error.message,
    };
  }

  if (
    errorMessage.includes('parse') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('corrupt') ||
    errorMessage.includes('malformed') ||
    errorMessage.includes('syntax error')
  ) {
    return {
      type: 'parse',
      message: error.message,
      userMessage: 'Failed to parse the file. The file may be corrupted or in an unsupported format.',
      technicalDetails: error.message,
    };
  }

  return {
    type: 'generic',
    message: error.message,
    userMessage: 'An unexpected error occurred while loading the file. Please try again.',
    technicalDetails: error.message,
  };
};
