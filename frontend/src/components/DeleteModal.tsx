import { Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Item?", 
  description = "Are you sure? This action cannot be undone." 
}: DeleteModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-sm w-full p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {description}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button 
                onClick={onClose} 
                className="flex-1 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm} 
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-red-200 dark:shadow-none"
            >
                Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}