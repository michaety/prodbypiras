// Simple toast notification system - no external dependencies
// Provides success and error toast notifications with auto-dismiss

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number; // milliseconds
}

export function showToast(options: ToastOptions): void {
  const { message, type = 'success', duration = 3000 } = options;
  
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    font-size: 14px;
    font-weight: 500;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    word-wrap: break-word;
  `;

  // Add checkmark or error icon
  const icon = type === 'success' 
    ? '✓' 
    : type === 'error' 
    ? '✕' 
    : 'ℹ';
  
  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 18px; font-weight: bold;">${icon}</span>
      <span>${message}</span>
    </div>
  `;

  // Add animation styles if not already present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Add toast to container
  container.appendChild(toast);

  // Auto-dismiss after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
      // Remove container if empty
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, duration);
}

// Convenience functions
export function showSuccessToast(message: string, duration?: number): void {
  showToast({ message, type: 'success', duration });
}

export function showErrorToast(message: string, duration?: number): void {
  showToast({ message, type: 'error', duration });
}

export function showInfoToast(message: string, duration?: number): void {
  showToast({ message, type: 'info', duration });
}
