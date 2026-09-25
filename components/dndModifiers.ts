import { Modifier } from '@dnd-kit/core';

// Lock drags to the vertical axis (avoids adding @dnd-kit/modifiers for one function).
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
