import {
  ChevronRight,
  FileImage,
  FileText,
} from 'lucide-react'

export default function MaterialList({ materials }) {
  if (!materials.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        Chuyên đề này chưa có tài liệu.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {materials.map((material, index) => {
        const MaterialIcon =
          material.type === 'pdf' ? FileText : FileImage

        return (
          <a
            key={material.id}
            href={material.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-brand-green hover:bg-emerald-50/40"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-brand-green">
              <MaterialIcon size={21} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-bold uppercase">
                Bài {index + 1}: {material.title}
              </p>

              <p className="mt-1 text-xs uppercase text-slate-400">
                {material.type === 'pdf'
                  ? 'Tài liệu PDF'
                  : 'Hình ảnh đào tạo'}
              </p>
            </div>

            <ChevronRight
              size={19}
              className="shrink-0 text-slate-400"
            />
          </a>
        )
      })}
    </div>
  )
}