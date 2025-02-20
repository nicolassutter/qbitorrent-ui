import bytes from "bytes";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rounds a number to a specified number of decimal places.
 */
export function toDecimals(value: number, decimals: number) {
  return Number(value.toFixed(decimals));
}

export const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const formatSize = (b: number) => {
  return bytes(b, {
    unitSeparator: " ",
  });
};

export const formatSpeed = (bytesPerSecond: number) => {
  return `${formatSize(bytesPerSecond)}/s`;
};

export const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
