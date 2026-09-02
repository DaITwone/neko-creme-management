import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";

const PASSING_SCORE = 80;

export default function Quiz({ course, questions, onBack }) {
  const [answers, setAnswers] = useState({});

  const answeredCount = Object.keys(answers).length;

  const isCompleted =
    questions.length > 0 && answeredCount === questions.length;

  const correctCount = questions.reduce((total, question) => {
    return answers[question.id] === question.correctAnswer ? total + 1 : total;
  }, 0);

  const scorePercentage = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const passed = scorePercentage >= PASSING_SCORE;

  const selectAnswer = (questionId, optionIndex) => {
    if (answers[questionId] !== undefined) return;

    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: optionIndex,
    }));
  };

  const resetQuiz = () => {
    setAnswers({});
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!questions.length) {
    return (
      <div className="p-5 md:p-8">
        <div className="mx-auto max-w-xl overflow-hidden rounded-[20px] border-2 border-brand-green bg-white text-center">
          <div className="flex">
            <span className="h-2 flex-1 bg-brand-green" />
            <span className="h-2 flex-1 bg-brand-orange" />
            <span className="h-2 flex-1 bg-brand-red" />
          </div>

          <div className="p-8">
            <p className="text-lg font-black uppercase text-brand-red">
              Chưa có câu hỏi
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Chuyên đề này chưa có bài thi trắc nghiệm.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-green px-5 py-3 text-sm font-black uppercase text-white"
            >
              <ArrowLeft size={17} />
              Quay lại bài học
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Thống kê */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="rounded-lg bg-brand-green px-3 py-2 text-xs font-black uppercase text-white">
            Đã trả lời {answeredCount}/{questions.length}
          </span>

          <span className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-black uppercase text-brand-orange">
            Điểm đạt {PASSING_SCORE}/100
          </span>
        </div>

        {/* Danh sách câu hỏi */}
        <div className="space-y-6">
          {questions.map((question, questionIndex) => {
            const selectedAnswer = answers[question.id];

            const hasAnswered = selectedAnswer !== undefined;

            const answeredCorrectly = selectedAnswer === question.correctAnswer;

            return (
              <article
                key={question.id}
                className="overflow-hidden rounded-[20px] border-2 border-slate-200 bg-white transition focus-within:border-brand-green"
              >
                {/* Tiêu đề câu hỏi */}
                <div className="flex items-start gap-4 border-b border-slate-100 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-green text-sm font-black text-white">
                    {String(questionIndex + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange">
                      Câu hỏi {questionIndex + 1}
                    </p>

                    <h3 className="mt-1 font-extrabold uppercase leading-6 text-brand-red">
                      {question.question}
                    </h3>
                  </div>
                </div>

                {/* Các đáp án */}
                <div className="space-y-3 p-5">
                  {question.options.map((option, optionIndex) => {
                    const isSelected = selectedAnswer === optionIndex;

                    const isCorrect = question.correctAnswer === optionIndex;

                    let optionClass =
                      "border-slate-200 bg-white text-slate-700 hover:border-brand-green hover:bg-emerald-50/40";

                    let labelClass =
                      "border-slate-300 bg-slate-50 text-slate-500";

                    if (hasAnswered && isCorrect) {
                      optionClass =
                        "border-brand-green bg-emerald-50 text-brand-green";

                      labelClass =
                        "border-brand-green bg-brand-green text-white";
                    }

                    if (hasAnswered && isSelected && !isCorrect) {
                      optionClass = "border-brand-red bg-red-50 text-brand-red";

                      labelClass = "border-brand-red bg-brand-red text-white";
                    }

                    return (
                      <button
                        key={`${question.id}-${optionIndex}`}
                        type="button"
                        disabled={hasAnswered}
                        onClick={() => selectAnswer(question.id, optionIndex)}
                        className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left text-sm font-semibold transition disabled:cursor-default ${optionClass}`}
                      >
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-black transition ${labelClass}`}
                        >
                          {String.fromCharCode(65 + optionIndex)}
                        </span>

                        <span className="flex-1">{option}</span>

                        {hasAnswered && isCorrect && (
                          <CheckCircle2 size={20} className="shrink-0" />
                        )}

                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle size={20} className="shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        {/* Kết quả cuối bài */}
        {isCompleted && (
          <section
            className={`mt-7 overflow-hidden rounded-[22px] border-[3px] bg-white ${
              passed ? "border-brand-green" : "border-brand-red"
            }`}
          >
            <div
              className={`flex items-center gap-4 p-6 ${
                passed ? "bg-brand-green text-white" : "bg-brand-red text-white"
              }`}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white/15">
                {passed ? <Trophy size={29} /> : <RotateCcw size={27} />}
              </span>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                  Kết quả bài thi
                </p>

                <p className="mt-1 text-3xl font-black">
                  {scorePercentage}/100 điểm
                </p>
              </div>
            </div>

            <div className="p-5">
              <p className="font-extrabold text-slate-800">
                Bạn trả lời đúng {correctCount}/{questions.length} câu.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {passed
                  ? "Bạn đã đạt yêu cầu và hoàn thành bài kiểm tra chuyên đề."
                  : `Bạn chưa đạt ${PASSING_SCORE} điểm. Hãy xem lại tài liệu và thực hiện bài thi một lần nữa.`}
              </p>
            </div>

            <div className="flex">
              <span className="h-2 flex-1 bg-brand-red" />
              <span className="h-2 flex-1 bg-brand-orange" />
              <span className="h-2 flex-1 bg-brand-green" />
            </div>
          </section>
        )}

        {/* Điều hướng */}
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border-2 border-brand-green px-5 py-3 text-sm font-black uppercase text-brand-green transition hover:bg-emerald-50"
          >
            <ArrowLeft size={17} />
            Quay lại bài học
          </button>

          {answeredCount > 0 && (
            <button
              type="button"
              onClick={resetQuiz}
              className="flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-orange-600"
            >
              <RotateCcw size={17} />
              Làm lại bài thi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
