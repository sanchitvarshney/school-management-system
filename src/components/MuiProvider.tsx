"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import createEmotionServer from "@emotion/server/create-instance";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5" },
  },
  shape: { borderRadius: 12 },
});

export function MuiProvider({ children }: { children: ReactNode }) {
  const cache = useMemo(() => {
    const c = createCache({ key: "mui", prepend: true });
    c.compat = true;
    return c;
  }, []);

  const { extractCriticalToChunks } = useMemo(
    () => createEmotionServer(cache),
    [cache],
  );

  useServerInsertedHTML(() => {
    // CssBaseline/GlobalStyles are inserted via Emotion cache on the server.
    // We flush the current cache so the server markup matches the client hydration.
    const inserted = (cache as unknown as { inserted: Record<string, string | true> })
      .inserted;
    const css = Object.values(inserted)
      .filter((x): x is string => typeof x === "string")
      .join(" ");
    const chunks = extractCriticalToChunks(css);
    return (
      <>
        {chunks.styles.map((style) => (
          <style
            key={style.key}
            data-emotion={`${style.key} ${style.ids.join(" ")}`}
            dangerouslySetInnerHTML={{ __html: style.css }}
          />
        ))}
      </>
    );
  });

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}

