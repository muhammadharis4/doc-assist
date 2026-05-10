"use client";

import Link from "next/link";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { Button, Stack } from "@mui/material";
import { alpha } from "@mui/material/styles";

type HeroCtasProps = {
    /** Next `Link` href for the “documents” (primary) button. */
    documentsHref: string;
    /** Next `Link` href for the “chat” (secondary) button. */
    chatHref: string;
    /** Primary button text (e.g. “Add documents”). */
    primaryLabel: string;
    /** Outlined button text (e.g. “Start chatting”). */
    secondaryLabel: string;
};

/**
 * Primary / secondary calls-to-action under the hero message.
 * @param props - `HeroCtasProps` (hrefs and labels for both buttons).
 * @returns A responsive `Stack` of two MUI `Button` links.
 */
export function HeroCtas({
    documentsHref,
    chatHref,
    primaryLabel,
    secondaryLabel,
}: HeroCtasProps) {
    return (
        <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
                mt: 3,
                maxWidth: 440,
                mx: "auto",
                justifyContent: "center",
            }}
        >
            <Button
                component={Link}
                href={documentsHref}
                variant="contained"
                size="large"
                fullWidth
                startIcon={<DescriptionRoundedIcon />}
                sx={(theme) => ({
                    py: 1.25,
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.dark, 0.28)}`,
                })}
            >
                {primaryLabel}
            </Button>
            <Button
                component={Link}
                href={chatHref}
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<ChatRoundedIcon />}
                sx={(theme) =>
                    theme.palette.mode === "dark"
                        ? {
                              py: 1.25,
                              borderColor: alpha(
                                  theme.palette.common.white,
                                  0.22,
                              ),
                              color: theme.palette.text.primary,
                              "&:hover": {
                                  borderColor: alpha(
                                      theme.palette.primary.light,
                                      0.55,
                                  ),
                                  backgroundColor: alpha(
                                      theme.palette.primary.main,
                                      0.06,
                                  ),
                              },
                          }
                        : { py: 1.25 }
                }
            >
                {secondaryLabel}
            </Button>
        </Stack>
    );
}
