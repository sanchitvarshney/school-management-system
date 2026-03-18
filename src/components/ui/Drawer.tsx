"use client";

import type { ReactNode } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import type { ModalProps } from "@mui/material/Modal";
import { useTheme } from "@mui/material/styles";

export function Drawer({
  open,
  title,
  children,
  footer,
  onClose,
  closeOnOverlayClick = true,
  width = "80vw",
}: {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  /** Pinned below scrollable content (e.g. Cancel / Submit) */
  footer?: ReactNode;
  onClose: () => void;
  /** When true, clicking the backdrop closes the drawer */
  closeOnOverlayClick?: boolean;
  /** Panel width, e.g. "80vw" or "80%" */
  width?: string | number;
}) {
  const theme = useTheme();
  const hasFooter = footer != null && footer !== false;

  const handleClose: NonNullable<ModalProps["onClose"]> = (_event, reason) => {
    if (!closeOnOverlayClick && reason === "backdropClick") return;
    onClose();
  };

  return (
    <MuiDrawer
      anchor="right"
      open={open}
      onClose={handleClose}
      slotProps={{
        backdrop: {
          sx: { backgroundColor: "rgba(0,0,0,0.4)" },
        },
        paper: {
          sx: {
            width,
            maxWidth: "100vw",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            borderLeft: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[16],
          },
        },
        root: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": "drawer-title",
        } as Record<string, unknown>,
      }}
      keepMounted={false}
    >
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          flexShrink: 0,
          borderBottom: 1,
          borderColor: "divider",
          px: 2,
          py: 1.5,
          bgcolor: "background.paper",
        }}
      >
        <Box
          id="drawer-title"
          sx={{
            minWidth: 0,
            flex: 1,
            typography: "subtitle1",
            fontWeight: 600,
            color: "text.primary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="medium"
          edge="end"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        >
          <CloseRounded />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            p: 2,
          }}
        >
          {children}
        </Box>
        {hasFooter ? (
          <Box
            component="footer"
            sx={{
              flexShrink: 0,
              borderTop: 1,
              borderColor: "divider",
              px: 2,
              py: 1.5,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 1,
              bgcolor: "background.paper",
              boxShadow: (t) => t.shadows[4],
            }}
          >
            {footer}
          </Box>
        ) : null}
      </Box>
    </MuiDrawer>
  );
}
