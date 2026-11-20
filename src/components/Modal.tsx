import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} onClose={close} onClick={e => { if (e.target === e.currentTarget) close() }} aria-labelledby="dialog-title">
    <div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={close} aria-label="بستن"><X size={21} /></button></div>
    {children}
  </dialog>
}
