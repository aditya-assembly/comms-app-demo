import { Play, XCircle, AlertTriangle, CheckCircle2, CheckCircle, Type, Hash, ToggleLeft, List, Braces, FileText, Files, Power, Workflow, Activity, Clock, Cog, Calendar } from "lucide-react";
import {
  TRIGGER_TYPES,
  INPUT_DATA_TYPES,
  ATTRIBUTE_TYPES,
  GEOLOCATION_DISTANCE_OPTIONS,
  GEO_DISTANCE_PRESET_MATCH_EPSILON_METERS,
  MILES_TO_METRES,
  BROWSER_GEOLOCATION_LABEL,
  FILTER_OPERATORS,
} from "@/config/orchestration-constants";
import type { AttributeSpec, Entity, EntitySpec, LocationFilterValue } from "@/types/orchestration-dashboard-types";

// Type for data values that can be displayed in tables
export type DataValue = string | number | boolean | object | null | undefined;

/**
 * Console utility functions for trigger and input type handling
 */

// Trigger type helpers
export const getTriggerTypeIcon = (type: string) => {
  switch (type) {
    case TRIGGER_TYPES.PROCESS_START:
      return <Activity className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.PROCESS_FAILURE:
      return <XCircle className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.PROCESS_EXCEPTION:
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.PROCESS_COMPLETE:
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.STEP_START:
      return <Play className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.STEP_COMPLETE:
      return <CheckCircle className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.STEP_FAILURE:
      return <XCircle className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.STEP_EXCEPTION:
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.CRON:
      return <Clock className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.START_PROCESS:
      return <Power className="h-3.5 w-3.5" />;
    case TRIGGER_TYPES.CREATE_REVIEW:
      return <Cog className="h-3.5 w-3.5" />;
    default:
      return <Workflow className="h-3.5 w-3.5" />;
  }
};

export const getTriggerTypeColor = (type: string) => {
  switch (type) {
    case TRIGGER_TYPES.PROCESS_START:
      return "bg-success-bg text-success border-success/50";
    case TRIGGER_TYPES.PROCESS_FAILURE:
      return "bg-error-bg text-destructive border-destructive/50";
    case TRIGGER_TYPES.PROCESS_EXCEPTION:
      return "bg-error-bg text-destructive border-destructive/50";
    case TRIGGER_TYPES.PROCESS_COMPLETE:
      return "bg-success-bg text-success border-success/50";
    case TRIGGER_TYPES.STEP_START:
      return "bg-info-bg text-info border-info/50";
    case TRIGGER_TYPES.STEP_COMPLETE:
      return "bg-success-bg text-success border-success/50";
    case TRIGGER_TYPES.STEP_FAILURE:
      return "bg-error-bg text-destructive border-destructive/50";
    case TRIGGER_TYPES.STEP_EXCEPTION:
      return "bg-error-bg text-destructive border-destructive/50";
    case TRIGGER_TYPES.CRON:
      return "bg-primary-bg text-primary border-primary/50";
    case TRIGGER_TYPES.START_PROCESS:
      return "bg-success-bg text-success border-success/50";
    case TRIGGER_TYPES.CREATE_REVIEW:
      return "bg-info-bg text-info border-info/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export const getTriggerTypeTooltip = (type: string) => {
  switch (type) {
    case TRIGGER_TYPES.PROCESS_START:
      return "Process Start";
    case TRIGGER_TYPES.PROCESS_FAILURE:
      return "Process Failure";
    case TRIGGER_TYPES.PROCESS_EXCEPTION:
      return "Process Exception";
    case TRIGGER_TYPES.PROCESS_COMPLETE:
      return "Process Complete";
    case TRIGGER_TYPES.STEP_START:
      return "Step Start";
    case TRIGGER_TYPES.STEP_COMPLETE:
      return "Step Complete";
    case TRIGGER_TYPES.STEP_FAILURE:
      return "Step Failure";
    case TRIGGER_TYPES.STEP_EXCEPTION:
      return "Step Exception";
    case TRIGGER_TYPES.CRON:
      return "Scheduled Trigger";
    case TRIGGER_TYPES.START_PROCESS:
      return "Start Process";
    case TRIGGER_TYPES.CREATE_REVIEW:
      return "Create Review";
    default:
      return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

// Input type helpers
export const getInputTypeIcon = (type: string) => {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case INPUT_DATA_TYPES.STRING:
    case INPUT_DATA_TYPES.TEXT:
      return <Type className="h-3 w-3" />;
    case INPUT_DATA_TYPES.NUMBER:
    case INPUT_DATA_TYPES.INTEGER:
    case INPUT_DATA_TYPES.FLOAT:
      return <Hash className="h-3 w-3" />;
    case INPUT_DATA_TYPES.BOOLEAN:
      return <ToggleLeft className="h-3 w-3" />;
    case INPUT_DATA_TYPES.ARRAY:
    case INPUT_DATA_TYPES.LIST:
      return <List className="h-3 w-3" />;
    case INPUT_DATA_TYPES.OBJECT:
    case INPUT_DATA_TYPES.JSON:
      return <Braces className="h-3 w-3" />;
    case INPUT_DATA_TYPES.FILE:
    case INPUT_DATA_TYPES.FILE_OBJECT:
      return <FileText className="h-3 w-3" />;
    case INPUT_DATA_TYPES.MEDIA_JSON:
      return <Files className="h-3 w-3" />;
    case INPUT_DATA_TYPES.DATE:
      return <Calendar className="h-3 w-3" />;
    default:
      return <FileText className="h-3 w-3" />;
  }
};

export const getInputTypeTooltip = (type: string) => {
  const upperType = type.toUpperCase();
  switch (upperType) {
    case INPUT_DATA_TYPES.STRING:
      return "Text String";
    case INPUT_DATA_TYPES.TEXT:
      return "Text Input";
    case INPUT_DATA_TYPES.NUMBER:
      return "Number";
    case INPUT_DATA_TYPES.BOOLEAN:
      return "Boolean (True/False)";
    case INPUT_DATA_TYPES.ARRAY:
      return "Item List";
    case INPUT_DATA_TYPES.OBJECT:
      return "Object";
    case INPUT_DATA_TYPES.JSON:
      return "JSON Object";
    case INPUT_DATA_TYPES.FILE:
      return "File";
    case INPUT_DATA_TYPES.FILE_OBJECT:
      return "File Object";
    case INPUT_DATA_TYPES.MEDIA_JSON:
      return "Media Files";
    case INPUT_DATA_TYPES.DATE:
      return "Date";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// Legacy utility functions (keep for backward compatibility)
export const getDisplayTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    [INPUT_DATA_TYPES.STRING]: "Text",
    [INPUT_DATA_TYPES.TEXT]: "Text",
    [INPUT_DATA_TYPES.NUMBER]: "Number",
    [INPUT_DATA_TYPES.BOOLEAN]: "Flag",
    [INPUT_DATA_TYPES.ARRAY]: "Item List",
    [INPUT_DATA_TYPES.FILE_OBJECT]: "File",
    [INPUT_DATA_TYPES.FILE]: "File",
    [INPUT_DATA_TYPES.MEDIA_JSON]: "Files",
    [INPUT_DATA_TYPES.OBJECT]: "JSON",
    [INPUT_DATA_TYPES.JSON]: "JSON",
    [INPUT_DATA_TYPES.DATE]: "Date",
  };
  return typeMap[type.toUpperCase()] || type;
};

export const formatFieldName = (name: string): string => {
  // Handle all-caps words by not adding spaces between consecutive capitals
  if (name === name.toUpperCase()) {
    // If entire string is uppercase, just make first letter uppercase and rest lowercase
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .trim();
};

/**
 * Returns the display name for an attribute spec.
 * Uses displayName if available, otherwise falls back to formatFieldName.
 */
export const getAttributeDisplayName = (spec: AttributeSpec): string => {
  return spec.displayName || formatFieldName(spec.name);
};

/**
 * Console message utilities
 */
export const generateMessageId = (): string => {
  return crypto.randomUUID();
};

export const formatTimestamp = (date?: Date): string => {
  return (date || new Date()).toISOString();
};

/**
 * Console UI utilities
 */
export const getActionCountText = (count: number): string => {
  return `${count} action${count !== 1 ? "s" : ""}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Console validation utilities
 */
export const isValidWorkflowSelection = (workflowId: string, assemblyId: string): boolean => {
  return Boolean(workflowId && assemblyId);
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

/**
 * Format attribute value based on AttributeSpec type
 * @param value - The raw value to format
 * @param spec - The AttributeSpec containing the type information
 * @returns Formatted string representation of the value
 */

//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatAttributeValue(value: any, spec: Pick<AttributeSpec, "type"> | undefined): string {
  if (value === null || value === undefined) return "N/A";

  // When no spec, infer formatting from value type
  if (!spec) {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  }

  switch (spec.type) {
    case ATTRIBUTE_TYPES.DATE:
      return new Date(value as number).toLocaleDateString();
    case ATTRIBUTE_TYPES.BOOLEAN:
      return value ? "Yes" : "No";
    case ATTRIBUTE_TYPES.NUMBER_INTEGER:
    case ATTRIBUTE_TYPES.NUMBER_DOUBLE:
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case ATTRIBUTE_TYPES.JSON:
      return typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    case ATTRIBUTE_TYPES.STRING_ARRAY:
      return Array.isArray(value) ? value.join(", ") : String(value);
    default:
      return String(value);
  }
}

/**
 * Format attribute value with automatic spec lookup from entity spec
 * @param value - The raw value to format
 * @param attributeName - The name of the attribute to look up
 * @param entitySpec - The entity spec to look up the attribute from
 * @returns Formatted string representation of the value
 */

export function formatEntityAttributeValue(
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  attributeName: string,
  entitySpec: EntitySpec | undefined
): string {
  if (value === null || value === undefined) return "N/A";
  const spec = entitySpec?.attributes?.find((a) => a.name === attributeName);
  return formatAttributeValue(value, spec);
}

/**
 * Get formatted secondary text from displayAttributes for an entity
 * @param entity - The entity to get secondary text for
 * @param displayAttributes - Array of attribute names to display
 * @param entitySpec - The entity spec for formatting
 * @param maxAttributes - Maximum number of attributes to show (default: 3)
 * @returns Formatted string with attribute values joined by " • ", or null if no values
 */
export function getEntityDisplayAttributesText(
  entity: Entity,
  displayAttributes: string[] | undefined,
  entitySpec: EntitySpec | undefined,
  maxAttributes: number = 5
): string | null {
  if (!displayAttributes || displayAttributes.length === 0) {
    return null;
  }

  const parts = displayAttributes
    .slice(0, maxAttributes)
    .map((attrKey) => {
      const attr = entity.attributes?.[attrKey];
      if (!attr) return null;
      return formatEntityAttributeValue(attr.value, attrKey, entitySpec);
    })
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : null;
}

/**
 * Get the display name for an entity when it appears as a reference.
 * Priority: EntitySpec.displayAttributes → entity.name → entity.uniqueName → entity.id
 * @param entity - The entity to get the display name for
 * @param entitySpec - The referenced entity's spec (may contain displayAttributes)
 * @returns The formatted display name string
 */
export function getEntityDisplayAttributes(
  entity: Entity,
  entitySpec: EntitySpec | undefined,
): string {
  if (entitySpec?.displayAttributes?.length) {
    const text = getEntityDisplayAttributesText(entity, entitySpec.displayAttributes, entitySpec);
    if (text) return text;
  }
  return entity.name || entity.uniqueName || entity.id;
}

/**
 * Validate a value against an AttributeSpec's validationRegex
 * @param value - The value to validate (will be converted to string)
 * @param attrSpec - The AttributeSpec containing the validationRegex
 * @returns Error message if validation fails, null if valid or no regex specified
 */
export function validateAttributeRegex(
  value: unknown,
  attrSpec: Pick<AttributeSpec, "name" | "validationRegex" | "validationRegexDescription">
): string | null {
  // If no validation regex, skip validation
  if (!attrSpec.validationRegex) {
    return null;
  }

  // Skip validation for null/undefined/empty values (let required validation handle those)
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Handle arrays - validate each element
  if (Array.isArray(value)) {
    // Skip empty arrays
    if (value.length === 0) {
      return null;
    }

    // Validate each element in the array
    for (const element of value) {
      // Skip null/undefined/empty elements
      if (element === null || element === undefined || element === "") {
        continue;
      }

      const elementError = validateAttributeRegex(element, attrSpec);
      if (elementError) {
        return elementError;
      }
    }
    return null;
  }

  // Convert value to string for regex validation
  const stringValue = String(value);

  // ReDoS mitigation: limit input and pattern length to prevent catastrophic backtracking
  const MAX_INPUT_LENGTH = 1000;
  const MAX_PATTERN_LENGTH = 500;
  if (stringValue.length > MAX_INPUT_LENGTH || attrSpec.validationRegex.length > MAX_PATTERN_LENGTH) {
    return null;
  }

  // Ensure regex has anchors (^ and $)
  let pattern = attrSpec.validationRegex;
  if (!pattern.startsWith("^")) {
    pattern = "^" + pattern;
  }
  if (!pattern.endsWith("$")) {
    pattern = pattern + "$";
  }

  try {
    // Pattern is length-validated above to mitigate ReDoS risk
    const regex = new RegExp(pattern);
    const isValid = regex.test(stringValue);

    if (!isValid) {
      const baseMessage = `The value for '${attrSpec.name}' does not match the required format.`;
      if (attrSpec.validationRegexDescription) {
        return `${baseMessage} ${attrSpec.validationRegexDescription}`;
      }
      return baseMessage;
    }

    return null;
  } catch (error) {
    // If regex is invalid, log error but don't block validation
    console.error(`Invalid regex pattern for attribute "${attrSpec.name}":`, attrSpec.validationRegex, error);
    return null;
  }
}

/**
 * Validate number value against number range constraints
 * @param value - The value to validate
 * @param attrSpec - The AttributeSpec containing number range constraints
 * @returns Error message string if validation fails, null if valid
 */
export function validateNumberRange(
  value: unknown,
  attrSpec: Pick<AttributeSpec, "name" | "type" | "numberUpperRange" | "numberLowerRange">
): string | null {
  // Only validate NUMBER_INTEGER and NUMBER_DOUBLE types
  if (attrSpec.type !== "NUMBER_INTEGER" && attrSpec.type !== "NUMBER_DOUBLE") {
    return null;
  }

  // Helper to check if a value is null or undefined
  const isNullOrUndefined = (val: unknown): boolean => val === null || val === undefined;

  // Skip validation if no range constraints are set (both must be null/undefined)
  const hasLowerRange = !isNullOrUndefined(attrSpec.numberLowerRange) && !isNaN(Number(attrSpec.numberLowerRange));
  const hasUpperRange = !isNullOrUndefined(attrSpec.numberUpperRange) && !isNaN(Number(attrSpec.numberUpperRange));

  if (!hasLowerRange && !hasUpperRange) {
    return null; // No range constraints, skip validation
  }

  // Skip validation for null/undefined/empty values (let required validation handle those)
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // Convert value to number
  const numValue = typeof value === "number" ? value : Number(value);

  // Check if conversion was successful
  if (isNaN(numValue) || !isFinite(numValue)) {
    return null; // Let other validation handle non-numeric or infinite values
  }

  // Check lower bound (only if lower range is set and valid)
  if (hasLowerRange) {
    const lowerBound = Number(attrSpec.numberLowerRange);
    if (numValue < lowerBound) {
      let rangeText: string;
      if (hasUpperRange && lowerBound === Number(attrSpec.numberUpperRange)) {
        // Same value for both bounds - show "must be X"
        rangeText = `${lowerBound}`;
      } else if (hasUpperRange) {
        rangeText = `${lowerBound} to ${Number(attrSpec.numberUpperRange)}`;
      } else {
        rangeText = `at least ${lowerBound}`;
      }
      return `The value for "${attrSpec.name}" must be ${rangeText}.`;
    }
  }

  // Check upper bound (only if upper range is set and valid)
  if (hasUpperRange) {
    const upperBound = Number(attrSpec.numberUpperRange);
    if (numValue > upperBound) {
      let rangeText: string;
      if (hasLowerRange && Number(attrSpec.numberLowerRange) === upperBound) {
        // Same value for both bounds - show "must be X"
        rangeText = `${upperBound}`;
      } else if (hasLowerRange) {
        rangeText = `${Number(attrSpec.numberLowerRange)} to ${upperBound}`;
      } else {
        rangeText = `at most ${upperBound}`;
      }
      return `The value for "${attrSpec.name}" must be ${rangeText}.`;
    }
  }

  return null;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for suggesting similar values when user input doesn't match allowed values
 * @param a - First string
 * @param b - Second string
 * @returns The edit distance between the two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Create a matrix of distances
  const matrix: number[][] = [];

  // Initialize the first column
  for (let i = 0; i <= aLower.length; i++) {
    matrix[i] = [i];
  }

  // Initialize the first row
  for (let j = 0; j <= bLower.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLower.length][bLower.length];
}

/**
 * Find the closest match from a list of allowed values using Levenshtein distance
 * @param value - The input value to match
 * @param allowedValues - List of allowed values
 * @param maxDistance - Maximum distance to consider a match (default: 3)
 * @returns The closest matching value, or null if no close match found
 */
export function findClosestMatch(
  value: string,
  allowedValues: string[],
  maxDistance: number = 3
): string | null {
  if (!value || !allowedValues || allowedValues.length === 0) {
    return null;
  }

  let closestMatch: string | null = null;
  let minDistance = Infinity;

  for (const allowed of allowedValues) {
    const distance = levenshteinDistance(value, allowed);
    if (distance < minDistance && distance <= maxDistance) {
      minDistance = distance;
      closestMatch = allowed;
    }
  }

  return closestMatch;
}

/**
 * Validate a value against an AttributeSpec's allowedValues constraint
 * For STRING and STRING_ARRAY types, checks if value is in the allowed list
 * @param value - The value to validate
 * @param attrSpec - The AttributeSpec containing the allowedValues constraint
 * @returns Error message if validation fails, null if valid or no constraint
 */
export function validateAllowedValues(
  value: unknown,
  attrSpec: Pick<AttributeSpec, "name" | "type" | "allowedValues">
): string | null {
  // Only validate if allowedValues is defined and non-empty
  if (!attrSpec.allowedValues || attrSpec.allowedValues.length === 0) {
    return null;
  }

  // Only validate STRING and STRING_ARRAY types
  if (attrSpec.type !== ATTRIBUTE_TYPES.STRING && attrSpec.type !== ATTRIBUTE_TYPES.STRING_ARRAY) {
    return null;
  }

  // Skip validation for null/undefined/empty values (let required validation handle those)
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const allowedValues = attrSpec.allowedValues;
  const formattedAllowedList = allowedValues.map((v) => `'${v}'`).join(", ");

  // Handle arrays - validate each element
  if (Array.isArray(value)) {
    for (const element of value) {
      // Skip null/undefined/empty elements
      if (element === null || element === undefined || element === "") {
        continue;
      }

      const stringElement = String(element);
      if (!allowedValues.includes(stringElement)) {
        const suggestion = findClosestMatch(stringElement, allowedValues);
        if (suggestion) {
          return `The value '${stringElement}' for '${attrSpec.name}' is not allowed. Did you mean '${suggestion}'? Allowed values: ${formattedAllowedList}.`;
        }
        return `The value '${stringElement}' for '${attrSpec.name}' is not allowed. Allowed values: ${formattedAllowedList}.`;
      }
    }
    return null;
  }

  // Handle single string value
  const stringValue = String(value);
  if (!allowedValues.includes(stringValue)) {
    const suggestion = findClosestMatch(stringValue, allowedValues);
    if (suggestion) {
      return `The value '${stringValue}' for '${attrSpec.name}' is not allowed. Did you mean '${suggestion}'? Allowed values: ${formattedAllowedList}.`;
    }
    return `The value '${stringValue}' for '${attrSpec.name}' is not allowed. Allowed values: ${formattedAllowedList}.`;
  }

  return null;
}

/**
 * Parse a STRING_ARRAY value from CSV input
 * Supports multiple formats:
 * - Square brackets with single quotes: ['apple', 'banana, cherry'] → ["apple", "banana, cherry"]
 * - Double-quoted values: "apple, banana", cherry → ["apple, banana", "cherry"]
 * - Single-quoted values: 'apple, banana', cherry → ["apple, banana", "cherry"]
 * - Plain comma-separated: apple, banana, cherry → ["apple", "banana", "cherry"]
 *
 * @param value - The raw string value from CSV
 * @returns Array of parsed string values
 */
export function parseStringArrayValue(value: string): string[] {
  if (!value || value.trim() === "") {
    return [];
  }

  const trimmedValue = value.trim();

  // Handle square bracket format: ['a', 'b'] or [a, b]
  if (trimmedValue.startsWith("[") && trimmedValue.endsWith("]")) {
    const innerContent = trimmedValue.slice(1, -1).trim();
    if (innerContent === "") {
      return [];
    }
    return parseCommaSeparatedWithQuotes(innerContent);
  }

  // Handle comma-separated values (with potential quoted values)
  return parseCommaSeparatedWithQuotes(trimmedValue);
}

/**
 * Parse comma-separated values while respecting single and double quoted strings
 * Examples:
 * - "hello, world", goodbye → ["hello, world", "goodbye"]
 * - 'hello, world', goodbye → ["hello, world", "goodbye"]
 * - apple, banana → ["apple", "banana"]
 */
function parseCommaSeparatedWithQuotes(value: string): string[] {
  const result: string[] = [];
  let current = "";
  let inDoubleQuotes = false;
  let inSingleQuotes = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === '"' && !inSingleQuotes) {
      // Toggle double quote state (only if not inside single quotes)
      inDoubleQuotes = !inDoubleQuotes;
      // Don't include the quote character in the result
    } else if (char === "'" && !inDoubleQuotes) {
      // Toggle single quote state (only if not inside double quotes)
      inSingleQuotes = !inSingleQuotes;
      // Don't include the quote character in the result
    } else if (char === "," && !inDoubleQuotes && !inSingleQuotes) {
      // End of current value (only if not inside any quotes)
      const trimmed = current.trim();
      if (trimmed !== "") {
        result.push(trimmed);
      }
      current = "";
    } else {
      current += char;
    }
  }

  // Don't forget the last value
  const trimmed = current.trim();
  if (trimmed !== "") {
    result.push(trimmed);
  }

  return result;
}

/**
 * Format data value based on its type for user-friendly display in data tables
 * @param value - The raw value to format
 * @param type - The data type (STRING, DATE, NUMBER_INTEGER, etc.)
 * @returns Object with formatted value and display type
 */
export function formatDataValueForDisplay(
  value: DataValue,
  type?: string
): {
  formatted: DataValue | string[];
  displayType: "text" | "number" | "boolean" | "date" | "json" | "array" | "url" | "markdown";
} {
  // Handle null/undefined/empty string values - treat empty strings as null for display
  if (value === null || value === undefined || value === "") {
    return { formatted: null, displayType: "text" };
  }

  // Handle different data types using the defined enum constants
  switch (type) {
    case ATTRIBUTE_TYPES.DATE: {
      // Handle date values - they might come as timestamps (numbers or strings) or ISO strings
      let date: Date | null = null;

      if (typeof value === "number") {
        // Numeric timestamps should be treated as milliseconds
        date = new Date(value);
      } else if (typeof value === "string") {
        // Check if it's a numeric string (timestamp)
        const numericValue = Number(value);
        if (!isNaN(numericValue) && value.match(/^\d+$/)) {
          // It's a timestamp as a string
          date = new Date(numericValue);
        } else {
          // Handle ISO date strings or other date formats
          date = new Date(value);
        }
      }

      if (date && !isNaN(date.getTime())) {
        // Use a simple, user-friendly date format in user's local timezone
        return {
          formatted: date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          displayType: "date",
        };
      }
      // If date parsing fails, show as text
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.DATE_TIME: {
      // Handle date-time values - they might come as timestamps (numbers or strings) or ISO strings
      let date: Date | null = null;

      if (typeof value === "number") {
        // Numeric timestamps should be treated as milliseconds
        date = new Date(value);
      } else if (typeof value === "string") {
        // Check if it's a numeric string (timestamp)
        const numericValue = Number(value);
        if (!isNaN(numericValue) && value.match(/^\d+$/)) {
          // It's a timestamp as a string
          date = new Date(numericValue);
        } else {
          // Handle ISO date strings or other date formats
          date = new Date(value);
        }
      }

      if (date && !isNaN(date.getTime())) {
        // Use a simple, user-friendly date format with 12-hour time
        return {
          formatted: date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          displayType: "date",
        };
      }
      // If date parsing fails, show as text
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.NUMBER_INTEGER: {
      if (typeof value === "number") {
        return {
          formatted: value.toLocaleString(),
          displayType: "number",
        };
      }
      // Try to parse string as integer
      const parsed = parseInt(String(value), 10);
      if (!isNaN(parsed)) {
        return {
          formatted: parsed.toLocaleString(),
          displayType: "number",
        };
      }
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.NUMBER_DOUBLE: {
      if (typeof value === "number") {
        return {
          formatted: value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          }),
          displayType: "number",
        };
      }
      // Try to parse string as float
      const parsed = parseFloat(String(value));
      if (!isNaN(parsed)) {
        return {
          formatted: parsed.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
          }),
          displayType: "number",
        };
      }
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.BOOLEAN: {
      if (typeof value === "boolean") {
        return { formatted: value, displayType: "boolean" };
      }
      // Handle string boolean values
      const stringValue = String(value).toLowerCase();
      if (stringValue === "true" || stringValue === "false") {
        return { formatted: stringValue === "true", displayType: "boolean" };
      }
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.JSON: {
      if (typeof value === "object") {
        return { formatted: value, displayType: "json" };
      }
      // Try to parse string as JSON
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return { formatted: parsed, displayType: "json" };
        } catch {
          // If JSON parsing fails, treat as regular string
          return { formatted: value, displayType: "text" };
        }
      }
      return { formatted: value, displayType: "json" };
    }

    case ATTRIBUTE_TYPES.LOCATION: {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const loc = value as Record<string, unknown>;
        const line1 = [loc.street1].filter(Boolean);
        const line2 = [loc.street2].filter(Boolean);
        const line3 = [loc.postalCode, loc.city].filter(Boolean).join(", ");
        const line4 = [loc.state, loc.country].filter(Boolean).join(", ");
        const lines = [...line1, ...line2, line3, line4].filter(Boolean);
        return { formatted: lines.join(",\n"), displayType: "text" };
      }
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (parsed && typeof parsed === "object") {
            return formatDataValueForDisplay(parsed, type);
          }
        } catch {
          // not JSON, fall through
        }
      }
      return { formatted: String(value), displayType: "text" };
    }

    case ATTRIBUTE_TYPES.STRING_ARRAY: {
      if (Array.isArray(value)) {
        return { formatted: value, displayType: "array" };
      }
      // Try to parse string as array
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return { formatted: parsed, displayType: "array" };
          }
        } catch {
          // If parsing fails, split by common delimiters
          const arrayValue = value.includes(",") ? value.split(",").map((s) => s.trim()) : [value];
          return { formatted: arrayValue, displayType: "array" };
        }
      }
      return { formatted: [String(value)], displayType: "array" };
    }

    case ATTRIBUTE_TYPES.STRING:
    default: {
      const stringValue = String(value);
      // Check if the entire string is a URL using a simple pattern
      const isUrl = /^(https?:\/\/|www\.|ftp:\/\/)/i.test(stringValue) || /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}(\/.*)?$/.test(stringValue);

      if (isUrl) {
        return { formatted: stringValue, displayType: "url" };
      }
      // All STRING types should be rendered as markdown
      return { formatted: stringValue, displayType: "markdown" };
    }
  }
}

/**
 * Helper function to map file type strings to MIME types
 * Used for file upload validation in triggers
 */
export const getAcceptedMimeTypes = (fileTypes: string[]): string[] => {
  const mimeTypeMap: Record<string, string[]> = {
    CSV: ["text/csv", "application/csv"],
    PDF: ["application/pdf"],
    XLSX: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    DOCX: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    PPTX: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
    TXT: ["text/plain"],
    JSON: ["application/json"],
    XML: ["application/xml", "text/xml"],
    DOC: ["application/msword"],
    PPT: ["application/vnd.ms-powerpoint"],
    XLS: ["application/vnd.ms-excel"],
    ZIP: ["application/zip"],
    RAR: ["application/x-rar-compressed"],
    GZ: ["application/gzip"],
    BZ2: ["application/x-bzip2"],
    TAR: ["application/x-tar"],
    SEVENZ: ["application/x-7z-compressed"],
  };

  const mimeTypes: string[] = [];
  for (const fileType of fileTypes) {
    const types = mimeTypeMap[fileType.toUpperCase()];
    if (types) {
      mimeTypes.push(...types);
    }
  }

  return mimeTypes.length > 0 ? mimeTypes : ["*/*"]; // Allow all if no mapping found
};

// ============================================================================
// Date Filter Utilities
// ============================================================================

/**
 * Converts a date string (YYYY-MM-DD) to UTC epoch milliseconds.
 * The date string represents a LOCAL date (what the user selected),
 * and we convert it to a UTC timestamp for the backend.
 */
export const dateStringToUtcEpoch = (dateString: string): number => {
  const [year, month, day] = dateString.split("-").map(Number);
  // Create date at local midnight and get UTC timestamp
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
};

/**
 * Converts epoch milliseconds to date string (YYYY-MM-DD) for date input.
 * Uses local timezone so the date picker shows the date as user sees it.
 */
export const epochToDateString = (epoch: number): string => {
  const date = new Date(epoch);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats epoch milliseconds to human-readable date for display.
 * Uses local timezone so users see dates in their timezone.
 */
export const formatDateForDisplay = (epoch: number): string => {
  const date = new Date(epoch);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a Location filter value for human-readable display in filter chips.
 * For $near: "100 miles from New York City, New York, US"
 * For $eq/$ne: single-line address "street1, city, state, country"
 */
export function formatLocationFilterDisplay(
  value: unknown,
  operator: string
): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const loc = value as LocationFilterValue;

  if (operator === FILTER_OPERATORS.NEAR) {
    const dm = loc.distance;
    const snappedMi =
      dm != null && Number.isFinite(dm)
        ? (GEOLOCATION_DISTANCE_OPTIONS.find(
            (d) => Math.abs(d.value - dm) <= GEO_DISTANCE_PRESET_MATCH_EPSILON_METERS
          )?.miles ?? Math.round(dm / MILES_TO_METRES))
        : undefined;
    const miles = snappedMi != null && snappedMi > 0 ? `${snappedMi} miles` : "";
    const parts = [loc.city, loc.state, loc.country].filter(Boolean);
    const placeRaw = parts.join(", ");
    const place =
      loc.city === BROWSER_GEOLOCATION_LABEL ? "current location" : placeRaw;
    if (miles && place) return `${miles} from ${place}`;
    if (place) return `near ${place}`;
    if (miles && loc.geoJSON?.coordinates?.length === 2) return `${miles} from map point`;
    if (miles) return miles;
    return null;
  }

  const parts = [loc.street1, loc.street2, loc.postalCode, loc.city, loc.state, loc.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
