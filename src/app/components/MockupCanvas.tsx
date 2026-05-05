import { forwardRef, type CSSProperties, type ReactNode } from "react";

export interface MockupConfig {
  brandName: string;
  brandDomain: string;
  logoUrl: string | null;
  logoBgHex: string;
  heroUrl: string | null;
  smsMsg2: string;
  pushTitle: string;
  pushBody: string;
}

const FONT =
  "system-ui, \"SF Pro Text\", \"SF Pro Display\", \"Inter\", \"Helvetica Neue\", Arial, sans-serif";