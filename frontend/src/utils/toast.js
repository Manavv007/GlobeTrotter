import toast from 'react-hot-toast';

// Store to track active toasts and prevent duplicates
const activeToasts = new Set();

// Custom toast functions that prevent duplicates
export const showSuccess = (message, options = {}) => {
  const toastId = `success-${message}`;

  // If this exact message is already showing, don't show another
  if (activeToasts.has(toastId)) {
    return;
  }

  activeToasts.add(toastId);

  const toastPromise = toast.success(message, {
    id: toastId,
    duration: 3000,
    ...options,
  });

  // Remove from active toasts when dismissed
  setTimeout(() => {
    activeToasts.delete(toastId);
  }, 3000);

  return toastPromise;
};

export const showError = (message, options = {}) => {
  const toastId = `error-${message}`;

  // If this exact message is already showing, don't show another
  if (activeToasts.has(toastId)) {
    return;
  }

  activeToasts.add(toastId);

  const toastPromise = toast.error(message, {
    id: toastId,
    duration: 4000,
    ...options,
  });

  // Remove from active toasts when dismissed
  setTimeout(() => {
    activeToasts.delete(toastId);
  }, 4000);

  return toastPromise;
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, options);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAll = () => {
  toast.dismiss();
  activeToasts.clear();
};
