import { CheckCircle, XCircle, X } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 perspective-container">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={`
            toast-3d flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
            ${toast.type === 'success' ? 'bg-white border border-green-200 text-green-600' : 'bg-white border border-rose-200 text-rose-600'}
          `}
          style={{
            transform: `translateZ(${index * 8}px)`,
            animation: `toastSlide3D 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
            boxShadow: toast.type === 'success' 
              ? '0 4px 20px rgba(34, 197, 94, 0.15)' 
              : '0 4px 20px rgba(239, 68, 68, 0.15)'
          }}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} className="text-green-500" />
          ) : (
            <XCircle size={18} className="text-rose-500" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors hover-lift-3d"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
