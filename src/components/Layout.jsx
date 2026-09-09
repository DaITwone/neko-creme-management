import { useState } from "react";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function Layout({ activePage, onNavigate, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCF9F4]">
      {/* Ẩn toàn bộ Sidebar khi in */}
      <div className="app-sidebar">
        <Sidebar
          activePage={activePage}
          onNavigate={onNavigate}
          open={open}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* Loại bỏ khoảng trống sidebar khi in */}
      <div className="app-shell lg:pl-72">
        <header className="app-header px-4 pt-4 lg:hidden">
          <button type="button" aria-label="Mở menu điều hướng" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl border border-[#E5D7CC] bg-white px-3 py-2 text-sm font-bold text-[#4B2A1A]">
            <Menu size={20} /> Menu
          </button>
        </header>
        {/* Loại bỏ padding của layout khi in */}
        <main className="app-main p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
