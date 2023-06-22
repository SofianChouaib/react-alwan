/**
 * Checks if a value is a string.
 *
 * @param value - Any value.
 * @returns
 */
export const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Checks if a value is not undefined and null.
 *
 * @param value - Value.
 */
export const isset = (value: unknown): value is NonNullable<unknown> => value != null;
