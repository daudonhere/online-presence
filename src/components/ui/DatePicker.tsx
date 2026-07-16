"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  placeholder?: string;
  disabled?: boolean;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  value,
  onChange,
  minDate,
  placeholder = "Pilih tanggal",
  disabled = false,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateObj = minDate ? parseDate(minDate) : today;
  minDateObj.setHours(0, 0, 0, 0);

  const selectedDate = value ? parseDate(value) : null;

  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(
    selectedDate ? selectedDate.getMonth() : today.getMonth()
  );
  const [viewYear, setViewYear] = useState(
    selectedDate ? selectedDate.getFullYear() : today.getFullYear()
  );

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    selected.setHours(0, 0, 0, 0);
    if (selected < minDateObj) return;
    onChange(toISO(viewYear, viewMonth, day));
    setOpen(false);
  };

  const isDisabled = (day: number): boolean => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < minDateObj;
  };

  const isToday = (day: number): boolean => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    );
  };

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      viewYear === selectedDate.getFullYear() &&
      viewMonth === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-left text-base font-semibold text-slate-900 outline-none transition focus:border-[#1b8659] focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:opacity-50"
      >
        {value ? (
          <span>{formatDisplay(value)}</span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <CalendarDays className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#1b8659]" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-[20px] bg-white p-4 shadow-[0_8px_40px_rgba(0,0,0,0.12)] ring-1 ring-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition hover:bg-slate-200"
              >
                <ChevronLeft className="text-lg" />
              </button>
              <p className="font-display text-base font-bold text-slate-950">
                {MONTHS[viewMonth]} {viewYear}
              </p>
              <button
                type="button"
                onClick={handleNextMonth}
                className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition hover:bg-slate-200"
              >
                <ChevronRight className="text-lg" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
                >
                  {day}
                </div>
              ))}

              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const disabled = isDisabled(day);
                const today = isToday(day);
                const selected = isSelected(day);

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectDay(day)}
                    className={`h-9 w-full rounded-xl text-sm font-semibold transition
                      ${disabled
                        ? "text-slate-300 cursor-not-allowed"
                        : selected
                          ? "bg-[#1b8659] text-white shadow-md"
                          : today
                            ? "bg-emerald-50 text-[#1b8659] ring-1 ring-[#1b8659]/30"
                            : "text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const iso = toISO(now.getFullYear(), now.getMonth(), now.getDate());
                if (parseDate(iso) >= minDateObj) {
                  onChange(iso);
                }
                setOpen(false);
              }}
              className="mt-3 w-full rounded-xl bg-emerald-50 py-2 text-xs font-bold text-[#1b8659] transition hover:bg-emerald-100"
            >
              Hari Ini
            </button>
          </div>
        </>
      )}
    </div>
  );
}
