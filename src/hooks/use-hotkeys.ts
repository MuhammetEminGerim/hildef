
import { useHotkeys } from 'react-hotkeys-hook';

type HotkeyConfig = {
  keys: string;
  callback: () => void;
  description?: string;
  enabled?: boolean;
};

export function useHotkeysConfig(configs: HotkeyConfig[]) {
  configs.forEach(({ keys, callback, enabled = true }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(keys, callback, { enabled });
  });
}

// Global hotkeys helper
export function useGlobalHotkeys() {
  useHotkeys('ctrl+s, cmd+s', (e) => {
    e.preventDefault();
    // Global save - can be overridden by components
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA') {
      // Let form handle it
      return;
    }
  });

  useHotkeys('ctrl+n, cmd+n', (e) => {
    e.preventDefault();
    // Global new - can be overridden
  });

  useHotkeys('ctrl+f, cmd+f', (e) => {
    e.preventDefault();
    // Global search - can be overridden
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });

  useHotkeys('escape', () => {
    // Close modals/dialogs
    const closeButton = document.querySelector('[data-dialog-close]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
    }
  });
}

