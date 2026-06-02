import { createContext, useContext } from 'react';

interface AdminPreviewCtx {
  /** Send a postMessage to the preview iframe */
  post: (msg: Record<string, unknown>) => void;
  /** Register a callback that fires each time the preview iframe signals ready */
  onPreviewReady: (cb: () => void) => () => void;
}

const AdminPreviewContext = createContext<AdminPreviewCtx>({
  post: () => {},
  onPreviewReady: () => () => {},
});

export function useAdminPreview() { return useContext(AdminPreviewContext); }
export { AdminPreviewContext };
