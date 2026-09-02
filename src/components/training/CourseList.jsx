import {
  ArrowRight,
  FileImage,
  FileText,
} from 'lucide-react'

export default function CourseList({
  courses,
  onSelectCourse,
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {courses.map((course, index) => {
        const CourseIcon = course.icon

        const pdfCount = course.materials.filter(
          (material) => material.type === 'pdf',
        ).length

        const imageCount = course.materials.filter(
          (material) => material.type === 'image',
        ).length

        return (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelectCourse(course)}
            className="group relative flex min-h-[285px] w-full flex-col overflow-hidden rounded-[22px] border-[3px] border-brand-green bg-white text-left shadow-[0_8px_0_rgba(0,134,106,0.10)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_13px_0_rgba(0,134,106,0.14)] focus:outline-none focus:ring-4 focus:ring-brand-green/20"
          >
            {/* Dải màu nhận diện 7-Eleven */}
            <div className="w-full">
              {/* <div className="h-2 bg-brand-green" /> */}
              {/* <div className="h-2 bg-brand-orange" /> */}
              {/* <div className="h-2 bg-brand-red" /> */}
            </div>

            <div className="flex flex-1 flex-col p-5">
              {/* Icon và số thứ tự */}
              <div className="flex items-start justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-green text-white shadow-md shadow-emerald-900/15 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
                  <CourseIcon size={27} strokeWidth={2.2} />
                </span>

                <div className="relative flex h-14 w-14 items-center justify-center">
                  <span className="absolute text-6xl font-black italic leading-none text-brand-red/10">
                    7
                  </span>

                  <span className="relative text-sm font-black text-brand-red">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="mt-5">
                {/* <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">
                  Chuyên đề đào tạo
                </p> */}

                <h2 className="text-lg font-black uppercase leading-6 tracking-tight text-brand-orange">
                  {course.title}
                </h2>

                {/* Gạch chân cam */}
                <div className="mt-3 flex items-center">
                  <span className="h-1 w-12 rounded-full bg-brand-orange transition-all duration-300 group-hover:w-24" />
                  <span className="ml-1 h-1 w-3 rounded-full bg-brand-green" />
                </div>
              </div>

              <p className="mt-4 line-clamp-2 flex-1 text-sm leading-6 text-slate-600">
                {course.description}
              </p>

              {/* Footer card */}
              <div className="mt-5 flex items-center border-t border-dashed border-slate-200 pt-4">
                {/* <div className="flex items-center gap-2">
                  {pdfCount > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-extrabold text-brand-red">
                      <FileText size={13} />
                      {pdfCount} PDF
                    </span>
                  )}

                  {imageCount > 0 && (
                    <span className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-[11px] font-extrabold text-brand-orange">
                      <FileImage size={13} />
                      {imageCount} ảnh
                    </span>
                  )}
                </div> */}

                <span className="ml-auto flex items-center gap-1.5 text-xs font-black uppercase text-brand-green">
                  Bắt đầu
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </div>
            </div>

            {/* Khối trang trí góc card */}
            <span className="absolute bottom-0 right-0 h-2 w-16 bg-brand-red" />
            <span className="absolute bottom-0 right-16 h-2 w-10 bg-brand-orange" />
          </button>
        )
      })}
    </div>
  )
}