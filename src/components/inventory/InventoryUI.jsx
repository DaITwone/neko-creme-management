import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { expiryInfo } from '../../services/inventoryCalculations'

export const labels = { OUT_OF_STOCK: 'Hết hàng', LOW_STOCK: 'Sắp hết', NORMAL: 'Bình thường', EXPIRED: 'Đã hết hạn', EXPIRING_SOON: 'Hạn trong 7 ngày', EXPIRING_30_DAYS: 'Hạn trong 30 ngày', SAFE: 'Hạn trên 30 ngày', NO_EXPIRY: 'Không có HSD', IMPORT: 'Nhập hàng', EXPORT: 'Xuất sử dụng', COUNT: 'Kiểm kho', ADJUST_IN: 'Điều chỉnh tăng', ADJUST_OUT: 'Điều chỉnh giảm', DISCARD: 'Hủy hàng', RETURN: 'Trả nhà cung cấp' }
export function Button({ children, primary, className = '', ...props }) {
  return <button type="button" className={`inv-button ${primary ? 'inv-primary' : ''} ${className}`} {...props}>{children}</button>
}
export function Field({ label, error, children, ...props }) {
  const id = useId()
  return <label className="inv-field" htmlFor={id}><span>{label}</span>{children ? <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props}>{children}</select> : <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />}{error && <small id={`${id}-error`} className="text-red-700">{error}</small>}</label>
}
export function Badge({ status }) {
  const tone = ['EXPIRED', 'OUT_OF_STOCK'].includes(status) ? 'bg-red-50 text-red-800' : ['LOW_STOCK', 'EXPIRING_SOON', 'EXPIRING_30_DAYS'].includes(status) ? 'bg-amber-50 text-amber-800' : status === 'NO_EXPIRY' ? 'bg-stone-100 text-stone-600' : 'bg-emerald-50 text-emerald-800'
  return <span className={`pill ${tone}`}>{labels[status] || status}</span>
}
export function Expiry({ value }) {
  const info = expiryInfo(value)
  return <span className="inline-flex flex-col items-start gap-1"><Badge status={info.status} />{value && <small>{new Date(value).toLocaleDateString('vi-VN', { timeZone: 'UTC' })} · {info.days < 0 ? `Quá ${-info.days} ngày` : info.days === 0 ? 'Hết hạn hôm nay' : `Còn ${info.days} ngày`}</small>}</span>
}
export function Empty({ children = 'Chưa có dữ liệu.' }) {
  return <p className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-500">{children}</p>
}
export function Dialog({ title, children, onClose, drawer = false }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return createPortal(<dialog ref={ref} aria-labelledby={titleId} className={`inv-dialog ${drawer ? 'inv-drawer' : ''}`} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose() } }}>
    <header className="inv-dialog-header"><h2 id={titleId} className="text-lg font-bold">{title}</h2><Button aria-label="Đóng" onClick={onClose}><X size={18} /></Button></header>
    <div className="p-4 md:p-6">{children}</div>
  </dialog>, document.body)
}
export function FormFooter({ onClose, label = 'Xác nhận lưu', extra }) {
  return <footer className="mt-5 flex flex-wrap justify-end gap-2 border-t border-stone-100 pt-4">{extra}<Button onClick={onClose}>Hủy</Button><Button primary type="submit">{label}</Button></footer>
}
