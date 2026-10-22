import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts database error messages to user-friendly messages
 */
export function getErrorMessage(error: any): string {
  const errorMessage =
    error?.message || String(error) || "An unexpected error occurred";

  // Handle scheduled_at null constraint error
  if (
    errorMessage.includes("scheduled_at") &&
    errorMessage.includes("not-null constraint")
  ) {
    return "Please select a date and time for scheduling this post.";
  }

  // Handle other common database constraint errors
  if (errorMessage.includes("violates not-null constraint")) {
    const columnMatch = errorMessage.match(/column "(\w+)" of relation/);
    if (columnMatch) {
      const columnName = columnMatch[1];
      // Convert snake_case to readable format
      const readableName = columnName
        .split("_")
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return `Please provide a value for ${readableName}.`;
    }
    return "Please fill in all required fields.";
  }

  // Handle foreign key constraint errors
  if (errorMessage.includes("violates foreign key constraint")) {
    return "The selected item is invalid or no longer exists.";
  }

  // Handle unique constraint errors
  if (errorMessage.includes("violates unique constraint")) {
    return "This item already exists. Please use a different value.";
  }

  // Return the original message if no specific pattern matches
  return errorMessage;
}

/** Escape a value for CSV (commas, quotes, newlines). */
export function escapeCsvCell(value: string): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function formatCsvRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(",");
}
