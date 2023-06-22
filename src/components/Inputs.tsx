import { useCallback, useEffect, useRef, useState } from 'react';
import { switchInputsSVG } from '../assets/svg/icons';
import { colorState, inputValues, type inputsProps } from '../types';
import Container from './Container';
import { HEX_FORMAT } from '../constants';
import { stringify } from '../colors/stringify';

/**
 * Color picker inputs.
 *
 * @param param0 - Props.
 */
const Inputs = ({
    color,
    formats,
    format,
    singleInput,
    opacity,
    updater,
    changeFormat,
}: inputsProps) => {
    /**
     * Gets fields to build.
     */
    const getFields = useCallback(
        () =>
            (format === HEX_FORMAT || singleInput
                ? [format]
                : (format + (opacity ? 'a' : '')).split('')) as Array<keyof colorState>,
        [format, opacity, singleInput]
    );
    const values = useRef<inputValues>({ ...color });
    // Used so inputs don't updates their values.
    const changing = useRef(false);
    const [fields, setFields] = useState<Array<keyof colorState>>(getFields());
    const length = formats.length;

    /**
     * Handles switch inputs button click.
     */
    const handleClick = () => {
        changeFormat(formats[(formats.indexOf(format) + 1) % length]);
    };

    /**
     * Handles inputs change.
     *
     * @param param0 - Event.
     * @param field - Input identifier.
     */
    const handleChange = (
        { target, target: { value } }: React.ChangeEvent<HTMLInputElement>,
        field: keyof colorState
    ) => {
        changing.current = true;
        values.current[field] = value;
        updater(field === format ? value : stringify(values.current, format), target);
    };

    /**
     * Update fields.
     */
    useEffect(() => {
        setFields(getFields());
    }, [getFields]);

    if (length) {
        return (
            <Container>
                <div className='alwan__inputs'>
                    {fields.map((field) => (
                        <label key={field}>
                            <input
                                type='text'
                                className='alwan__input'
                                value={changing.current ? values.current[field] : color[field]}
                                onChange={(e) => handleChange(e, field)}
                                onBlur={() => {
                                    changing.current = false;
                                }}
                            />
                            <span>{field}</span>
                        </label>
                    ))}
                </div>
                {length > 1 ? (
                    <button type='button' className='alwan__button' onClick={handleClick}>
                        {switchInputsSVG}
                    </button>
                ) : null}
            </Container>
        );
    }

    return null;
};

export default Inputs;
