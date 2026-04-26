"use client";

import Link from "next/link";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { Button, Stack } from "@mui/material";

type HeroCtasProps = {
    documentsHref: string;
    chatHref: string;
    primaryLabel: string;
    secondaryLabel: string;
};

/**
 * Primary / secondary calls-to-action under the hero message.
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
                sx={{ py: 1.25, boxShadow: "0 8px 24px rgba(36, 87, 230, 0.25)" }}
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
                sx={{
                    py: 1.25,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#e8ecf5",
                    "&:hover": {
                        borderColor: "rgba(122, 162, 255, 0.5)",
                        backgroundColor: "rgba(122, 162, 255, 0.06)",
                    },
                }}
            >
                {secondaryLabel}
            </Button>
        </Stack>
    );
}
