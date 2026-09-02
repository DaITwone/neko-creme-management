import {
  BookOpenCheck,
  CalendarDays,
  PackageSearch,
  X,
} from "lucide-react";

const nav = [
  {
    id: "phanCongCa",
    label: "Phân công ca",
    icon: CalendarDays,
  },
  {
    id: "tonKho",
    label: "Tồn kho & HSD",
    icon: PackageSearch,
  },
];

export default function Sidebar({
  activePage,
  onNavigate,
  open,
  onClose,
}) {
  return (
    <>
      {/* Lớp phủ trên thiết bị di động */}
      {open && (
        <button
          type="button"
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-[#2f1a12]/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#4B2A1A] text-white shadow-[10px_0_35px_rgba(47,26,18,0.25)] transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="relative flex min-h-32 items-center border-b border-white/10 px-5">
          <div className="flex w-full items-center justify-center rounded-2xl bg-[#FFF9F4] px-3 py-3 shadow-lg shadow-black/10">
            <img
              src="/logo.png"
              alt="Neko Crème"
              className="h-auto max-h-20 w-full object-contain"
            />
          </div>

          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute right-3 top-3 rounded-xl bg-white/10 p-2 text-[#FFF5EC] transition hover:bg-white hover:text-[#4B2A1A] lg:hidden"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        {/* Menu điều hướng */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#DDBFAE]">
            Quản lý cửa hàng
          </p>

          {nav.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id;

            return (
              <button
                type="button"
                key={id}
                onClick={() => {
                  onNavigate(id);
                  onClose();
                }}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#FFF9F4] text-[#4B2A1A] shadow-lg shadow-black/15"
                    : "text-[#FFF5EC] hover:translate-x-1 hover:bg-white/10"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition ${
                    isActive
                      ? "bg-[#F3E3D7] text-[#4B2A1A]"
                      : "bg-white/10 text-[#FFD7C9] group-hover:bg-white/15"
                  }`}
                >
                  <Icon size={19} strokeWidth={2.2} />
                </span>

                <span>{label}</span>

                {isActive && (
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-[#F3A9A4] ring-4 ring-[#F3A9A4]/20" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Trạng thái cửa hàng */}
        <div className="m-4 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🐾</span>

            <p className="text-xs font-semibold text-[#E8CFC0]">
              Cửa hàng hôm nay
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase font-extrabold text-white">
                Hoạt động tốt
              </p>

              <p className="mt-0.5 text-[10px] text-[#DDBFAE]">
                Neko Crème Store
              </p>
            </div>

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
          </div>
        </div>
      </aside>
    </>
  );
}