import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = ({ className, ...props }) => (
  <ToastPrimitive.Viewport
    className={cn(
      'fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm',
      className
    )}
    {...props}
  />
);

const variants = {
  default: 'border bg-background text-foreground',
  destructive: 'border-destructive bg-destructive text-destructive-foreground',
  success: 'border-green-500 bg-green-50 text-green-900',
};

const Toast = ({ className, variant = 'default', ...props }) => (
  <ToastPrimitive.Root
    className={cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full',
      variants[variant],
      className
    )}
    {...props}
  />
);

const ToastTitle = ({ className, ...props }) => (
  <ToastPrimitive.Title className={cn('text-sm font-semibold', className)} {...props} />
);

const ToastDescription = ({ className, ...props }) => (
  <ToastPrimitive.Description className={cn('text-sm opacity-90', className)} {...props} />
);

const ToastClose = ({ className, ...props }) => (
  <ToastPrimitive.Close
    className={cn(
      'absolute right-2 top-2 rounded-sm p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
);

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose };
