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
