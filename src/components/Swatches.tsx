import { useEffect, useState } from 'react';
import { caretSVG } from '../assets/svg/icons';
import type { swatchesProps } from '../types';
import Button from './Button';
import { parseColor } from '../colors/parser';
import { isString } from '../utils/is';

/**
 * Creates color swatches buttons.
 *
 * @param param0 - Props.
 */
const Swatches = ({
    swatches,
    toggle,
    updater,
    disabled,
    popover,
    i18n: { swatches: swatchLabel, toggle: toggleButtonLabel },
}: swatchesProps) => {
    const [isCollapsed, setCollapsed] = useState(false);

    /**
     * Updates state if toggleSwatches changes.
     */
    useEffect(() => {
        setCollapsed(toggle);
    }, [toggle]);

    /**
     * Resposition popover after expanding or collapsing the swatches container.
     */
    useEffect(() => {
        if (popover) {
            popover.update();
        }
    }, [isCollapsed, popover]);

    if (Array.isArray(swatches) && swatches.length) {
        return (
            <>
                <div
                    className={`alwan__swatches${isCollapsed ? ' alwan--collapse' : ''}`}
                >
                    {swatches.map((swatch, index) => (
                        <Button
                            key={index}
                            className='alwan__swatch'
                            style={
                                {
                                    '--color': parseColor(swatch, true),
                                } as React.CSSProperties
                            }
                            onClick={() => updater(swatch)}
                            disabled={disabled}
                            aria-label={swatchLabel}
                            title={
                                isString(swatch)
                                    ? swatch
                                    : (parseColor(swatch, true) as string)
                            }
                        />
                    ))}
                </div>
                {toggle ? (
                    /**
                     * Toggle button.
                     */
                    <Button
                        className='alwan__toggle-button'
                        onClick={() => setCollapsed(!isCollapsed)}
                        disabled={disabled}
                        aria-label={toggleButtonLabel}
                        title={toggleButtonLabel}
                    >
                        {caretSVG}
                    </Button>
                ) : null}
            </>
        );
    }

    return null;
};

export default Swatches;
