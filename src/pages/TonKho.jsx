import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  ImageOff,
  Milk,
  PackageCheck,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";

const GROUPS = {
  "Vinamilk & Green Farm": [
    "Sữa Vinamilk Không Đường 1L",
    "Sữa Vinamilk Có Đường 1L",
    "STTT Vinamilk Không Đường Hộp 180ml",
    "STTT Vinamilk Có Đường Hộp 180ml",
    "STTT Vinamilk Socola Hộp 180ml",
    "Sữa Tươi Tiệt Trùng Vinamilk Bắp 180ml",
    "Sữa Tươi Tách Béo Vinamilk Dưa Lưới 180ml",
    "STTT Vinamilk Giảm Béo Chuối 180ml",
    "Sữa Vinamilk Không Đường Túi 220ml",
    "Sữa Vinamilk Có Đường Bịch 220ml",
    "Sữa Cao Đạm Ít Béo VNM Green Farm 250ml",
  ],
  "TH True Milk": [
    "Sữa Tươi Tiệt Trùng TH Nguyên Chất 1L",
    "Sữa TH True Milk Ít Đường 1L",
    "Sữa TH True Milk Nguyên Chất 180ml",
    "Sữa TH True Milk Ít Đường 180ml",
    "Sữa TH True Milk Có Đường 180ml",
    "Sữa Tươi Tiệt Trùng TH Chuối 180ml",
    "Sữa Yến Mạch TH 180ml",
  ],
  Binggrae: [
    "Sữa Binggrae Chuối 200ml",
    "Sữa Binggrae Dưa Lưới 200ml",
    "Sữa Binggrae Khoai Môn 200ml",
    "Sữa Binggrae Dâu Ít Đường 200ml",
  ],
  "Sữa hạt & thực vật": [
    "Sữa Yến Mạch Oatside Nguyên Vị 180ml",
    "Sữa Yến Mạch Oatside Đậm Đà 180ml",
    "Sữa Yến Mạch Oatside Vị Socola 180ml",
    "Sữa Yến Mạch Oatbedient Nguyên Bản 140g",
    "Sữa Yến Mạch Oatbedient Socola 175g",
    "Sữa Vinamilk Super Nut Hộp 180ml",
    "Sữa Đậu Nành Vinamilk Hạnh Nhân 180ml",
    "Sữa Đậu Nành Vinamilk Đậu Đỏ 180ml",
    "Sữa Đậu Nành Fami Hộp 200ml",
    "Sữa Bắp Non LOF Canxi Hộp 180ml",
  ],
  "Milo, Ovaltine & Chocolate": [
    "Milo Sữa Lúa Mạch 180ml",
    "Sữa Lúa Mạch Milo Ít Đường 180ml",
    "Sữa Lúa Mạch Milo A2 180ml",
    "Sữa Lúa Mạch Nestle Milo Pro 220ml",
    "Sữa Lúa Mạch Nestle Milo Cà Phê 220ml",
    "Sữa Lúa Mạch Ovaltine Vị Sô Cô La 180ml",
    "Thức Uống SCL Hershey's Bánh Quy Kem 235ml",
    "Thức Uống Sô Cô La Hershey's 235ml",
  ],
  "Dinh dưỡng & loại khác": [
    "Sữa Nước Ensure Vani 237ml",
    "Sữa Nước Ensure Gold 237ml",
    "Sữa Tiệt Trùng Anlene Không Lactose 180ml",
    "STTT Anlene Không Lactose Hạnh Nhân 180ml",
    "Sữa Tươi Tiệt Trùng CGHL Ít Đường 180ml",
    "Sữa Gấu Nestle Lon 140ml",
    "Sữa Metis Lúa Mạch Thạch 180ml",
    "Sữa Trái Cây Metis Hương Nho 180ml",
    "Đà Lạt Milk Sữa Thanh Trùng 950ml",
    "Sữa Đậu Nành Ichiban Chai 350ml - T9",
    "Sữa Đậu Nành Ichiban Đậu Đỏ Đậu Xanh 350ml - T9",
    "Sữa Thanh Trùng DalatMilk 450ml",
    "Sữa Bắp Thanh Trùng Ladallas Chai 300ml",
    "Sữa Đậu Nành Ichiban Chai 350ml",
    "Sữa Thanh Trùng Meiji Chuối 200ml",
    "Sữa Thanh Trùng Meiji Dưa Lưới 200ml",
    "Sữa Thanh Trùng Meiji Không Lactose 200ml",
    "Sữa Thanh Trùng Dalat Milk Ít Đường 180ml",
    "Sữa Thanh Trùng Nguyên Chất Mộc Châu 450ml",
    "Sữa Thanh Trùng Lothamilk Có Đường 473ml",
  ],
};

const slugify = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const CATALOG = Object.entries(GROUPS).flatMap(([group, names], groupIndex) =>
  names.map((name, index) => ({
    id: `${groupIndex + 1}-${index + 1}`,
    name,
    group,
    image: `/products/milk/${slugify(name)}.png`,
  })),
);

const DAY = 86400000;
const formatDateInput = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
const parseDateInput = (value) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  )
    return null;
  return `${year}-${month}-${day}`;
};
const getDays = (date) =>
  Math.ceil(
    (new Date(`${date}T00:00:00`) - new Date(new Date().toDateString())) / DAY,
  );
const getState = (date) => {
  const days = getDays(date);
  if (days < 0)
    return {
      label: "Đã hết hạn",
      className: "bg-red-50 text-[#e2231a] border-red-200",
    };
  if (days <= 7)
    return {
      label: days === 0 ? "Hết hạn hôm nay" : `Còn ${days} ngày`,
      className: "bg-orange-50 text-[#dc6b0d] border-orange-200",
    };
  if (days <= 30)
    return {
      label: `Còn ${days} ngày`,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  return {
    label: "Còn hạn",
    className: "bg-emerald-50 text-[#008c45] border-emerald-200",
  };
};

export default function HanSuDung() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("Tất cả");
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [expiry, setExpiry] = useState("");
  const [tracked, setTracked] = useState([]);
  const [errors, setErrors] = useState({});
  const [overviewRange, setOverviewRange] = useState("all");
  const [overviewMonth, setOverviewMonth] = useState("");
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(true);
  const [isSelectingRows, setIsSelectingRows] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const products = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATALOG.filter(
      (p) => activeGroup === "Tất cả" || p.group === activeGroup,
    ).filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [search, activeGroup]);

  const sortedTracked = useMemo(
    () => [...tracked].sort((a, b) => new Date(a.expiry) - new Date(b.expiry)),
    [tracked],
  );
  const overviewProducts = useMemo(
    () =>
      sortedTracked.filter((item) => {
        if (overviewMonth) return item.expiry.startsWith(overviewMonth);
        if (overviewRange === "all") return true;
        return getDays(item.expiry) <= Number(overviewRange);
      }),
    [sortedTracked, overviewRange, overviewMonth],
  );
  const urgent = tracked.filter((p) => getDays(p.expiry) <= 7).length;
  const totalQuantity = tracked.reduce((sum, p) => sum + p.quantity, 0);

  const choose = (product) => {
    setSelected(product);
    setQuantity("");
    setExpiry("");
    setErrors({});
  };

  const save = (event) => {
    event.preventDefault();
    const next = {};
    const parsedExpiry = parseDateInput(expiry);
    if (!quantity || Number(quantity) <= 0)
      next.quantity = "Nhập số lượng lớn hơn 0";
    if (!expiry) next.expiry = "Nhập hạn sử dụng";
    else if (!parsedExpiry)
      next.expiry = "Ngày không hợp lệ, nhập theo dd/mm/yyyy";
    if (Object.keys(next).length) return setErrors(next);
    setTracked((current) => [
      ...current,
      {
        ...selected,
        rowId: Date.now(),
        quantity: Number(quantity),
        expiry: parsedExpiry,
      },
    ]);
    setSelected(null);
  };

  const removeTracked = (rowId) => {
    setTracked((current) => current.filter((item) => item.rowId !== rowId));
    setSelectedRows((current) => current.filter((id) => id !== rowId));
  };

  const toggleRow = (rowId) =>
    setSelectedRows((current) =>
      current.includes(rowId)
        ? current.filter((id) => id !== rowId)
        : [...current, rowId],
    );
  const exitSelectionMode = () => {
    setIsSelectingRows(false);
    setSelectedRows([]);
  };
  const deleteSelectedRows = () => {
    setTracked((current) =>
      current.filter((item) => !selectedRows.includes(item.rowId)),
    );
    exitSelectionMode();
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-3 px-3 pb-24 text-slate-900 sm:space-y-5 sm:px-4 sm:pb-10 lg:px-0">
      <header className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="flex h-2">
          <span className="flex-1 bg-[#f58220]" />
          <span className="flex-1 bg-[#008c45]" />
          <span className="flex-1 bg-[#e2231a]" />
        </div>
        <div className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-end md:justify-between lg:p-8">
          <div className="flex gap-3 sm:gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#008c45] text-white sm:h-14 sm:w-14">
              <Milk size={26} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[.2em] text-[#008c45]">
                7-Eleven · Nhóm ngành sữa
              </p>
              <h1 className="mt-1 text-2xl font-black uppercase leading-tight text-[#e2231a] sm:text-3xl md:text-4xl">
                 hạn sử dụng
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <MiniStat
              icon={PackageCheck}
              value={tracked.length}
              label="Sản phẩm đã nhập"
            />
            <MiniStat
              icon={AlertTriangle}
              value={urgent}
              label="Cần xử lý sớm"
              danger
            />
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
  {/* Thanh tiêu đề */}
  <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
    <button
      type="button"
      onClick={() => setIsProductPickerOpen((value) => !value)}
      className="flex min-w-0 flex-1 items-center gap-3 text-left"
      aria-expanded={isProductPickerOpen}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#008c45] text-white">
        <Milk size={21} />
      </span>

      <span className="min-w-0">
        <span className="block text-lg font-black uppercase">
          Danh sách sản phẩm
        </span>
      </span>
    </button>

    <button
      type="button"
      onClick={() => setIsProductPickerOpen((value) => !value)}
      aria-label={
        isProductPickerOpen
          ? 'Thu gọn danh sách sản phẩm'
          : 'Mở rộng danh sách sản phẩm'
      }
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-[#008c45] hover:bg-emerald-50 hover:text-[#008c45]"
    >
      {isProductPickerOpen ? (
        <ChevronUp size={21} />
      ) : (
        <ChevronDown size={21} />
      )}
    </button>
  </div>

  {/* Nội dung danh sách */}
  {isProductPickerOpen && (
    <div>
      {/* Tìm kiếm và lọc nhóm */}
      <div className="border-b border-slate-100 bg-slate-50/70 p-3 sm:p-5">
        <label className="relative block w-full">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none transition focus:border-[#008c45] focus:ring-4 focus:ring-emerald-50"
            placeholder="Tìm nhanh theo tên sản phẩm..."
          />
        </label>

        <div className="-mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {['Tất cả', ...Object.keys(GROUPS)].map((group) => (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              className={`shrink-0 snap-start rounded-xl border px-3.5 py-2.5 text-xs font-black transition ${
                activeGroup === group
                  ? 'border-[#008c45] bg-[#008c45] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-[#008c45]'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Không giới hạn chiều cao và không có scroll riêng */}
      <div className="grid grid-cols-2 gap-2.5 bg-[#f7f8f6] p-3 sm:gap-4 sm:p-5 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onChoose={choose}
          />
        ))}

        {products.length === 0 && (
          <div className="col-span-full grid place-items-center py-20 text-center">
            <Search size={38} className="mb-3 text-slate-300" />
            <b>Không tìm thấy sản phẩm</b>
          </div>
        )}
      </div>
    </div>
  )}
</section>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        {/* Tiêu đề và bộ lọc */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-[#008c45]">
                <BarChart3 size={21} />
              </span>

              <div>

                <h2 className="mt-1 text-xl font-black uppercase">
                  Tổng quan sản phẩm đã ghi date
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Theo dõi tất cả sản phẩm theo khoảng hạn sử dụng.
                </p>
              </div>
            </div>

            <div className="min-w-0 space-y-3 sm:flex sm:flex-wrap sm:items-end sm:gap-2 sm:space-y-0">
              {/* Lọc theo số ngày */}
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
                {[
                  ["all", "Tất cả"],
                  ["7", "≤ 7 ngày"],
                  ["30", "≤ 30 ngày"],
                  ["180", "≤ 6 tháng"],
                  ["365", "≤ 1 năm"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setOverviewRange(value);
                      setOverviewMonth("");
                    }}
                    className={`min-h-10 shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                      overviewRange === value && !overviewMonth
                        ? "bg-[#008c45] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Lọc theo tháng */}
              <label className="block sm:w-auto">
                <span className="mb-1 block text-[10px] font-black uppercase text-slate-400">
                  Chọn tháng HSD
                </span>

                <input
                  type="month"
                  value={overviewMonth}
                  onChange={(e) => {
                    setOverviewMonth(e.target.value);
                    setOverviewRange("all");
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#008c45] sm:h-10 sm:w-auto sm:text-xs"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Bảng tổng quan */}
        <div>
          <div className="grid gap-3 bg-slate-50/60 p-3 md:hidden">
            {overviewProducts.map((item) => (
              <OverviewCard
                key={item.rowId}
                item={item}
                onRemove={() => removeTracked(item.rowId)}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#f4f7f5] text-[10px] font-black uppercase tracking-[.13em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-4 py-4">Nhóm</th>
                <th className="px-4 py-4 text-center">Số lượng</th>
                <th className="px-4 py-4">Hạn sử dụng</th>
                <th className="px-4 py-4">Trạng thái</th>
                <th className="px-4 py-4 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {overviewProducts.map((item) => (
                <OverviewRow
                  key={item.rowId}
                  item={item}
                  onRemove={() => removeTracked(item.rowId)}
                />
              ))}
            </tbody>
          </table>
          </div>

          {overviewProducts.length === 0 && (
            <div className="grid place-items-center py-14 text-center">
              <Clock3 size={38} className="mb-3 text-slate-200" />

              <p className="font-black text-slate-500">
                Không có sản phẩm trong mốc đã chọn
              </p>

              <button
                type="button"
                onClick={() => {
                  setOverviewRange("all");
                  setOverviewMonth("");
                }}
                className="mt-2 text-xs font-black text-[#008c45]"
              >
                Xem tất cả
              </button>
            </div>
          )}
        </div>

        {/* Thống kê cuối bảng */}
        <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-5 sm:py-4">
          <span>
            Hiển thị <b className="text-slate-800">{overviewProducts.length}</b>{" "}
            sản phẩm
          </span>

          <span>
            Tổng số lượng:{" "}
            <b className="text-[#008c45]">
              {overviewProducts.reduce((sum, item) => sum + item.quantity, 0)}
            </b>
          </span>
        </div>
      </section>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <form
            onSubmit={save}
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-white shadow-2xl sm:rounded-[26px]"
          >
            <div className="flex h-1.5">
              <i className="flex-1 bg-[#f58220]" />
              <i className="flex-1 bg-[#008c45]" />
              <i className="flex-1 bg-[#e2231a]" />
            </div>
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
              <div className="flex items-start gap-3 sm:gap-4">
                <ProductImage
                  product={selected}
                  className="h-20 w-20 shrink-0 rounded-2xl border sm:h-24 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-[#008c45]">
                    Nhập thông tin
                  </p>
                  <h3 className="mt-1 line-clamp-3 text-base font-black leading-tight sm:text-xl">
                    {selected.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400">
                    {selected.group}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100"
                >
                  <X size={17} />
                </button>
              </div>
              <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2">
                <Field label="Số lượng *" error={errors.quantity}>
                  <input
                    autoFocus
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setErrors((x) => ({ ...x, quantity: "" }));
                    }}
                    className={inputClass(errors.quantity)}
                    placeholder="0"
                  />
                </Field>
                <Field label="Hạn sử dụng *" error={errors.expiry}>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={expiry}
                    onChange={(e) => {
                      setExpiry(formatDateInput(e.target.value));
                      setErrors((x) => ({ ...x, expiry: "" }));
                    }}
                    className={inputClass(errors.expiry)}
                    placeholder="dd/mm/yyyy"
                  />
                </Field>
              </div>
              <button className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#008c45] py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-100 sm:mt-6">
                <Check size={18} /> Xác nhận nhập HSD
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onChoose }) {
  return (
    <button
      type="button"
      onClick={() => onChoose(product)}
      aria-label={`Nhập thông tin ${product.name}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-[16px] border border-slate-200 bg-white text-left transition duration-200 active:scale-[.98] sm:rounded-[18px] sm:hover:-translate-y-1 sm:hover:border-[#008c45] sm:hover:shadow-[0_14px_35px_rgba(0,140,69,.14)] focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {/* Hình sản phẩm */}
      <div className="m-2 mb-0 aspect-square overflow-hidden rounded-[12px] bg-gradient-to-br from-white to-slate-100 p-2 sm:m-3 sm:mb-0 sm:rounded-[14px] sm:p-3">
        <ProductImage
          product={product}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />
      </div>

      {/* Chỉ hiển thị tên sản phẩm */}
      <div className="p-2.5 sm:p-3.5">
        <p className="line-clamp-3 min-h-[3.5rem] text-center text-xs font-black leading-[1.35] text-slate-800 transition group-hover:text-[#008c45] sm:line-clamp-2 sm:min-h-11 sm:text-sm">
          {product.name}
        </p>
      </div>
    </button>
  );
}

function OverviewCard({ item, onRemove }) {
  const state = getState(item.expiry);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <ProductImage
          product={item}
          className="h-16 w-16 shrink-0 rounded-xl bg-slate-50"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-black leading-5">{item.name}</p>
          <p className="mt-1 truncate text-[11px] font-bold text-slate-400">
            {item.group}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-[#e2231a] active:scale-95"
          aria-label={`Xóa ${item.name}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
        <div>
          <span className="block text-[10px] font-black uppercase text-slate-400">Hạn sử dụng</span>
          <b className="mt-1 block text-sm">
            {new Date(`${item.expiry}T00:00:00`).toLocaleDateString("vi-VN")}
          </b>
        </div>
        <div className="text-right">
          <span className="block text-[10px] font-black uppercase text-slate-400">Số lượng</span>
          <b className="mt-1 block text-lg text-[#008c45]">{item.quantity}</b>
        </div>
      </div>
      <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${state.className}`}>
        {state.label}
      </span>
    </article>
  );
}

function TodayCard({ item, onRemove }) {
  const state = getState(item.expiry);
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/30">
      <ProductImage
        product={item}
        className="h-20 w-20 shrink-0 rounded-xl bg-slate-50"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-black leading-5">{item.name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black">
            SL {item.quantity}
          </span>
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-black ${state.className}`}
          >
            {state.label}
          </span>
        </div>
        <p className="mt-2 text-[11px] font-bold text-slate-400">
          HSD {new Date(`${item.expiry}T00:00:00`).toLocaleDateString("vi-VN")}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function OverviewRow({ item, selecting, selected, onToggle, onRemove }) {
  const state = getState(item.expiry);
  return (
    <tr
      onClick={selecting ? onToggle : undefined}
      className={`border-t border-slate-100 transition ${selecting ? "cursor-pointer" : ""} ${selected ? "bg-red-50/70" : "hover:bg-slate-50"}`}
    >
      {selecting && (
        <td className="px-4 py-4">
          {selected ? (
            <CheckSquare2 size={19} className="text-[#e2231a]" />
          ) : (
            <Square size={19} className="text-slate-300" />
          )}
        </td>
      )}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <ProductImage
            product={item}
            className="h-12 w-12 shrink-0 rounded-xl bg-slate-50"
          />
          <b>{item.name}</b>
        </div>
      </td>
      <td className="px-4 py-4 text-slate-500">{item.group}</td>
      <td className="px-4 py-4 text-center text-lg font-black">
        {item.quantity}
      </td>
      <td className="px-4 py-4 font-black">
        {new Date(`${item.expiry}T00:00:00`).toLocaleDateString("vi-VN")}
      </td>
      <td className="px-4 py-4">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${state.className}`}
        >
          {state.label}
        </span>
      </td>
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          className="inline-grid h-9 w-9 place-items-center rounded-xl border border-red-100 text-red-400 transition hover:bg-red-50 hover:text-[#e2231a]"
          aria-label={`Xóa ${item.name}`}
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

function ProductImage({ product, className }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-emerald-50 to-orange-50 text-slate-300 ${className}`}
      >
        <div className="text-center">
          <ImageOff className="mx-auto" size={24} />
          <span className="mt-1 block text-[8px] font-bold">THÊM ẢNH</span>
        </div>
      </div>
    );
  return (
    <img
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-contain ${className}`}
    />
  );
}

function MiniStat({ icon: Icon, value, label, danger }) {
  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 sm:min-w-32 ${danger ? "border-red-100 bg-red-50" : "border-emerald-100 bg-emerald-50"}`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={16}
          className={danger ? "text-[#e2231a]" : "text-[#008c45]"}
        />
        <b className="text-xl">{value}</b>
      </div>
      <p className="mt-1 text-[10px] font-bold text-slate-500">{label}</p>
    </div>
  );
}
function Field({ label, error, children }) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase text-slate-600">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs font-bold text-red-500">
          {error}
        </span>
      )}
    </label>
  );
}
const inputClass = (error) =>
  `h-12 w-full rounded-xl border bg-slate-50 px-4 text-sm font-bold outline-none focus:ring-4 ${error ? "border-red-300 focus:ring-red-50" : "border-slate-200 focus:border-[#008c45] focus:ring-emerald-50"}`;
