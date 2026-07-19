import { X } from 'lucide-react'

function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[var(--text-h)] text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="text-[var(--text)] hover:text-[var(--text-h)]">
                        <X size={22} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}

export default Modal