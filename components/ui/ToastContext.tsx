import React, { createContext, useContext, useState } from 'react';

type ToastType = 'error' | 'success';

interface Toast {
  message: string;
  type: ToastType;
}

const ToastContext = createContext<any>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`fixed top-6 right-6 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg 
          ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#4c63d9] text-white'}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
