/**
 * MUI theme factory and dark-mode shell colors.
 * Body background gradient comes from `MuiCssBaseline` overrides.
 */

import { createTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { alpha, lighten } from "@mui/material/styles";

/** Base background token; avoids pure `#000` strips next to the gradient. */
const darkShell = "#050508";


/**
 * Colours for a light assistant bubble on a dark chat shell. Uses
 * `theme.palette.getContrastText(surface)` so ink follows the surface in any
 * palette mode, without ad hoc `grey.900` on every `sx` block.
 *
 * @param theme - MUI `Theme` from `useTheme` or the `theme` arg of `sx`.
 * @returns Surface fill, primary text, and muted/icon tints of the same hue.
 */
export function getAssistantMessageTokens(theme: Theme) {
    const surface = theme.palette.grey[100];
    const onSurface = theme.palette.getContrastText(surface);
    return {
        surface,
        onSurface,
        onSurfaceIcon: alpha(onSurface, 0.58),
        onSurfaceMuted: alpha(onSurface, 0.75),
    };
}

/**
 * Chat layout surfaces (history rail, main pane, nested cards) for light and dark mode.
 *
 * @param theme - Active MUI theme.
 * @returns Background and border tokens for the full-width chat UI.
 */
export function getChatShellTokens(theme: Theme) {
    const { palette } = theme;
    const isDark = palette.mode === "dark";
    return {
        pageBg: palette.background.default,
        historyRailBg: isDark ? palette.grey[900] : palette.grey[50],
        mainChromeBg: isDark ? palette.grey[800] : palette.grey[100],
        historyCardBg: isDark ? palette.grey[900] : palette.grey[200],
        subtleBorder: palette.divider,
    };
}

const lightBackground = "#f5f7fb";
const darkPrimary = "#7aa2ff";

const darkBodyBackground = {
    backgroundColor: darkShell,
    backgroundImage: [
        `radial-gradient(1200px 500px at 50% -10%, ${alpha(darkPrimary, 0.12)}, transparent 55%)`,
        `linear-gradient(180deg, ${lighten(darkShell, 0.06)} 0%, ${darkShell} 45%, ${darkShell} 100%)`,
    ].join(", "),
    backgroundAttachment: "fixed" as const,
};

/**
 * The app MUI theme. Light and dark are MUI color schemes: `ThemeProvider` (see
 * `app/providers.tsx`) picks and persists the mode, and `useColorScheme` switches it.
 */
export const appTheme = createTheme({
        colorSchemes: {
            dark: {
                palette: {
                    primary: { main: darkPrimary },
                    secondary: { main: "#48d1c6" },
                    background: { default: darkShell, paper: darkShell },
                },
            },
            light: {
                palette: {
                    primary: { main: "#2457e6" },
                    secondary: { main: "#0f766e" },
                    background: { default: lightBackground, paper: "#ffffff" },
                },
            },
        },
        shape: {
            borderRadius: 8,
        },
        typography: {
            fontFamily: "var(--font-geist-sans), Arial, sans-serif",
            h4: {
                fontWeight: 700,
            },
            h5: {
                fontWeight: 700,
            },
            button: {
                textTransform: "none",
                fontWeight: 700,
            },
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: (theme) => ({
                    body:
                        theme.palette.mode === "dark"
                            ? { ...darkBodyBackground }
                            : { backgroundColor: lightBackground },
                }),
            },
        },
    });
