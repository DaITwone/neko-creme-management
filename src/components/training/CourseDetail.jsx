import {
  ArrowLeft,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
} from 'lucide-react'
import MaterialList from './MaterialList'
import Quiz from './Quiz'

export default function CourseDetail({
  course,
  questions,
  showQuiz,
  onStartQuiz,
  onCloseQuiz,
  onBack,
}) {
  const CourseIcon = course.icon

  return (
    <div className="mx-auto max-w-7xl">
      {/* Nút quay lại */}
      <button
        type="button"
        onClick={onBack}
        className="group mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-brand-green transition hover:text-emerald-700"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-brand-green transition group-hover:bg-brand-green group-hover:text-white">
          <ArrowLeft size={17} />
        </span>

        Quay lại danh sách
      </button>

      <section className="overflow-hidden rounded-[24px] border-[3px] border-brand-green bg-white shadow-[0_10px_0_rgba(0,134,106,0.10)]">
        {/* Dải màu phía trên */}
        <div className="flex">
          <span className="h-2 flex-1 bg-brand-green" />
          <span className="h-2 w-1/4 bg-brand-orange" />
          <span className="h-2 w-1/4 bg-brand-red" />
        </div>

        {/* Header khóa học */}
        <div className="relative overflow-hidden border-b border-slate-100 p-6 md:p-8">
          {/* Số 7 trang trí */}
          <span className="pointer-events-none absolute -right-3 -top-12 text-[180px] font-black italic leading-none text-brand-red/[0.04]">
            7
          </span>

          <div className="relative flex flex-wrap items-center gap-5">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-brand-green text-white shadow-lg shadow-emerald-900/20 md:h-20 md:w-20">
              <CourseIcon size={34} strokeWidth={2.2} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-green">
                7-Eleven training center
              </p>

              <h1 className="mt-2 max-w-3xl text-2xl font-black uppercase leading-tight tracking-tight text-brand-red md:text-3xl">
                {course.title}
              </h1>

              <div className="mt-3 flex items-center">
                <span className="h-1 w-16 rounded-full bg-brand-orange" />
                <span className="ml-1 h-1 w-5 rounded-full bg-brand-green" />
              </div>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                {course.description}
              </p>
            </div>

            {!showQuiz && (
              <button
                type="button"
                onClick={onStartQuiz}
                className="group/quiz flex items-center gap-3 rounded-xl bg-brand-red px-5 py-3.5 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/15 transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                  <GraduationCap size={20} />
                </span>

                Thi trắc nghiệm
              </button>
            )}
          </div>
        </div>

        {showQuiz ? (
          <Quiz
            key={course.id}
            course={course}
            questions={questions}
            onBack={onCloseQuiz}
          />
        ) : (
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            {/* Danh sách tài liệu */}
            <main>
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-orange text-white">
                  <FileCheck2 size={22} />
                </span>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green">
                    Learning materials
                  </p>

                  <h2 className="text-lg font-black uppercase text-brand-red">
                    Tài liệu đào tạo
                  </h2>
                </div>
              </div>

              <MaterialList materials={course.materials} />
            </main>

            {/* Quy định hoàn thành */}
            <aside className="h-fit overflow-hidden rounded-[20px] border-2 border-brand-green bg-white">
              <div className="bg-brand-green px-5 py-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Training requirements
                </p>

                <h2 className="mt-1 text-lg font-black uppercase">
                  Yêu cầu hoàn thành
                </h2>
              </div>

              <div className="space-y-4 p-5">
                {[
                  {
                    number: '01',
                    text: 'Xem đầy đủ tài liệu PDF và hình ảnh',
                  },
                  {
                    number: '02',
                    text: 'Hoàn thành tất cả câu hỏi trắc nghiệm',
                  },
                  {
                    number: '03',
                    text: 'Đạt tối thiểu 80 điểm',
                  },
                ].map((requirement) => (
                  <div
                    key={requirement.number}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-green text-xs font-black text-white">
                      {requirement.number}
                    </span>

                    <div className="flex min-h-9 flex-1 items-center">
                      <p className="text-sm font-semibold leading-5 text-slate-700">
                        {requirement.text}
                      </p>
                    </div>

                    <CheckCircle2
                      size={19}
                      className="mt-2 shrink-0 text-brand-green"
                    />
                  </div>
                ))}
              </div>

              {/* CTA thi trắc nghiệm */}
              <div className="border-t border-dashed border-slate-200 p-5">
                <button
                  type="button"
                  onClick={onStartQuiz}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange px-4 py-3.5 text-sm font-black uppercase text-white transition hover:bg-orange-600"
                >
                  <GraduationCap size={19} />
                  Bắt đầu bài thi
                </button>
              </div>

              {/* Dải màu cuối bảng */}
              <div className="flex">
                <span className="h-2 flex-1 bg-brand-red" />
                <span className="h-2 flex-1 bg-brand-orange" />
                <span className="h-2 flex-1 bg-brand-green" />
              </div>
            </aside>
          </div>
        )}

        {/* Dải màu phía dưới */}
        <div className="flex">
          <span className="h-1.5 w-1/3 bg-brand-red" />
          <span className="h-1.5 w-1/3 bg-brand-orange" />
          <span className="h-1.5 flex-1 bg-brand-green" />
        </div>
      </section>
    </div>
  )
}