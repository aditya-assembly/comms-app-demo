import { FileText, Image, FileSpreadsheet, Music, Archive, Code, File, Play } from "lucide-react";

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const getMediaType = (filename: string): "pdf" | "image" | "video" | "spreadsheet" | "document" | "csv" | "audio" | "archive" | "code" | "unknown" => {
  const ext = getFileExtension(filename);

  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "avi", "mov", "wmv", "flv", "webm", "mkv", "m4v"].includes(ext)) return "video";
  if (["xlsx", "xls", "xlsm"].includes(ext)) return "spreadsheet";
  if (["csv"].includes(ext)) return "csv";
  if (["doc", "docx", "txt", "rtf", "md"].includes(ext)) return "document";
  if (["mp3", "wav", "flac", "aac", "ogg", "m4a"].includes(ext)) return "audio";
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(ext)) return "archive";
  if (["js", "ts", "jsx", "tsx", "html", "css", "json", "xml", "py", "java", "cpp", "c", "php", "rb", "go", "rs"].includes(ext)) return "code";

  return "unknown";
};

export const getFileIcon = (mediaType: string, fileName: string) => {
  const ext = getFileExtension(fileName);

  switch (mediaType) {
    case "pdf":
      return {
        icon: FileText,
        bg: "bg-red-500",
        text: "text-white",
        label: "PDF",
        accent: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
      };
    case "image":
      return {
        icon: Image,
        bg: "bg-green-500",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
      };
    case "video":
      return {
        icon: Play,
        bg: "bg-purple-500",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950",
      };
    case "spreadsheet":
      return {
        icon: FileSpreadsheet,
        bg: "bg-emerald-600",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
      };
    case "csv":
      return {
        icon: FileSpreadsheet,
        bg: "bg-yellow-600",
        text: "text-white",
        label: "CSV",
        accent: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950",
      };
    case "document":
      return {
        icon: FileText,
        bg: "bg-blue-600",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
      };
    case "audio":
      return {
        icon: Music,
        bg: "bg-pink-600",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-pink-200 bg-pink-50 dark:border-pink-800 dark:bg-pink-950",
      };
    case "archive":
      return {
        icon: Archive,
        bg: "bg-orange-600",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950",
      };
    case "code":
      return {
        icon: Code,
        bg: "bg-indigo-600",
        text: "text-white",
        label: ext.toUpperCase(),
        accent: "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950",
      };
    default:
      return {
        icon: File,
        bg: "bg-gray-500",
        text: "text-white",
        label: ext.toUpperCase() || "FILE",
        accent: "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950",
      };
  }
};

export const formatFileSize = (sizeMB: number): string => {
  // For very small files (less than 0.01 MB), show in KB or bytes
  if (sizeMB < 0.01) {
    const kb = sizeMB * 1024;
    if (kb < 1) {
      // Less than 1 KB, show in bytes
      const bytes = Math.round(sizeMB * 1024 * 1024);
      return `${bytes} B`;
    }
    // Show in KB with appropriate precision
    return `${kb.toFixed(1)} KB`;
  }
  
  // For files between 0.01 MB and 1 MB, show with 2 decimal places
  if (sizeMB < 1) {
    return `${sizeMB.toFixed(2)} MB`;
  }
  
  // For larger files, show with 1 decimal place
  return `${sizeMB.toFixed(1)} MB`;
};

export const formatFileSizeFromBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};