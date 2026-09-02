import { PackageOpen } from 'lucide-react'

export default function EmptyState({ title = 'Chưa có dữ liệu', description = 'Dữ liệu mới sẽ hiển thị tại đây.' }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-900/15 bg-white px-6 py-16 text-center">
    <span className="mb-4 rounded-2xl bg-emerald-50 p-3 text-brand-green"><PackageOpen size={26} /></span>
    <h3 className="font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
  </div>
}
