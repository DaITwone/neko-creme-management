import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Eraser,
  AlertTriangle,
  Paintbrush,
  Plus,
  Printer,
  Trash2,
  UserPlus,
  Users,
  WandSparkles,
  X,
} from "lucide-react";

const DEFAULT_SHIFTS = [
  {
    id: "morning1",
    name: "Sáng 01",
    time: "06:30–13:30",
    abbr: "6:30–13:30",
    solid: "bg-[#D28A5A]",
    border: "border-[#D28A5A]",
    light: "bg-[#FFF2E8]",
    text: "text-[#7A3F28]",
    ring: "ring-[#D28A5A]",
  },
  {
    id: "morning2",
    name: "Sáng 02",
    time: "07:30–13:30",
    abbr: "7:30–13:30",
    solid: "bg-[#C9A15E]",
    border: "border-[#C9A15E]",
    light: "bg-[#FBF3E4]",
    text: "text-[#7A5C24]",
    ring: "ring-[#C9A15E]",
  },
  {
    id: "afternoon",
    name: "Chiều",
    time: "13:30–18:30",
    abbr: "13:30–18:30",
    solid: "bg-[#DF8581]",
    border: "border-[#DF8581]",
    light: "bg-[#FFF0F0]",
    text: "text-[#9C4C49]",
    ring: "ring-[#DF8581]",
  },
  {
    id: "night",
    name: "Tối",
    time: "18:00–23:00",
    abbr: "18–23",
    solid: "bg-[#542B1C]",
    border: "border-[#542B1C]",
    light: "bg-[#F7EEE9]",
    text: "text-[#542B1C]",
    ring: "ring-[#542B1C]",
  },
];

const DEFAULT_REQUIREMENTS = {
  morning1: 1,
  afternoon: 1,
  night: 1,
  office: 0,
};

// Mỗi nhân viên luôn có ít nhất một ngày không bị xếp ca trong tuần.
const MAX_SHIFTS_PER_WEEK = 6;
const MAX_SHIFTS_PER_DAY = 2;

const CUSTOM_SHIFT_STYLES = [
  {
    solid: "bg-violet-600",
    border: "border-violet-600",
    light: "bg-violet-50",
    text: "text-violet-700",
    ring: "ring-violet-500",
  },
  {
    solid: "bg-cyan-600",
    border: "border-cyan-600",
    light: "bg-cyan-50",
    text: "text-cyan-700",
    ring: "ring-cyan-500",
  },
  {
    solid: "bg-pink-600",
    border: "border-pink-600",
    light: "bg-pink-50",
    text: "text-pink-700",
    ring: "ring-pink-500",
  },
];

function parseStartHour(timeRange) {
  const [start] = timeRange.split("–");
  return parseInt(start.split(":")[0], 10);
}

// Printed schedules should read top-to-bottom by actual work time, not by
// whatever order shifts happen to be defined/edited in.
const EMPLOYEE_TYPES = {
  fulltime: {
    label: "Full-time",
    abbr: "FT",
    chip: "bg-[#542B1C] text-white",
  },
  parttime: {
    label: "Part-time",
    abbr: "PT",
    chip: "bg-[#D28A5A] text-white",
  },
};

const initialEmployees = [
  { id: 1, name: "Du", type: "parttime" },
  { id: 2, name: "Nhi", type: "parttime" },
  { id: 3, name: "Trâm", type: "parttime" },
  { id: 4, name: "Trúc", type: "parttime" },
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  const difference = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + difference);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getWeekDates(date) {
  const firstDay = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(firstDay, index));
}

function cellKey(employeeId, dateKey) {
  return `${employeeId}::${dateKey}`;
}

// Tương thích cả dữ liệu cũ (một chuỗi) và dữ liệu mới (mảng nhiều ca).
function getAssignedShiftIds(assignments, employeeId, dateKey) {
  const value = assignments[cellKey(employeeId, dateKey)];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// Seed a couple of weeks so the "sao chép tuần trước" action has something
// real to demonstrate on first load.
function buildInitialAssignments() {
  return {};
}

// Demo dữ liệu "lịch rảnh" mà các bạn part-time gửi tối thứ 6 cho tuần này,
// để minh hoạ tính năng — mỗi ô là danh sách ca họ có thể làm hôm đó.
function buildInitialAvailability() {
  return {};
}

export default function PhanCongCa() {
  const [weekAnchor, setWeekAnchor] = useState(new Date(2026, 7, 31));
  const [employees, setEmployees] = useState(initialEmployees);
  const [assignments, setAssignments] = useState(buildInitialAssignments);
  const [availability, setAvailability] = useState(buildInitialAvailability);
  const [offDays, setOffDays] = useState({});
  const [shifts, setShifts] = useState(DEFAULT_SHIFTS);
  const [requirements, setRequirements] = useState(DEFAULT_REQUIREMENTS);
  const [shiftFormOpen, setShiftFormOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("19:00");
  const [newShiftEnd, setNewShiftEnd] = useState("01:00");

  const [activePenId, setActivePenId] = useState(null);
  const [isPainting, setIsPainting] = useState(false);
  const paintModeRef = useRef("assign");

  const [quickName, setQuickName] = useState("");
  const [quickType, setQuickType] = useState("fulltime");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkType, setBulkType] = useState("parttime");
  const [availabilityOpen, setAvailabilityOpen] = useState(true);
  const [offDaysOpen, setOffDaysOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const todayKey = formatDateKey(new Date());

  const weekDates = useMemo(() => getWeekDates(weekAnchor), [weekAnchor]);
  const weekDateKeys = useMemo(() => weekDates.map(formatDateKey), [weekDates]);
  const shiftById = useMemo(
    () => Object.fromEntries(shifts.map((shift) => [shift.id, shift])),
    [shifts],
  );
  const shiftsByStartHour = useMemo(
    () =>
      [...shifts].sort(
        (a, b) => parseStartHour(a.time) - parseStartHour(b.time),
      ),
    [shifts],
  );

  const partTimeEmployees = useMemo(
    () => employees.filter((employee) => employee.type === "parttime"),
    [employees],
  );
  const fullTimeEmployees = useMemo(
    () => employees.filter((employee) => employee.type !== "parttime"),
    [employees],
  );

  const weekLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];

    const formatDayMonth = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${day}.${month}`;
    };

    return `${formatDayMonth(first)} - ${formatDayMonth(last)}`;
  }, [weekDates]);

  useEffect(() => {
    function stopPainting() {
      setIsPainting(false);
    }
    window.addEventListener("mouseup", stopPainting);
    window.addEventListener("touchend", stopPainting);
    window.addEventListener("pointerup", stopPainting);
    return () => {
      window.removeEventListener("mouseup", stopPainting);
      window.removeEventListener("touchend", stopPainting);
      window.removeEventListener("pointerup", stopPainting);
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  // ---- derived stats ----------------------------------------------------

  const weeklyCountByEmployee = useMemo(() => {
    const counts = {};
    employees.forEach((employee) => {
      counts[employee.id] = weekDateKeys.reduce(
        (total, dateKey) =>
          total + getAssignedShiftIds(assignments, employee.id, dateKey).length,
        0,
      );
    });
    return counts;
  }, [assignments, employees, weekDateKeys]);

  const weeklyAvailabilityByEmployee = useMemo(() => {
    const counts = {};
    partTimeEmployees.forEach((employee) => {
      counts[employee.id] = 0;
    });
    weekDateKeys.forEach((dateKey) => {
      partTimeEmployees.forEach((employee) => {
        const entries = availability[cellKey(employee.id, dateKey)];
        if (entries && entries.length) counts[employee.id] += 1;
      });
    });
    return counts;
  }, [availability, partTimeEmployees, weekDateKeys]);

  const headcountByDate = useMemo(() => {
    const counts = {};
    weekDateKeys.forEach((dateKey) => {
      counts[dateKey] = employees.filter((employee) =>
        Boolean(getAssignedShiftIds(assignments, employee.id, dateKey).length),
      ).length;
    });
    return counts;
  }, [assignments, employees, weekDateKeys]);

  const coverageByDateAndShift = useMemo(() => {
    const coverage = {};
    weekDateKeys.forEach((dateKey) => {
      coverage[dateKey] = {};
      shifts.forEach((shift) => {
        coverage[dateKey][shift.id] = employees.filter((employee) =>
          getAssignedShiftIds(assignments, employee.id, dateKey).includes(
            shift.id,
          ),
        ).length;
      });
    });
    return coverage;
  }, [assignments, employees, weekDateKeys]);

  const totalAssignedThisWeek = useMemo(
    () => Object.values(weeklyCountByEmployee).reduce((a, b) => a + b, 0),
    [weeklyCountByEmployee],
  );

  const uncoveredShiftCount = useMemo(
    () =>
      weekDateKeys.reduce(
        (total, dateKey) =>
          total +
          shifts.filter(
            (shift) =>
              coverageByDateAndShift[dateKey][shift.id] <
              requirements[shift.id],
          ).length,
        0,
      ),
    [coverageByDateAndShift, requirements, weekDateKeys],
  );

  const scheduleWarnings = useMemo(() => {
    const warnings = [];
    employees.forEach((employee) => {
      const count = weeklyCountByEmployee[employee.id] || 0;
      if (count > MAX_SHIFTS_PER_WEEK) {
        warnings.push(
          `${employee.name}: ${count} ca (vượt ${MAX_SHIFTS_PER_WEEK})`,
        );
      }

      weekDateKeys.forEach((dateKey) => {
        const dailyShifts = getAssignedShiftIds(
          assignments,
          employee.id,
          dateKey,
        );
        if (dailyShifts.length > MAX_SHIFTS_PER_DAY) {
          warnings.push(
            `${employee.name}: ${dailyShifts.length} ca/ngày (vượt ${MAX_SHIFTS_PER_DAY})`,
          );
        }
      });

      for (let dayIndex = 1; dayIndex < weekDateKeys.length; dayIndex += 1) {
        const yesterday = getAssignedShiftIds(
          assignments,
          employee.id,
          weekDateKeys[dayIndex - 1],
        );
        const today = getAssignedShiftIds(
          assignments,
          employee.id,
          weekDateKeys[dayIndex],
        );
        if (yesterday.includes("night") && today.includes("morning")) {
          warnings.push(`${employee.name}: ca đêm → ca sáng liền nhau`);
        }
      }
    });
    return warnings;
  }, [assignments, employees, weekDateKeys, weeklyCountByEmployee]);

  // ---- assignment mutations ----------------------------------------------

  const updateCellShift = (employeeId, dateKey, shiftId, mode = "toggle") => {
    const key = cellKey(employeeId, dateKey);
    setAssignments((current) => {
      const currentShiftIds = getAssignedShiftIds(current, employeeId, dateKey);
      let nextShiftIds = currentShiftIds;

      if (mode === "clear") {
        nextShiftIds = [];
      } else if (mode === "remove") {
        nextShiftIds = currentShiftIds.filter((id) => id !== shiftId);
      } else if (mode === "add") {
        if (currentShiftIds.includes(shiftId)) return current;
        if (currentShiftIds.length >= MAX_SHIFTS_PER_DAY) return current;
        nextShiftIds = [...currentShiftIds, shiftId];
      } else if (currentShiftIds.includes(shiftId)) {
        nextShiftIds = currentShiftIds.filter((id) => id !== shiftId);
      } else {
        if (currentShiftIds.length >= MAX_SHIFTS_PER_DAY) {
          showToast(`Mỗi nhân viên tối đa ${MAX_SHIFTS_PER_DAY} ca/ngày`);
          return current;
        }
        nextShiftIds = [...currentShiftIds, shiftId];
      }

      const next = { ...current };
      if (nextShiftIds.length) {
        next[key] = nextShiftIds;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const handleCellDown = (employeeId, dateKey) => (event) => {
    event.preventDefault();

    if (!activePenId) {
      showToast("Chọn một ca ở phía trên trước khi tô");
      return;
    }

    const isEraser = activePenId === "eraser";
    const currentShiftIds = getAssignedShiftIds(
      assignments,
      employeeId,
      dateKey,
    );
    const mode = isEraser
      ? "clear"
      : currentShiftIds.includes(activePenId)
        ? "remove"
        : "add";

    paintModeRef.current = mode;
    setIsPainting(true);
    updateCellShift(employeeId, dateKey, activePenId, mode);
  };

  const handleCellEnter = (employeeId, dateKey) => () => {
    if (!isPainting || !activePenId) return;
    const mode = paintModeRef.current;
    updateCellShift(employeeId, dateKey, activePenId, mode);
  };

  const removeSingleShift = (employeeId, dateKey, shiftId) => (event) => {
    event.stopPropagation();
    updateCellShift(employeeId, dateKey, shiftId, "remove");
  };

  const fillRow = (employeeId) => {
    if (!activePenId) {
      showToast("Chọn một ca ở phía trên trước khi tô cả dòng");
      return;
    }
    setAssignments((current) => {
      const next = { ...current };
      weekDateKeys.forEach((dateKey) => {
        const key = cellKey(employeeId, dateKey);
        if (activePenId === "eraser") {
          delete next[key];
          return;
        }
        const currentShiftIds = getAssignedShiftIds(
          current,
          employeeId,
          dateKey,
        );
        if (
          !currentShiftIds.includes(activePenId) &&
          currentShiftIds.length < MAX_SHIFTS_PER_DAY
        ) {
          next[key] = [...currentShiftIds, activePenId];
        }
      });
      return next;
    });
  };

  const fillColumn = (dateKey) => {
    if (!activePenId) {
      showToast("Chọn một ca ở phía trên trước khi tô cả cột");
      return;
    }
    setAssignments((current) => {
      const next = { ...current };
      employees.forEach((employee) => {
        const key = cellKey(employee.id, dateKey);
        if (activePenId === "eraser") {
          delete next[key];
          return;
        }
        const currentShiftIds = getAssignedShiftIds(
          current,
          employee.id,
          dateKey,
        );
        if (
          !currentShiftIds.includes(activePenId) &&
          currentShiftIds.length < MAX_SHIFTS_PER_DAY
        ) {
          next[key] = [...currentShiftIds, activePenId];
        }
      });
      return next;
    });
  };

  const copyPreviousWeek = () => {
    const prevDateKeys = weekDates.map((date) =>
      formatDateKey(addDays(date, -7)),
    );
    setAssignments((current) => {
      const next = { ...current };
      let copied = 0;
      employees.forEach((employee) => {
        prevDateKeys.forEach((prevDateKey, index) => {
          const prevShiftIds = getAssignedShiftIds(
            current,
            employee.id,
            prevDateKey,
          );
          if (prevShiftIds.length) {
            next[cellKey(employee.id, weekDateKeys[index])] = [...prevShiftIds];
            copied += prevShiftIds.length;
          }
        });
      });
      showToast(
        copied > 0
          ? `Đã sao chép ${copied} ca từ tuần trước`
          : "Tuần trước chưa có ca nào để sao chép",
      );
      return next;
    });
  };

  const clearWeek = () => {
    setAssignments((current) => {
      const next = { ...current };
      employees.forEach((employee) => {
        weekDateKeys.forEach((dateKey) => {
          delete next[cellKey(employee.id, dateKey)];
        });
      });
      return next;
    });
    showToast("Đã xóa toàn bộ lịch tuần này");
  };

  const updateRequirement = (shiftId, value) => {
    const nextValue = Math.max(
      0,
      Math.min(employees.length, Number(value) || 0),
    );
    setRequirements((current) => ({ ...current, [shiftId]: nextValue }));
  };

  const addCustomShift = () => {
    const name = newShiftName.trim();
    if (!name || !newShiftStart || !newShiftEnd) {
      showToast("Nhập đủ tên, giờ bắt đầu và giờ kết thúc của ca");
      return;
    }
    const id = `custom-${Date.now()}`;
    const style =
      CUSTOM_SHIFT_STYLES[
        shifts.filter((shift) => shift.id.startsWith("custom-")).length %
          CUSTOM_SHIFT_STYLES.length
      ];
    const shortStart = newShiftStart.replace(":00", "").replace(/^0/, "");
    const shortEnd = newShiftEnd.replace(":00", "").replace(/^0/, "");
    setShifts((current) => [
      ...current,
      {
        id,
        name,
        time: `${newShiftStart}–${newShiftEnd}`,
        abbr: `${shortStart}–${shortEnd}`,
        ...style,
      },
    ]);
    setRequirements((current) => ({ ...current, [id]: 0 }));
    setNewShiftName("");
    setShiftFormOpen(false);
    showToast(`Đã thêm ca ${name} (${newShiftStart}–${newShiftEnd})`);
  };

  const toggleOffDay = (employeeId, dateKey) => {
    const key = cellKey(employeeId, dateKey);
    setOffDays((current) => {
      const next = { ...current };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  // ---- part-time availability (nhận tối thứ 6 hàng tuần) -----------------

  const toggleAvailability = (employeeId, dateKey, shiftId) => {
    const key = cellKey(employeeId, dateKey);
    setAvailability((current) => {
      const existing = current[key] || [];
      const next = existing.includes(shiftId)
        ? existing.filter((id) => id !== shiftId)
        : [...existing, shiftId];
      const nextMap = { ...current };
      if (next.length) nextMap[key] = next;
      else delete nextMap[key];
      return nextMap;
    });
  };

  const copyPreviousWeekAvailability = () => {
    const prevDateKeys = weekDates.map((date) =>
      formatDateKey(addDays(date, -7)),
    );
    setAvailability((current) => {
      const next = { ...current };
      let copied = 0;
      partTimeEmployees.forEach((employee) => {
        prevDateKeys.forEach((prevDateKey, index) => {
          const prevValue = current[cellKey(employee.id, prevDateKey)];
          if (prevValue && prevValue.length) {
            next[cellKey(employee.id, weekDateKeys[index])] = prevValue;
            copied += 1;
          }
        });
      });
      showToast(
        copied > 0
          ? `Đã sao chép lịch rảnh của ${copied} lượt từ tuần trước`
          : "Tuần trước chưa có lịch rảnh để sao chép",
      );
      return next;
    });
  };

  const clearWeekAvailability = () => {
    setAvailability((current) => {
      const next = { ...current };
      partTimeEmployees.forEach((employee) => {
        weekDateKeys.forEach((dateKey) => {
          delete next[cellKey(employee.id, dateKey)];
        });
      });
      return next;
    });
    showToast("Đã xóa lịch rảnh part-time của tuần này");
  };

  // ---- auto scheduling: tôn trọng lịch rảnh/ngày off và chia đều toàn tuần ----

  const autoSchedule = () => {
    if (!employees.length) {
      showToast("Hãy thêm nhân viên trước khi tự xếp lịch");
      return;
    }

    setAssignments((current) => {
      const next = { ...current };
      const counts = Object.fromEntries(
        employees.map((employee) => [employee.id, 0]),
      );
      const nightCounts = Object.fromEntries(
        employees.map((employee) => [employee.id, 0]),
      );
      let unfilled = 0;
      let filledFromAvailability = 0;
      let filledFlexiblePartTime = 0;

      // Chỉ làm mới tuần đang xem; dữ liệu các tuần khác được giữ nguyên.
      employees.forEach((employee) => {
        weekDateKeys.forEach((dateKey) => {
          delete next[cellKey(employee.id, dateKey)];
        });
      });

      const canWorkMorningAfterNight = (employeeId, dayIndex, shiftId) => {
        if (shiftId !== "morning" || dayIndex === 0) return true;
        const previousDateKey = weekDateKeys[dayIndex - 1];
        return !getAssignedShiftIds(next, employeeId, previousDateKey).includes(
          "night",
        );
      };

      const pickBest = (candidates, shiftId) =>
        [...candidates].sort((a, b) => {
          if (shiftId === "night") {
            const nightDifference = nightCounts[a.id] - nightCounts[b.id];
            if (nightDifference !== 0) return nightDifference;
          }
          const workloadDifference = counts[a.id] - counts[b.id];
          if (workloadDifference !== 0) return workloadDifference;
          return String(a.name).localeCompare(String(b.name), "vi");
        })[0];

      const assign = (employee, dateKey, shiftId) => {
        const key = cellKey(employee.id, dateKey);
        const currentShiftIds = getAssignedShiftIds(next, employee.id, dateKey);
        next[key] = [...currentShiftIds, shiftId];
        counts[employee.id] += 1;
        if (shiftId === "night") nightCounts[employee.id] += 1;
      };

      // Chỉ khi PT đã khai báo ít nhất một ô trong tuần thì lịch rảnh mới là
      // ràng buộc. Không khai báo gì nghĩa là linh hoạt, không phải nghỉ cả tuần.
      const partTimeHasSubmittedAvailability = Object.fromEntries(
        partTimeEmployees.map((employee) => [
          employee.id,
          weekDateKeys.some(
            (dateKey) =>
              (availability[cellKey(employee.id, dateKey)] || []).length > 0,
          ),
        ]),
      );

      // Nếu quản lý không chọn ngày off, phân bổ ngày nghỉ tự động rải đều
      // từ thứ Hai đến Chủ nhật. Nhờ vậy nhân viên không cùng chạm giới hạn
      // 6 ca vào thứ Bảy và làm Chủ nhật bị bỏ trống.
      const effectiveOffDayByEmployee = {};
      employees.forEach((employee, employeeIndex) => {
        const selectedOffDate = weekDateKeys.find(
          (dateKey) => offDays[cellKey(employee.id, dateKey)],
        );
        if (selectedOffDate) {
          effectiveOffDayByEmployee[employee.id] = selectedOffDate;
          return;
        }

        // Với PT đã báo lịch rảnh, ưu tiên chọn một ngày họ vốn không đăng ký.
        const unavailableDate =
          employee.type === "parttime" &&
          partTimeHasSubmittedAvailability[employee.id]
            ? weekDateKeys.find(
                (dateKey) =>
                  !(availability[cellKey(employee.id, dateKey)] || []).length,
              )
            : null;
        effectiveOffDayByEmployee[employee.id] =
          unavailableDate || weekDateKeys[employeeIndex % weekDateKeys.length];
      });

      const isEmployeeOff = (employeeId, dateKey) =>
        effectiveOffDayByEmployee[employeeId] === dateKey ||
        Boolean(offDays[cellKey(employeeId, dateKey)]);

      // Ca đêm xếp trước, các ca còn lại theo giờ bắt đầu. Áp dụng được cả ca mới.
      const schedulingOrder = [...shifts]
        .sort((a, b) => {
          if (a.id === "night") return -1;
          if (b.id === "night") return 1;
          return parseStartHour(a.time) - parseStartHour(b.time);
        })
        .map((shift) => shift.id);

      weekDateKeys.forEach((dateKey, dayIndex) => {
        schedulingOrder.forEach((shiftId) => {
          let remaining = requirements[shiftId] || 0;

          // Bước 1 — ưu tiên nhân viên part-time đã báo rảnh đúng ca/ngày này.
          while (remaining > 0) {
            const candidates = partTimeEmployees.filter((employee) => {
              const dailyShiftIds = getAssignedShiftIds(
                next,
                employee.id,
                dateKey,
              );
              if (dailyShiftIds.includes(shiftId)) return false;
              if (dailyShiftIds.length >= MAX_SHIFTS_PER_DAY) return false;
              if (isEmployeeOff(employee.id, dateKey)) return false;
              if (counts[employee.id] >= MAX_SHIFTS_PER_WEEK) return false;
              if (!canWorkMorningAfterNight(employee.id, dayIndex, shiftId)) {
                return false;
              }
              if (!partTimeHasSubmittedAvailability[employee.id]) return true;
              const available =
                availability[cellKey(employee.id, dateKey)] || [];
              return available.includes(shiftId);
            });
            const selected = pickBest(candidates, shiftId);
            if (!selected) break;
            assign(selected, dateKey, shiftId);
            if (partTimeHasSubmittedAvailability[selected.id]) {
              filledFromAvailability += 1;
            } else {
              filledFlexiblePartTime += 1;
            }
            remaining -= 1;
          }

          // Bước 2 — dùng nhân viên full-time lấp các ca part-time chưa đủ người.
          while (remaining > 0) {
            const candidates = fullTimeEmployees.filter((employee) => {
              const dailyShiftIds = getAssignedShiftIds(
                next,
                employee.id,
                dateKey,
              );
              if (dailyShiftIds.includes(shiftId)) return false;
              if (dailyShiftIds.length >= MAX_SHIFTS_PER_DAY) return false;
              if (isEmployeeOff(employee.id, dateKey)) return false;
              if (counts[employee.id] >= MAX_SHIFTS_PER_WEEK) return false;
              if (!canWorkMorningAfterNight(employee.id, dayIndex, shiftId)) {
                return false;
              }
              return true;
            });
            const selected = pickBest(candidates, shiftId);
            if (!selected) {
              unfilled += remaining;
              remaining = 0;
              break;
            }
            assign(selected, dateKey, shiftId);
            remaining -= 1;
          }
        });
      });

      setTimeout(() => {
        showToast(
          unfilled
            ? `Đã xếp đủ 7 ngày theo khả năng hiện có — vẫn thiếu ${unfilled} vị trí. PT linh hoạt: ${filledFlexiblePartTime} ca, PT theo lịch rảnh: ${filledFromAvailability} ca.`
            : `Đã xếp đủ 7 ngày, mỗi người tối đa ${MAX_SHIFTS_PER_WEEK} ca/tuần và ${MAX_SHIFTS_PER_DAY} ca/ngày. PT linh hoạt: ${filledFlexiblePartTime} ca, PT theo lịch rảnh: ${filledFromAvailability} ca.`,
        );
      }, 0);
      return next;
    });
  };

  // ---- employee management ------------------------------------------------

  const addEmployee = (name, type) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEmployees((current) => [
      ...current,
      { id: Date.now() + Math.random(), name: trimmed, type },
    ]);
  };

  const addQuickEmployee = () => {
    addEmployee(quickName, quickType);
    setQuickName("");
  };

  const addBulkEmployees = () => {
    const names = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!names.length) return;

    setEmployees((current) => [
      ...current,
      ...names.map((name, index) => ({
        id: Date.now() + index + Math.random(),
        name,
        type: bulkType,
      })),
    ]);
    showToast(`Đã thêm ${names.length} nhân viên`);
    setBulkText("");
    setBulkOpen(false);
  };

  const toggleEmployeeType = (employeeId) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              type: employee.type === "parttime" ? "fulltime" : "parttime",
            }
          : employee,
      ),
    );
  };

  const removeEmployee = (employeeId) => {
    setEmployees((current) =>
      current.filter((employee) => employee.id !== employeeId),
    );
    setAssignments((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        if (!key.startsWith(`${employeeId}::`)) next[key] = value;
      });
      return next;
    });
    setAvailability((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        if (!key.startsWith(`${employeeId}::`)) next[key] = value;
      });
      return next;
    });
    setOffDays((current) => {
      const next = {};
      Object.entries(current).forEach(([key, value]) => {
        if (!key.startsWith(`${employeeId}::`)) next[key] = value;
      });
      return next;
    });
  };

  const navigateWeek = (direction) => {
    setWeekAnchor((date) => addDays(date, direction * 7));
  };

  const selectWeekFromDate = (value) => {
    if (!value) return;
    const [year, month, day] = value.split("-").map(Number);
    setWeekAnchor(new Date(year, month - 1, day));
  };

  const goToCurrentWeek = () => setWeekAnchor(new Date());

  const weekNavigator = (accent = "emerald") => {
    const themes = {
      sky: {
        border: "border-sky-300 hover:border-sky-600",
        text: "text-sky-700",
        current: "border-sky-600 text-sky-700 hover:bg-sky-50",
      },
      orange: {
        border: "border-[#F0D2BF] hover:border-[#D28A5A]",
        text: "text-[#A75D39]",
        current: "border-[#D28A5A] text-[#A75D39] hover:bg-[#FFF3EA]",
      },
      emerald: {
        border: "border-[#E6CFC0] hover:border-[#542B1C]",
        text: "text-[#6A3826]",
        current: "border-[#542B1C] text-[#6A3826] hover:bg-[#FAF3EE]",
      },
    };
    const theme = themes[accent] || themes.emerald;

    return (
      <div className="grid w-full grid-cols-[44px_minmax(145px,1fr)_44px] items-center gap-2 sm:w-auto">
        <button
          type="button"
          aria-label="Tuần trước"
          title="Tuần trước"
          onClick={() => navigateWeek(-1)}
          className={`grid h-11 w-11 place-items-center rounded-lg border-2 bg-white text-slate-500 transition ${theme.border} ${theme.text}`}
        >
          <ChevronLeft size={18} />
        </button>

        <div className="grid min-w-0 grid-cols-[1fr_auto] overflow-hidden rounded-lg border-2 border-slate-200 bg-white">
          <label className="min-w-0 px-3 py-1">
            <span className="block text-[8px] font-black uppercase tracking-wide text-slate-400">
              Chọn tuần
            </span>
            <input
              type="date"
              value={formatDateKey(weekDates[0])}
              onChange={(event) => selectWeekFromDate(event.target.value)}
              className="block h-6 w-full min-w-0 bg-transparent text-[11px] font-black text-slate-700 outline-none"
            />
          </label>
        </div>

        <button
          type="button"
          aria-label="Tuần sau"
          title="Tuần sau"
          onClick={() => navigateWeek(1)}
          className={`grid h-11 w-11 place-items-center rounded-lg border-2 bg-white text-slate-500 transition ${theme.border} ${theme.text}`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        :root {
          --neko-brown: #542B1C;
          --neko-brown-soft: #70402D;
          --neko-cream: #FBF6F1;
          --neko-peach: #D28A5A;
          --neko-pink: #DF8581;
        }
        @media screen {
          body { background: var(--neko-cream); }
        }
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="mx-auto max-w-[1500px] select-none px-3 pb-24 no-print sm:px-4 sm:pb-10 lg:px-0">
        {/* Header */}
        <header className="mb-3 overflow-hidden rounded-[20px] border border-[#E7D2C5] bg-[#FFFCFA] shadow-sm sm:mb-6 sm:rounded-[24px]">
          <div className="flex">
            <span className="h-2 flex-1 bg-[#542B1C]" />
            <span className="h-2 flex-1 bg-[#D28A5A]" />
            <span className="h-2 flex-1 bg-[#DF8581]" />
          </div>

          <div className="flex flex-wrap items-center gap-3 p-4 sm:gap-5 sm:p-6">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#542B1C] text-white sm:h-16 sm:w-16">
              <CalendarDays size={26} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#6A3826]">
                Neko Crème · Store planner
              </p>
              <h1 className="mt-1 text-xl font-black uppercase leading-tight text-[#542B1C] sm:text-2xl md:text-3xl">
                Phân công ca làm việc
              </h1>
            </div>

            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E9D7CC] bg-[#FFF8F3] px-4 py-2.5 text-sm font-bold text-[#542B1C] sm:w-auto sm:py-3">
              <Users size={16} className="text-[#6A3826]" />
              {employees.length} nhân viên
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 xl:grid-cols-4">
          <SummaryCard
            icon={Users}
            value={employees.length}
            label="Nhân viên"
            color="green"
          />
          <SummaryCard
            icon={CalendarDays}
            value={totalAssignedThisWeek}
            label="Lượt phân công / tuần"
            color="orange"
          />
          <SummaryCard
            icon={Clock3}
            value={shifts.length}
            label="Loại ca làm"
            color="red"
          />
          <SummaryCard
            icon={AlertTriangle}
            value={uncoveredShiftCount}
            label="Ca chưa đủ người"
            color={uncoveredShiftCount > 0 ? "red" : "slate"}
          />
        </div>

        {/* Staffing requirements + automatic scheduling */}
        <section className="mb-3 rounded-[20px] border-2 border-slate-200 bg-white p-4 shadow-sm sm:mb-6 sm:rounded-[24px] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#DF8581] text-xs font-black text-white">
                  1
                </span>
                <h2 className="text-sm font-black uppercase text-slate-700">
                  Đặt số người cần cho mỗi ca
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Tối đa {MAX_SHIFTS_PER_WEEK} ca/tuần và {MAX_SHIFTS_PER_DAY}{" "}
                ca/ngày cho mỗi người, tránh ca đêm → ca sáng liền nhau, và ưu
                tiên xếp part-time theo lịch rảnh trước khi dùng full-time lấp
                chỗ trống.
              </p>
            </div>

            <button
              type="button"
              onClick={autoSchedule}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#DF8581] px-5 py-3 text-xs font-black uppercase text-white shadow-sm hover:bg-[#C86F6B] sm:w-auto"
            >
              <WandSparkles size={16} />
              Tự xếp lịch
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            {shifts.map((shift) => (
              <label
                key={shift.id}
                className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${shift.light} ${shift.border}`}
              >
                <span>
                  <span
                    className={`block text-xs font-black uppercase ${shift.text}`}
                  >
                    {shift.name}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {shift.time}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={employees.length}
                    value={requirements[shift.id]}
                    onChange={(event) =>
                      updateRequirement(shift.id, event.target.value)
                    }
                    className="h-10 w-16 rounded-lg border-2 border-white bg-white text-center text-lg font-black text-slate-700 outline-none focus:border-slate-400"
                  />
                  <span className="text-xs font-bold text-slate-500">
                    người
                  </span>
                </span>
              </label>
            ))}

            <button
              type="button"
              onClick={() => setShiftFormOpen((current) => !current)}
              className="flex min-h-[70px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-xs font-black uppercase text-slate-500 hover:border-violet-600 hover:text-violet-600"
            >
              <Plus size={16} /> Thêm ca phát sinh
            </button>
          </div>

          {shiftFormOpen && (
            <div className="mt-3 grid gap-2 rounded-xl border-2 border-violet-200 bg-violet-50 p-3 sm:grid-cols-[1fr_140px_140px_auto]">
              <input
                value={newShiftName}
                onChange={(event) => setNewShiftName(event.target.value)}
                placeholder="Tên ca, ví dụ: Ca tối phát sinh"
                className="h-11 rounded-lg border-2 border-white bg-white px-3 text-sm font-bold outline-none focus:border-violet-500"
              />
              <label className="text-[10px] font-black uppercase text-violet-700">
                Bắt đầu
                <input
                  type="time"
                  value={newShiftStart}
                  onChange={(event) => setNewShiftStart(event.target.value)}
                  className="mt-1 h-8 w-full rounded-md bg-white px-2 text-sm text-slate-700 outline-none"
                />
              </label>
              <label className="text-[10px] font-black uppercase text-violet-700">
                Kết thúc
                <input
                  type="time"
                  value={newShiftEnd}
                  onChange={(event) => setNewShiftEnd(event.target.value)}
                  className="mt-1 h-8 w-full rounded-md bg-white px-2 text-sm text-slate-700 outline-none"
                />
              </label>
              <button
                type="button"
                onClick={addCustomShift}
                className="min-h-11 rounded-lg bg-violet-600 px-4 text-xs font-black uppercase text-white hover:bg-violet-700"
              >
                Thêm ca
              </button>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-xl border-2 border-sky-200">
            <div className="flex flex-col gap-3 bg-sky-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-sky-800">
                  Chọn ngày off trước khi chọn chức năng "Tự xếp lịch"
                </p>
                <p className="mt-1 text-[11px] text-sky-700">
                  Không bắt buộc. Nếu không chọn, hệ thống tự chia ngày off rải
                  đều để không bỏ trống Chủ nhật.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                <span className="inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-sky-300 bg-white px-3 text-xs font-black text-sky-800 shadow-sm">
                  Tuần {weekLabel}
                </span>

                {weekNavigator("sky")}

                <button
                  type="button"
                  onClick={() => setOffDaysOpen((current) => !current)}
                  className="flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-3 text-[11px] font-black uppercase text-sky-700 shadow-sm transition active:scale-95 active:bg-sky-100 sm:w-auto"
                >
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${offDaysOpen ? "rotate-90" : ""}`}
                  />
                  {offDaysOpen ? "" : "Chọn ngày off"}
                </button>
              </div>
            </div>

            {offDaysOpen && (
              <>
                {/* ===== MOBILE: danh sách thẻ, không cuộn ngang ===== */}
                <div className="flex flex-col gap-2 bg-sky-50/50 p-3 sm:hidden">
                  {employees.map((employee) => {
                    const offCount = weekDateKeys.filter((dateKey) =>
                      Boolean(offDays[cellKey(employee.id, dateKey)]),
                    ).length;

                    return (
                      <div
                        key={`off-mobile-${employee.id}`}
                        className="rounded-xl border-2 border-sky-100 bg-white p-3"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-black text-slate-700">
                            {employee.name}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              offCount > 0
                                ? "bg-sky-100 text-sky-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {offCount > 0
                              ? `${offCount} ngày off`
                              : "Chưa chọn"}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {weekDates.map((date) => {
                            const dateKey = formatDateKey(date);
                            const isToday = dateKey === todayKey;
                            const isOff = Boolean(
                              offDays[cellKey(employee.id, dateKey)],
                            );

                            return (
                              <button
                                key={`${employee.id}-${dateKey}-off-m`}
                                type="button"
                                onClick={() =>
                                  toggleOffDay(employee.id, dateKey)
                                }
                                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg text-center transition active:scale-95 ${
                                  isOff
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-50 text-slate-500 active:bg-sky-100"
                                } ${isToday ? "ring-2 ring-sky-400 ring-offset-1" : ""}`}
                              >
                                <span className="text-[9px] font-bold uppercase opacity-80">
                                  {date.toLocaleDateString("vi-VN", {
                                    weekday: "short",
                                  })}
                                </span>
                                <span className="text-base font-black leading-none">
                                  {date.getDate()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ===== DESKTOP / TABLET: dạng bảng ===== */}
                <div className="hidden max-h-[480px] overflow-auto sm:block">
                  <div className="grid min-w-[820px] grid-cols-[180px_repeat(7,minmax(88px,1fr))] bg-white">
                    <div className="sticky left-0 top-0 z-30 flex items-center border-b-2 border-r-2 border-sky-200 bg-sky-100 px-3 py-3">
                      <span className="text-[11px] font-black uppercase tracking-wide text-sky-800">
                        Nhân viên
                      </span>
                    </div>

                    {weekDates.map((date) => {
                      const dateKey = formatDateKey(date);
                      const isToday = dateKey === todayKey;

                      return (
                        <div
                          key={dateKey}
                          className={`sticky top-0 z-20 flex min-h-[68px] flex-col items-center justify-center border-b-2 border-l border-sky-200 px-2 py-2 text-center ${
                            isToday
                              ? "bg-sky-600 text-white"
                              : "bg-sky-100 text-slate-700"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-black uppercase tracking-wide ${
                              isToday ? "text-sky-100" : "text-sky-700"
                            }`}
                          >
                            {date.toLocaleDateString("vi-VN", {
                              weekday: "long",
                            })}
                          </span>
                          <span className="mt-0.5 text-xl font-black leading-none">
                            {date.getDate()}
                          </span>
                          {isToday && (
                            <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[8px] font-black uppercase text-sky-600">
                              Hôm nay
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {employees.map((employee) => (
                      <div key={`off-${employee.id}`} className="contents">
                        <div className="sticky left-0 z-10 flex items-center border-b border-r-2 border-sky-100 bg-white px-3 py-2.5">
                          <span className="truncate text-xs font-bold text-slate-700">
                            {employee.name}
                          </span>
                        </div>

                        {weekDateKeys.map((dateKey) => {
                          const isOff = Boolean(
                            offDays[cellKey(employee.id, dateKey)],
                          );

                          return (
                            <button
                              key={`${employee.id}-${dateKey}-off`}
                              type="button"
                              onClick={() => toggleOffDay(employee.id, dateKey)}
                              className={`min-h-12 border-b border-l border-slate-100 px-1 py-2 text-[10px] font-black uppercase transition hover:bg-sky-50 ${
                                isOff
                                  ? "bg-sky-600 text-white hover:bg-sky-700"
                                  : "bg-white text-slate-400 hover:text-sky-600"
                              }`}
                            >
                              {isOff ? "OFF" : "Chọn"}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {scheduleWarnings.length > 0 && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <p className="flex items-center gap-2 font-black uppercase">
                <AlertTriangle size={15} /> {scheduleWarnings.length} cảnh báo
                lịch
              </p>
              <p className="mt-1 line-clamp-2">
                {scheduleWarnings.join(" • ")}
              </p>
            </div>
          )}
        </section>

        {/* Part-time availability grid */}
        <section className="mb-3 overflow-hidden rounded-[20px] border-2 border-[#DB9B72] bg-white shadow-sm sm:mb-6 sm:rounded-[24px]">
          <div className="flex flex-col gap-4 p-4 pb-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:p-5">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#D28A5A] text-xs font-black text-white">
                  2
                </span>
                <h2 className="text-sm font-black uppercase text-slate-700">
                  Lịch rảnh part-time
                </h2>
              </div>
              <p className="max-w-3xl text-xs text-slate-500">
                Nếu một nhân viên không chọn ô nào trong cả tuần, hệ thống hiểu
                là có thể xếp linh hoạt. Khi đã chọn lịch rảnh, hệ thống chỉ xếp
                đúng các ca/ngày đã chọn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:max-w-2xl sm:flex-wrap sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={copyPreviousWeekAvailability}
                className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-600 hover:border-[#D28A5A] hover:text-[#C9794C] sm:col-span-1"
              >
                <Copy size={14} />
                Sao chép tuần trước
              </button>
              <button
                type="button"
                onClick={clearWeekAvailability}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-600 hover:border-[#DF8581] hover:text-[#B85E5A]"
              >
                <Trash2 size={14} />
                Xóa lịch rảnh
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityOpen((current) => !current)}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[#FFF3EA] px-3 py-2 text-xs font-black uppercase text-[#A75D39] transition hover:bg-[#F9DDCA]"
              >
                <ChevronRight
                  size={16}
                  className={`transition-transform ${
                    availabilityOpen ? "rotate-90" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {availabilityOpen &&
            (partTimeEmployees.length ? (
              <>
                {/* ===== MOBILE: dạng thẻ, cuộn dọc, nút to dễ bấm ===== */}
                <div className="flex flex-col gap-3 border-t border-slate-100 p-3 sm:hidden">
                  {partTimeEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="overflow-hidden rounded-xl border-2 border-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2.5">
                        <span className="truncate text-sm font-black text-slate-700">
                          {employee.name}
                        </span>
                        <span className="shrink-0 rounded-full bg-[#F9DDCA] px-2 py-0.5 text-[10px] font-black uppercase text-[#A75D39]">
                          {weeklyAvailabilityByEmployee[employee.id] || 0} ngày
                          rảnh
                        </span>
                      </div>

                      <div className="flex flex-col divide-y divide-slate-100">
                        {weekDates.map((date) => {
                          const dateKey = formatDateKey(date);
                          const isToday = dateKey === todayKey;
                          const selected =
                            availability[cellKey(employee.id, dateKey)] || [];

                          return (
                            <div
                              key={dateKey}
                              className={`flex items-center gap-2 px-3 py-2 ${
                                isToday ? "bg-[#FFF3EA]" : "bg-white"
                              }`}
                            >
                              <div className="flex w-14 shrink-0 flex-col items-center">
                                <span
                                  className={`text-[9px] font-bold uppercase ${
                                    isToday
                                      ? "text-[#C9794C]"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {date.toLocaleDateString("vi-VN", {
                                    weekday: "short",
                                  })}
                                </span>
                                <span
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                                    isToday
                                      ? "bg-[#D28A5A] text-white"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {date.getDate()}
                                </span>
                              </div>

                              <div className="grid flex-1 grid-cols-2 gap-1.5">
                                {shifts.map((shift) => {
                                  const isOn = selected.includes(shift.id);
                                  return (
                                    <button
                                      key={shift.id}
                                      type="button"
                                      onClick={() =>
                                        toggleAvailability(
                                          employee.id,
                                          dateKey,
                                          shift.id,
                                        )
                                      }
                                      title={`${shift.name} ${shift.time}`}
                                      className={`min-h-11 rounded-lg px-2 text-[11px] font-black transition ${
                                        isOn
                                          ? `${shift.solid} text-white`
                                          : "border-2 border-slate-100 bg-slate-50 text-slate-400 active:bg-slate-100"
                                      }`}
                                    >
                                      {shift.abbr}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ===== DESKTOP: bảng lưới như cũ ===== */}
                <div className="hidden max-h-[420px] overflow-auto border-t border-slate-100 sm:block">
                  <div
                    className="grid min-w-[900px]"
                    style={{
                      gridTemplateColumns: "150px repeat(7, minmax(96px, 1fr))",
                    }}
                  >
                    <div className="sticky left-0 top-0 z-30 flex items-end border-b-2 border-r-2 border-slate-100 bg-white p-3">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        Part-time
                      </span>
                    </div>

                    {weekDates.map((date) => {
                      const dateKey = formatDateKey(date);
                      const isToday = dateKey === todayKey;
                      return (
                        <div
                          key={dateKey}
                          className={`sticky top-0 z-20 flex flex-col items-center gap-1.5 border-b-2 p-2 text-center ${
                            isToday
                              ? "border-[#D28A5A] bg-[#FFF3EA]"
                              : "border-slate-100 bg-white"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isToday ? "text-[#C9794C]" : "text-slate-400"
                            }`}
                          >
                            {date.toLocaleDateString("vi-VN", {
                              weekday: "short",
                            })}
                          </span>
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                              isToday
                                ? "bg-[#D28A5A] text-white"
                                : "text-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                      );
                    })}

                    {partTimeEmployees.map((employee) => (
                      <div key={employee.id} className="contents">
                        <div className="sticky left-0 z-10 flex items-center justify-between gap-2 border-b border-r-2 border-slate-100 bg-white px-3 py-2">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-700">
                              {employee.name}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-[#C9794C]">
                              {weeklyAvailabilityByEmployee[employee.id] || 0}{" "}
                              ngày rảnh
                            </span>
                          </span>
                        </div>

                        {weekDates.map((date) => {
                          const dateKey = formatDateKey(date);
                          const selected =
                            availability[cellKey(employee.id, dateKey)] || [];
                          return (
                            <div
                              key={`${employee.id}-${dateKey}`}
                              className="grid grid-cols-2 gap-1 border-b border-l border-slate-100 bg-white p-1.5"
                            >
                              {shifts.map((shift) => {
                                const isOn = selected.includes(shift.id);
                                return (
                                  <button
                                    key={shift.id}
                                    type="button"
                                    onClick={() =>
                                      toggleAvailability(
                                        employee.id,
                                        dateKey,
                                        shift.id,
                                      )
                                    }
                                    title={`${shift.name} ${shift.time}`}
                                    className={`rounded-md px-1 py-1 text-[9px] font-black transition ${
                                      isOn
                                        ? `${shift.solid} text-white`
                                        : "bg-slate-50 text-slate-300 hover:bg-slate-100"
                                    }`}
                                  >
                                    {shift.abbr}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="border-t border-slate-100 p-5 text-xs text-slate-400">
                Chưa có nhân viên part-time nào. Thêm nhân viên và chọn loại
                "Part-time" ở phần danh sách bên dưới.
              </p>
            ))}
        </section>

        {/* Pen toolbar */}
        <section className="mb-3 overflow-hidden rounded-[20px] border-2 border-[#542B1C] bg-white shadow-sm sm:mb-6 sm:rounded-[24px]">
          <div className="p-3 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#542B1C] text-[10px] font-black text-white sm:h-7 sm:w-7 sm:text-xs">
                  3
                </span>
                <p className="text-xs font-black uppercase text-slate-700 sm:text-sm">
                  Chọn ca để tô thủ công
                </p>
              </div>

              {activePenId && (
                <button
                  type="button"
                  onClick={() => setActivePenId(null)}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 active:bg-slate-200 sm:hidden"
                >
                  Bỏ chọn
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="relative -mx-3 px-3 sm:mx-0 sm:px-0">
              <div className="flex snap-x gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:gap-2 sm:pb-2">
                {shifts.map((shift) => {
                  const active = activePenId === shift.id;
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      onClick={() =>
                        setActivePenId((current) =>
                          current === shift.id ? null : shift.id,
                        )
                      }
                      className={`flex min-h-10 w-[132px] shrink-0 snap-start items-center gap-2 rounded-lg border-2 px-2.5 py-1.5 text-left transition active:scale-[0.97] sm:min-h-14 sm:w-auto sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3 ${
                        active
                          ? `${shift.light} ${shift.border} shadow-sm ring-2 ${shift.ring} ring-offset-1`
                          : "border-slate-200 active:border-slate-300 sm:hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`h-5 w-1.5 shrink-0 rounded-full ${shift.solid} sm:h-8 sm:w-2`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-black uppercase leading-tight sm:text-sm sm:leading-normal">
                          {shift.name}
                        </span>
                        <span className="block truncate text-[10px] text-slate-500 leading-tight sm:text-xs sm:leading-normal">
                          {shift.time}
                        </span>
                      </span>
                      {active && (
                        <Check
                          size={12}
                          className="ml-0.5 shrink-0 text-slate-700 sm:ml-1 sm:size-4"
                        />
                      )}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setActivePenId((current) =>
                      current === "eraser" ? null : "eraser",
                    )
                  }
                  className={`flex min-h-10 w-[92px] shrink-0 snap-start items-center justify-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-[11px] font-black uppercase transition active:scale-[0.97] sm:min-h-14 sm:w-auto sm:gap-2 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm ${
                    activePenId === "eraser"
                      ? "border-slate-700 bg-slate-100 text-slate-800 ring-2 ring-slate-400 ring-offset-1"
                      : "border-slate-200 text-slate-500 active:border-slate-300 sm:hover:border-slate-300"
                  }`}
                >
                  <Eraser size={13} className="sm:size-4" />
                  Xóa ca
                </button>
              </div>

              <div className="pointer-events-none absolute right-3 top-0 h-10 w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />
            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-500 sm:mt-3 sm:gap-2 sm:text-xs">
              <Paintbrush
                size={12}
                className="shrink-0 text-slate-400 sm:size-[14px]"
              />
              <span className="sm:hidden">
                {activePenId
                  ? "Đang tô — bấm/kéo qua nhiều ô."
                  : "Chưa chọn ca — hãy chọn một ca ở trên."}
              </span>
              <span className="hidden sm:inline">
                {activePenId
                  ? "Đang tô — bấm hoặc kéo chuột qua nhiều ô. Bấm tên nhân viên hoặc tiêu đề ngày để tô cả dòng / cả cột."
                  : "Chưa chọn ca nào — hãy chọn một ca ở trên để bắt đầu tô lịch."}
              </span>
            </p>
          </div>
        </section>

        {/* Calendar grid */}
        <section className="overflow-hidden rounded-[20px] border-2 border-[#542B1C] bg-white shadow-sm sm:rounded-[24px]">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6A3826]">
                Work schedule
              </p>
              <h2 className="mt-1 text-lg font-black uppercase text-[#B85E5A]">
                Tuần {weekLabel}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#542B1C] px-3 py-2 text-xs font-black uppercase text-white hover:bg-[#3F1F15] sm:col-span-1"
              >
                <Printer size={15} />
                In lịch tuần này
              </button>

              <button
                type="button"
                onClick={copyPreviousWeek}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-600 hover:border-[#542B1C] hover:text-[#6A3826]"
              >
                <Copy size={15} />
                Sao chép tuần trước
              </button>

              <button
                type="button"
                onClick={clearWeek}
                className="flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-slate-200 px-3 py-2 text-xs font-black uppercase text-slate-600 hover:border-[#DF8581] hover:text-[#B85E5A]"
              >
                <Trash2 size={15} />
                Xóa tuần này
              </button>

              <div className="col-span-2 sm:ml-1">
                {weekNavigator("emerald")}
              </div>
            </div>
          </div>

          {/* ===== MOBILE: dạng thẻ theo nhân viên ===== */}
          <div className="flex flex-col gap-3 p-3 sm:hidden">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="overflow-hidden rounded-xl border-2 border-slate-100"
              >
                {/* Header thẻ nhân viên */}
                <div className="flex items-start justify-between gap-2 bg-slate-50 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="break-words text-sm font-bold text-slate-700">
                        {employee.name}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleEmployeeType(employee.id)}
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                          EMPLOYEE_TYPES[employee.type || "fulltime"].chip
                        }`}
                      >
                        {EMPLOYEE_TYPES[employee.type || "fulltime"].abbr}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[10px] font-bold uppercase text-slate-400">
                      {weeklyCountByEmployee[employee.id] || 0} ca / tuần
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => fillRow(employee.id)}
                      title="Tô cả tuần với ca đang chọn"
                      className="rounded-lg border-2 border-[#E6CFC0] px-2 py-1.5 text-[9px] font-black uppercase text-[#6A3826] active:bg-[#FAF3EE]"
                    >
                      Tô tuần
                    </button>
                    <button
                      type="button"
                      aria-label={`Xóa ${employee.name}`}
                      onClick={() => removeEmployee(employee.id)}
                      className="rounded-lg p-1.5 text-slate-400 active:bg-[#FFF0F0] active:text-[#B85E5A]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Từng ngày trong tuần */}
                <div className="flex flex-col divide-y divide-slate-100">
                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const isToday = dateKey === todayKey;
                    const assignedShifts = getAssignedShiftIds(
                      assignments,
                      employee.id,
                      dateKey,
                    )
                      .map((shiftId) => shiftById[shiftId])
                      .filter(Boolean);

                    return (
                      <div
                        key={dateKey}
                        className={`flex items-center gap-3 px-3 py-2.5 ${
                          isToday ? "bg-[#FFF3EA]" : "bg-white"
                        }`}
                      >
                        <div className="flex w-12 shrink-0 flex-col items-center">
                          <span
                            className={`text-[9px] font-bold uppercase ${
                              isToday ? "text-[#C9794C]" : "text-slate-400"
                            }`}
                          >
                            {date.toLocaleDateString("vi-VN", {
                              weekday: "short",
                            })}
                          </span>
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                              isToday
                                ? "bg-[#D28A5A] text-white"
                                : "text-slate-700"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCellDown(employee.id, dateKey)}
                          className={`flex min-h-11 flex-1 flex-wrap items-center justify-center gap-1.5 rounded-lg border-2 p-1 transition ${
                            assignedShifts.length
                              ? "border-[#E7D2C5] bg-[#FFF9F5]"
                              : "border-dashed border-slate-200 active:bg-slate-50"
                          }`}
                        >
                          {assignedShifts.length ? (
                            assignedShifts.map((shift) => (
                              <span
                                key={shift.id}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-black text-white ${shift.solid}`}
                              >
                                {shift.abbr}

                                <span
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`Xóa ${shift.name}`}
                                  onClick={removeSingleShift(
                                    employee.id,
                                    dateKey,
                                    shift.id,
                                  )}
                                  className="rounded p-0.5 hover:bg-white/20"
                                >
                                  <X size={12} />
                                </span>
                              </span>
                            ))
                          ) : (
                            <Plus size={16} className="text-slate-300" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Thêm nhân viên nhanh - mobile */}
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-3">
              <div className="flex flex-col gap-2">
                <input
                  value={quickName}
                  onChange={(event) => setQuickName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addQuickEmployee();
                  }}
                  placeholder="Thêm nhân viên..."
                  className="min-h-11 w-full rounded-lg border-2 border-slate-200 px-3 text-sm outline-none focus:border-[#542B1C]"
                />
                <div className="flex gap-2">
                  <select
                    value={quickType}
                    onChange={(event) => setQuickType(event.target.value)}
                    className="min-h-11 flex-1 rounded-lg border-2 border-slate-200 px-2 text-xs font-bold uppercase text-slate-500 outline-none focus:border-[#542B1C]"
                  >
                    <option value="fulltime">Full-time</option>
                    <option value="parttime">Part-time</option>
                  </select>
                  <button
                    type="button"
                    onClick={addQuickEmployee}
                    disabled={!quickName.trim()}
                    className="flex min-h-11 items-center gap-1.5 rounded-lg bg-[#542B1C] px-4 text-xs font-black uppercase text-white disabled:opacity-30"
                  >
                    <UserPlus size={14} />
                    Thêm
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBulkOpen((current) => !current)}
              className="text-center text-xs font-bold uppercase text-[#6A3826] active:underline"
            >
              {bulkOpen
                ? "Đóng thêm hàng loạt"
                : "+ Dán danh sách để thêm nhiều nhân viên cùng lúc"}
            </button>
          </div>

          {/* ===== DESKTOP: bảng lưới như cũ ===== */}
          <div className="hidden max-h-[640px] overflow-auto sm:block">
            <div
              className="grid min-w-[970px]"
              style={{
                gridTemplateColumns: "220px repeat(7, minmax(96px, 1fr))",
              }}
            >
              <div className="sticky left-0 top-0 z-30 flex items-end border-b-2 border-r-2 border-slate-100 bg-white p-3">
                <span className="text-[10px] font-black uppercase text-slate-400">
                  Nhân viên
                </span>
              </div>

              {weekDates.map((date) => {
                const dateKey = formatDateKey(date);
                const isToday = dateKey === todayKey;
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => fillColumn(dateKey)}
                    title="Bấm để tô cả ngày với ca đang chọn"
                    className={`sticky top-0 z-20 flex flex-col items-center gap-1.5 border-b-2 p-2 text-center transition ${
                      isToday
                        ? "border-[#6B3826] bg-[#FAF3EE] hover:bg-[#F0DDD1]"
                        : "border-slate-100 bg-white hover:bg-[#FAF3EE]"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isToday ? "text-[#6A3826]" : "text-slate-400"
                      }`}
                    >
                      {date.toLocaleDateString("vi-VN", { weekday: "short" })}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                        isToday ? "bg-[#542B1C] text-white" : "text-slate-700"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}

              {employees.map((employee) => (
                <div key={employee.id} className="contents group/row">
                  <button
                    type="button"
                    onClick={() => fillRow(employee.id)}
                    title="Bấm để tô cả tuần cho nhân viên này"
                    className="sticky left-0 z-10 flex items-start justify-between gap-2 border-b border-r-2 border-slate-100 bg-white px-3 py-2 text-left transition hover:bg-[#FAF3EE] group-hover/row:bg-slate-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="break-words text-sm font-bold leading-snug text-slate-700">
                          {employee.name}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          title="Bấm để đổi loại nhân viên"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleEmployeeType(employee.id);
                          }}
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            EMPLOYEE_TYPES[employee.type || "fulltime"].chip
                          }`}
                        >
                          {EMPLOYEE_TYPES[employee.type || "fulltime"].abbr}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[10px] font-bold uppercase text-slate-400">
                        {weeklyCountByEmployee[employee.id] || 0} ca / tuần
                      </span>
                    </span>

                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={`Xóa ${employee.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeEmployee(employee.id);
                      }}
                      className="shrink-0 rounded p-1 text-slate-300 hover:bg-[#FFF0F0] hover:text-[#B85E5A] sm:invisible sm:group-hover/row:visible"
                    >
                      <X size={14} />
                    </span>
                  </button>

                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const assignedShifts = getAssignedShiftIds(
                      assignments,
                      employee.id,
                      dateKey,
                    )
                      .map((shiftId) => shiftById[shiftId])
                      .filter(Boolean);

                    return (
                      <div
                        key={`${employee.id}-${dateKey}`}
                        onPointerDown={handleCellDown(employee.id, dateKey)}
                        onPointerEnter={handleCellEnter(employee.id, dateKey)}
                        className={`group/cell relative flex min-h-14 cursor-pointer flex-wrap items-center justify-center gap-1 border-b border-l border-slate-100 p-1 transition ${
                          assignedShifts.length
                            ? "bg-[#FFF9F5]"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        {assignedShifts.length ? (
                          assignedShifts.map((shift) => (
                            <span
                              key={shift.id}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black text-white ${shift.solid}`}
                            >
                              {shift.abbr}

                              <button
                                type="button"
                                aria-label={`Xóa ${shift.name}`}
                                onPointerDown={(event) =>
                                  event.stopPropagation()
                                }
                                onClick={removeSingleShift(
                                  employee.id,
                                  dateKey,
                                  shift.id,
                                )}
                                className="rounded p-0.5 hover:bg-white/20"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))
                        ) : (
                          <Plus
                            size={14}
                            className="text-slate-200 group-hover/cell:text-slate-400"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              <div className="sticky left-0 z-10 border-r-2 border-slate-100 bg-white p-2">
                <div className="flex gap-1">
                  <input
                    value={quickName}
                    onChange={(event) => setQuickName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addQuickEmployee();
                    }}
                    placeholder="Thêm nhân viên..."
                    className="min-w-0 flex-1 rounded-lg border-2 border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#542B1C]"
                  />
                  <select
                    value={quickType}
                    onChange={(event) => setQuickType(event.target.value)}
                    className="rounded-lg border-2 border-slate-200 px-1 text-[10px] font-bold uppercase text-slate-500 outline-none focus:border-[#542B1C]"
                  >
                    <option value="fulltime">FT</option>
                    <option value="parttime">PT</option>
                  </select>
                  <button
                    type="button"
                    onClick={addQuickEmployee}
                    disabled={!quickName.trim()}
                    className="rounded-lg bg-[#542B1C] px-2 text-white disabled:opacity-30"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
              </div>

              <div className="col-span-7 flex items-center border-b border-slate-100 bg-white px-3">
                <button
                  type="button"
                  onClick={() => setBulkOpen((current) => !current)}
                  className="text-xs font-bold uppercase text-[#6A3826] hover:underline"
                >
                  {bulkOpen
                    ? "Đóng thêm hàng loạt"
                    : "+ Dán danh sách để thêm nhiều nhân viên cùng lúc"}
                </button>
              </div>
            </div>
          </div>

          {bulkOpen && (
            <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black uppercase text-slate-600">
                  Dán mỗi tên trên một dòng
                </p>
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
                  Loại nhân viên:
                  <select
                    value={bulkType}
                    onChange={(event) => setBulkType(event.target.value)}
                    className="rounded-lg border-2 border-slate-200 bg-white px-2 py-1 text-xs font-bold uppercase outline-none focus:border-[#542B1C]"
                  >
                    <option value="fulltime">Full-time</option>
                    <option value="parttime">Part-time</option>
                  </select>
                </label>
              </div>

              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                rows={4}
                placeholder={"Ví dụ:\nNguyễn Văn A\nTrần Thị B\nLê Văn C"}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#542B1C]"
              />

              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => setBulkOpen(false)}
                  className="rounded-xl border-2 border-slate-200 px-4 py-2 text-xs font-black uppercase text-slate-500"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={addBulkEmployees}
                  disabled={!bulkText.trim()}
                  className="rounded-xl bg-[#542B1C] px-4 py-2 text-xs font-black uppercase text-white disabled:opacity-40"
                >
                  Thêm tất cả
                </button>
              </div>
            </div>
          )}

          <div className="flex">
            <span className="h-2 flex-1 bg-[#DF8581]" />
            <span className="h-2 flex-1 bg-[#D28A5A]" />
            <span className="h-2 flex-1 bg-[#542B1C]" />
          </div>
        </section>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white shadow-xl sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            {toast}
          </div>
        )}
      </div>

      {/* Print-only weekly sheet — one week at a time, grouped by shift in
          chronological work-hour order instead of the editing row order. */}
      <div className="print-only bg-white text-black">
        {/* Header thương hiệu */}
        <header className="mb-5">
          <div className="flex items-center justify-between border-b-[5px] border-[#542B1C] pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-[72px] min-w-[150px] flex-col items-center justify-center rounded-xl border border-[#E7D2C5] bg-[#FFF9F5] px-4 text-[#542B1C]">
                <img
                  src="/logo.png"
                  alt="Neko Crème - Ice-cream & Coffee"
                  className="h-[72px] w-[150px] rounded-xl border border-[#E7D2C5] bg-[#FFF9F5] object-contain p-2"
                />
              </div>

              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-[0.24em] text-[#A86545]">
                  Neko Crème · Ice-cream & Coffee
                </p>

                <h1 className="text-[26px] font-black uppercase leading-none text-[#542B1C]">
                  Lịch làm việc
                </h1>

                <p className="mt-1 text-[13px] font-bold text-[#B85E5A]">
                  {weekLabel}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="mb-2 flex justify-end gap-1">
                <span className="h-2 w-8 rounded-sm bg-[#D28A5A]" />
                <span className="h-2 w-8 rounded-sm bg-[#542B1C]" />
                <span className="h-2 w-8 rounded-sm bg-[#DF8581]" />
              </div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Ngày in
              </p>

              <p className="text-xs font-black text-[#1A1A1A]">
                {new Date().toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Thông tin cửa hàng */}
          <div className="mt-2 flex items-center justify-between bg-[#FAF2EC] px-3 py-2 text-[10px]">
            <p>
              <span className="font-black uppercase text-[#A86545]">
                Cửa hàng:
              </span>{" "}
              <span className="font-bold text-[#1A1A1A]">
                Neko Crème ____________________
              </span>
            </p>

            <p>
              <span className="font-black uppercase text-[#B85E5A]">
                Quản lý cửa hàng:
              </span>{" "}
              <span className="font-bold text-[#1A1A1A]">
                ____________________
              </span>
            </p>
          </div>
        </header>

        {/* Bảng lịch */}
        <div className="overflow-hidden rounded-lg border-2 border-[#542B1C]">
          <table className="w-full table-fixed border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="w-[125px] border-b-2 border-r border-[#542B1C] bg-[#542B1C] px-3 py-3 text-left text-[10px] font-black uppercase tracking-wider text-white">
                  Ca làm việc
                </th>

                {weekDates.map((date) => {
                  const dateKey = formatDateKey(date);
                  const isToday = dateKey === todayKey;

                  return (
                    <th
                      key={dateKey}
                      className={`border-b-2 border-r border-[#542B1C]/30 px-1 py-2 text-center last:border-r-0 ${
                        isToday
                          ? "bg-[#D28A5A] text-white"
                          : "bg-[#FAF2EC] text-[#1A1A1A]"
                      }`}
                    >
                      <span className="block text-[10px] font-black uppercase">
                        {date.toLocaleDateString("vi-VN", {
                          weekday: "short",
                        })}
                      </span>

                      <span
                        className={`mt-1 block text-[11px] font-bold ${
                          isToday ? "text-white" : "text-[#B85E5A]"
                        }`}
                      >
                        {date.toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>

                      {isToday && (
                        <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[7px] font-black uppercase text-[#A86545]">
                          Hôm nay
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {shiftsByStartHour.map((shift, shiftIndex) => (
                <tr
                  key={shift.id}
                  className={shiftIndex % 2 === 0 ? "bg-white" : "bg-[#FFFAF7]"}
                >
                  {/* Thông tin ca */}
                  <td className="border-b border-r border-[#542B1C]/30 p-2.5 align-top">
                    <div className="flex items-start gap-2">
                      <span
                        className={`h-10 w-1.5 shrink-0 rounded-full ${shift.solid}`}
                      />

                      <div>
                        <p className="font-black uppercase leading-tight text-[#1A1A1A]">
                          {shift.name}
                        </p>

                        <p className="mt-1 rounded-sm bg-[#FAF2EC] px-1.5 py-1 text-[9px] font-semibold text-[#70402D]">
                          {shift.time}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Nhân viên theo ngày */}
                  {weekDates.map((date) => {
                    const dateKey = formatDateKey(date);
                    const isToday = dateKey === todayKey;

                    const assignedEmployees = employees
                      .filter((employee) =>
                        getAssignedShiftIds(
                          assignments,
                          employee.id,
                          dateKey,
                        ).includes(shift.id),
                      )
                      .sort((a, b) => a.name.localeCompare(b.name, "vi"));

                    return (
                      <td
                        key={dateKey}
                        className={`border-b border-r border-[#542B1C]/30 p-2 align-top last:border-r-0 ${
                          isToday ? "bg-[#FFF1E8]" : ""
                        }`}
                      >
                        {assignedEmployees.length > 0 ? (
                          <div>
                            {assignedEmployees.map((employee) => (
                              <div
                                key={employee.id}
                                className="border-b border-dashed border-[#E2CABB] py-1.5 text-[10px] font-normal leading-[1.3] text-[#4B2A20] first:pt-0 last:border-0 last:pb-0"
                              >
                                {employee.name}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex min-h-8 items-center justify-center">
                            <span className="text-sm font-normal text-[#D8C6BC]">
                              —
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chú thích */}
        <section className="mt-4 flex items-start justify-between gap-6">
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-wider text-[#1A1A1A]">
              Chú thích ca làm
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {shiftsByStartHour.map((shift) => (
                <div key={shift.id} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${shift.solid}`} />

                  <span className="text-[9px] font-bold text-slate-600">
                    {shift.name}: {shift.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-[230px]">
            <div className="border-b border-[#1A1A1A] pb-7 text-center">
              <p className="text-[9px] font-black uppercase text-[#542B1C]">
                Xác nhận của quản lý cửa hàng
              </p>
            </div>

            <p className="mt-1 text-center text-[8px] italic text-slate-400">
              Ký và ghi rõ họ tên
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-5">
          <div className="flex h-1.5 w-full overflow-hidden">
            <div className="flex-1 bg-[#D28A5A]" />
            <div className="flex-1 bg-[#542B1C]" />
            <div className="flex-1 bg-[#DF8581]" />
          </div>

          <div className="mt-2 flex justify-between text-[8px] font-bold uppercase tracking-wider text-slate-400">
            <span>Neko Crème — Lịch phân công nhân sự</span>
          </div>
        </footer>
      </div>
    </>
  );
}

function SummaryCard({ icon: Icon, value, label, color }) {
  const colors = {
    green: "bg-[#FAF3EE] text-[#6A3826]",
    orange: "bg-[#FFF3EA] text-[#A75D39]",
    red: "bg-[#FFF0F0] text-[#B85E5A]",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 ${colors[color]}`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-black text-[#542B1C] sm:text-2xl">
            {value}
          </p>
          <p className="text-[10px] font-bold uppercase leading-tight text-slate-500 sm:text-xs">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
