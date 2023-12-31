import { useCallback, useEffect, useRef, useState } from 'react';
import '../assets/alwan.scss';
import Container from './Container';
import Inputs from './Inputs';
import Palette from './Palette';
import Sliders from './Sliders';
import Swatches from './Swatches';
import Utility from './Utility';
import type {
    HSLA,
    Popover,
    RGBA,
    alwanEvent,
    alwanEventType,
    alwanProps,
    colorFormat,
    colorState,
    colorUpdater,
    colorUpdaterFromValue,
    internalHSL,
    popoverAutoUpdate,
} from '../types';
import { ALL_FORMATS, DEFAULT_COLOR, HSL_FORMAT, RGB_FORMAT, ROOT } from '../constants';
import { createPopover } from '../lib/popover';
import { createPortal } from 'react-dom';
import { round } from '../utils/math';
import { HSLToRGB, RGBToHEX, RGBToHSL } from '../colors/converter';
import { stringify } from '../colors/stringify';
import { parseColor } from '../colors/parser';
import Button from './Button';

const Alwan = ({
    id,
    className,
    theme = 'light',
    toggle = true,
    value = DEFAULT_COLOR,
    popover = true,
    position = 'bottom-start',
    margin = 0,
    preview = true,
    copy = true,
    opacity = true,
    inputs = true,
    disabled = false,
    format = 'rgb',
    singleInput = false,
    swatches = [],
    toggleSwatches = false,
    closeOnScroll = false,
    onChange,
    onOpen,
    onClose,
}: alwanProps) => {
    const popoverInstance = useRef<Popover | null>(null);
    const popoverReference = useRef<HTMLButtonElement>(null);
    const popoverContainer = useRef<HTMLDivElement>(null);

    const updatePalette = useRef(false);

    const [formats, setFormats] = useState<colorFormat[]>([]);
    const [currentFormat, setCurrentFormat] = useState<colorFormat>(format);
    const [isOpen, setOpen] = useState(false);
    const [color, setColor] = useState<colorState>({
        h: 0,
        s: 0,
        l: 0,

        S: 0,
        L: 0,

        r: 0,
        g: 0,
        b: 0,
        a: 1,

        rgb: '',
        hsl: '',
        hex: '',
        opaque: '',
    });

    /**
     * Updates color state.
     *
     * @param hsl - HSL color components.
     * @param source - Element that updating the color.
     * @param updateAll - Whether to update the palette and sliders.
     * @param rgb - RGB color.
     */
    const update: colorUpdater = useCallback(
        (hsl, source, updateAll = false, rgb) => {
            if (!disabled) {
                updatePalette.current = updateAll;

                setColor((color) => {
                    const { r, g, b, a } = color;

                    color = { ...color, ...hsl };
                    color = {
                        ...color,
                        s: round(color.S * 100),
                        l: round(color.L * 100),
                        ...(rgb || HSLToRGB(color)),
                    };

                    const [opaque, alphaHex] = RGBToHEX(color);

                    color.rgb = stringify(color, RGB_FORMAT);
                    color.hsl = stringify(color, HSL_FORMAT);
                    color.hex = opaque + alphaHex;
                    color.opaque = opaque;

                    // Fire onChange if at least one of the rgba components changes.
                    if (
                        source &&
                        onChange &&
                        (color.r !== r || color.g !== g || color.b !== b || color.a !== a)
                    ) {
                        onChange(event(color, 'change', source));
                    }

                    return color;
                });
            }
        },
        [disabled, onChange]
    );

    /**
     * Generates event details (color value and components).
     *
     * @param color - color state.
     * @param type - Event type.
     * @param source - Event source.
     */
    const event = (color: colorState, type: alwanEventType, source?: HTMLElement): alwanEvent => ({
        type,
        source,
        h: color.h,
        s: color.s,
        l: color.l,
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a,
        rgb: color.rgb,
        hsl: color.hsl,
        hex: color.hex,
    });

    /**
     * Updates color state from a color value (string or object).
     *
     * @param value - Color value.
     * @param source - Element that updating the color.
     */
    const updateFromValue: colorUpdaterFromValue = useCallback(
        (value, source) => {
            const [parsedColor, format] = parseColor(value) as [
                color: RGBA | (internalHSL & HSLA),
                format: colorFormat
            ];

            let rgb: RGBA | undefined;
            let hsl: (internalHSL & HSLA) | internalHSL;

            if (format === RGB_FORMAT) {
                rgb = parsedColor as RGBA;
                hsl = RGBToHSL(rgb);
            } else {
                hsl = parsedColor as internalHSL & HSLA;
            }

            update(hsl, source, true, rgb);
        },
        [update]
    );

    /**
     * Picker reference button.
     */
    const button = (
        <Button
            id={id}
            ref={popoverReference}
            className={`alwan__preset-button${className ? ' ' + className : ''}`}
            style={{ '--alwan-color': color.rgb } as React.CSSProperties}
            disabled={disabled}
            onClick={() => {
                if (toggle) {
                    setOpen(!isOpen);
                }
            }}
        />
    );

    /**
     * Picker widget.
     */
    const alwan = (
        <div
            className={`alwan${isOpen ? ' alwan--open' : ''}${popover ? ' alwan--popup' : ''}`}
            data-theme={theme}
            ref={popoverContainer}
        >
            <Palette
                updater={update}
                color={color}
                canUpdate={updatePalette.current}
                disabled={disabled}
            />
            <Container>
                <Utility
                    preview={preview}
                    copy={copy}
                    color={color}
                    format={currentFormat}
                    disabled={disabled}
                />
                <Sliders opacity={opacity} updater={update} color={color} disabled={disabled} />
            </Container>
            <Inputs
                color={color}
                formats={formats}
                format={currentFormat}
                singleInput={singleInput}
                opacity={opacity}
                updater={updateFromValue}
                changeFormat={(format) => setCurrentFormat(format)}
                disabled={disabled}
                close={() => {
                    toggle && setOpen(false);
                }}
            />
            <Swatches
                swatches={swatches}
                toggle={toggleSwatches}
                updater={updateFromValue}
                disabled={disabled}
            />
        </div>
    );

    /**
     * Updates popover position whenever an overflow ancestor of the
     * popover reference element scrolls or the window resizes.
     */
    const autoUpdate: popoverAutoUpdate = useCallback(
        (update, isInViewport) => {
            if (isOpen || !toggle) {
                if (isInViewport()) {
                    if (isOpen) {
                        update();
                        if (closeOnScroll && toggle) {
                            setOpen(false);
                        }
                    } else {
                        setOpen(true);
                    }
                } else {
                    // Close the popover if the reference element is not visible.
                    setOpen(false);
                }
            }
        },
        [closeOnScroll, isOpen, toggle]
    );

    /**
     * Handles popover accessibility.
     * Link focus the reference button with the container's first and last focusable element.
     * close popover if the Escape key is pressed or a click (touch) occurred outside of the
     * popover.
     */
    const popoverAccessibility = useCallback(
        (e: Event | PointerEvent | KeyboardEvent) => {
            if (isOpen) {
                const target = e.target as Node;
                const { key, shiftKey } = e as KeyboardEvent;
                const reference = popoverReference.current as HTMLButtonElement;
                const container = popoverContainer.current as HTMLDivElement;

                if (
                    // Pressing the Escape key or Clicking away closes the popover.
                    key === 'Escape' ||
                    (target !== reference &&
                        ![...reference.labels].some((label) => label.contains(target)) &&
                        !container.contains(target))
                ) {
                    if (toggle) {
                        setOpen(false);
                    }
                } else if (key === 'Tab') {
                    const focusableElements = [
                        ...container.querySelectorAll<HTMLElement>('button,input,[tabindex]'),
                    ];
                    const firstFocusableElement = focusableElements[0];
                    const lastFocusableElement = focusableElements.pop() as HTMLElement;
                    let elementToFocus: HTMLElement | undefined;

                    // Pressing tab while focusing on the reference element (picker button),
                    // sends focus to the palette.
                    if (target === reference && !shiftKey) {
                        elementToFocus = firstFocusableElement;
                    } else if (
                        // Pressing Tab or shift + Tab while focusing on the last focusable element,
                        // or the first focusable element respectively sends focus to the reference,
                        // element (picker button)
                        (shiftKey && target === firstFocusableElement) ||
                        (!shiftKey && target === lastFocusableElement)
                    ) {
                        elementToFocus = reference;
                    }

                    if (elementToFocus) {
                        e.preventDefault();
                        elementToFocus.focus();
                    }
                }
            }
        },
        [toggle, isOpen]
    );

    /**
     * Update input formats and current format index.
     */
    useEffect(() => {
        const formats =
            inputs === true ? ALL_FORMATS : ALL_FORMATS.filter((format) => (inputs || {})[format]);
        const validFormats = formats.length ? formats : ALL_FORMATS;

        setFormats(formats);
        setCurrentFormat(validFormats.includes(format) ? format : validFormats[0]);
    }, [inputs, format]);

    /**
     * Create popover.
     */
    useEffect(() => {
        if (popover) {
            popoverInstance.current = createPopover(
                popoverReference.current as HTMLButtonElement,
                popoverContainer.current as HTMLDivElement,
                { margin, position },
                autoUpdate,
                popoverAccessibility
            );
        }

        return () => {
            popoverInstance.current?.destroy();
            popoverInstance.current = null;
        };
    }, [popover, margin, position, autoUpdate, popoverAccessibility]);

    /**
     * Fire open and close events.
     * Gets color details (value) on open/close.
     */
    useEffect(() => {
        setColor((color) => {
            if (isOpen) {
                onOpen && onOpen(event(color, 'open'));
            } else {
                onClose && onClose(event(color, 'close'));
            }
            return color;
        });
    }, [isOpen, onClose, onOpen]);

    /**
     * Update color from value Prop.
     */
    useEffect(() => {
        updateFromValue(value);
    }, [updateFromValue, value]);

    /**
     * Updates color picker visibility when disabled and toggle props change.
     */
    useEffect(() => {
        if (disabled) {
            // Disable alwan cause it to close when it's displayed as popover or
            // can toggle.
            // Open the color picker if popover and toggler both became false.
            setOpen(!popover && !toggle);
        } else if (
            // Open picker if toggle prop changed to true or picker became enabled and toggle
            // is off.
            // When it displayed as popover, only open it if the reference button is visible
            // in the viewport.
            !toggle &&
            (!popover ||
                (popover && popoverInstance.current && popoverInstance.current.isVisible()))
        ) {
            setOpen(true);
        }
    }, [disabled, popover, toggle]);

    return (
        <>
            {popover || toggle ? button : null}
            {popover ? createPortal(alwan, ROOT.body) : alwan}
        </>
    );
};

export default Alwan;
