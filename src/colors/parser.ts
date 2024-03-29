import { DEFAULT_COLOR, HSL_FORMAT, RGB_FORMAT, ROOT } from '../constants';
import type { Color, HSLA, RGBA, colorFormat } from '../types';
import { isNumber, isString } from '../utils/is';
import { PI, boundNumber, int, normalizeAngle, round } from '../utils/math';
import { stringify } from './stringify';

/**
 * Regex.
 */
const HSL_REGEX =
    /^hsla?\(\s*([+-]?\d*\.?\d+)(\w*)?\s*[\s,]\s*([+-]?\d*\.?\d+)%?\s*,?\s*([+-]?\d*\.?\d+)%?(?:\s*[/,]\s*([+-]?\d*\.?\d+)(%)?)?\s*\)?$/;
const HEX_REGEX = /^#[0-9a-f]{6}$/i;

const ctx = ROOT.createElement('canvas').getContext(
    '2d',
) as CanvasRenderingContext2D;
/**
 * Used to convert non degrees angles to degrees.
 */
const ANGLE_COEFFICIENT_MAP: { [angle: string]: number } = {
    deg: 1,
    turn: 360,
    rad: 180 / PI,
    grad: 0.9,
};

/**
 * Parses strings and validate color objects.
 * Invalid color values default to DEFAULT_COLOR.
 *
 * @param color - Color value.
 * @param asString - Output the result as a string.
 */
export const parseColor = (
    color: Color,
    asString = false,
): string | [color: HSLA | RGBA, format: colorFormat] => {
    let parsedColor: HSLA | RGBA;
    let format: colorFormat | undefined;
    let str = '';

    /**
     * Validate Non string values, convert color objects into strings.
     * Invalid values default to empty string.
     */
    if (!isString(color)) {
        color = color || {};
        format = [RGB_FORMAT, HSL_FORMAT].find((format) => {
            return format
                .split('')
                .every((key) => isNumber(color[key as keyof Color]));
        });

        if (format) {
            str = stringify(color as RGBA | HSLA, format);
        }
    } else {
        str = color.trim();
    }

    const [isHSL, h, angle, s, l, a = '1', percentage] =
        HSL_REGEX.exec(str) || [];
    if (isHSL) {
        /**
         * Normalize values.
         *
         * The hue value is so often given in degrees, it can be given as a number, however
         * it might has a unit 'turn', 'rad' (radians) or 'grad' (gradients),
         * If the hue has a unit other than deg, then convert it to degrees.
         */
        parsedColor = {
            h: normalizeAngle(
                +h *
                    (ANGLE_COEFFICIENT_MAP[angle]
                        ? ANGLE_COEFFICIENT_MAP[angle]
                        : 1),
            ),
            s: boundNumber(+s),
            l: boundNumber(+l),
            a: boundNumber(+a / (percentage ? 100 : 1), 1),
        };
        format = HSL_FORMAT;
    } else {
        format = RGB_FORMAT;

        ctx.fillStyle = DEFAULT_COLOR;
        ctx.fillStyle = str;
        str = ctx.fillStyle;

        // ColorString is either hex or rgb string,
        // if it's hex convert it to rgb object,
        // if it's rgb then parse it to object.
        if (HEX_REGEX.test(str)) {
            // Convert hex string to rgb object.
            parsedColor = {
                r: int(str.slice(1, 3), 16),
                g: int(str.slice(3, 5), 16),
                b: int(str.slice(5, 7), 16),
                a: 1,
            };
        } else {
            // Parse rgb string into a rgb object.
            const [r, g, b, a] = (/\((.+)\)/.exec(str) as RegExpExecArray)[1]
                .split(',')
                .map((value) => +value);
            parsedColor = { r, g, b, a };
        }
    }

    // Round the transparency component to two numbers behind
    parsedColor.a = round(parsedColor.a * 100) / 100;

    return asString ? stringify(parsedColor, format) : [parsedColor, format];
};
