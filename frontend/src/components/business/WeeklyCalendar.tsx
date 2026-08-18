"use client";

import { useTranslations } from "next-intl";
import { TimeBlock } from "@/components/business/TimeBlock";
import type { DoctorScheduleRecord } from "@/types/models/schedule";

interface WeeklyCalendarProps {
  schedules: DoctorScheduleRecord[];
  className?: string;
}

export function WeeklyCalendar({ schedules, className }: WeeklyCalendarProps) {
  const td = useTranslations("weekdays");
  const tb = useTranslations("business.weeklyCalendar");

  const days = [
    td("sunday"),
    td("monday"),
    td("tuesday"),
    td("wednesday"),
    td("thursday"),
    td("friday"),
    td("saturday"),
  ];

  return (
    <div
      className={
        "grid grid-cols-1 gap-4 @container @lg:grid-cols-2 @4xl:grid-cols-7" +
        (className ? ` ${className}` : "")
      }
    >
      {days.map((day, index) => {
        const entries = schedules.filter((schedule) => schedule.weekday === index);
        return (
          <div
            key={day}
            className="paper-sheet p-4"
          >
            <h3 className="mb-3 border-b border-border pb-2 text-sm font-semibold text-foreground">
              {day}
            </h3>
            {entries.length > 0 ? (
              <div className="flex flex-col gap-2">
                {entries.map((schedule) => (
                  <TimeBlock
                    key={schedule.id}
                    startTime={schedule.startTime}
                    endTime={schedule.endTime}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{tb("off")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}