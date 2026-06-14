import { palette } from './palette.js';
import { typography } from './typography.js';
import { motion } from './motion.js';
import { copy } from './copy.js';
import { nebula } from './nebula.js';
import { suns } from './suns.js';
import { assets } from './assets.js';
import { wuConsole } from './console.js';

// The full Wu-Tang theme object the ThemeProvider injects. The engine consumes ONLY this shape.
export const wuTangTheme = { id: 'wu-tang', palette, typography, motion, copy, nebula, suns, assets, console: wuConsole };
