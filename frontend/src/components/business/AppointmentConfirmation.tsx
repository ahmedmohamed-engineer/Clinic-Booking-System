"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, Building2, User, DollarSign } from "lucide-react";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { RxMark } from "@/components/layout/Logo";

interface AppointmentConfirmationProps {
  doctorName: string;
  specialtyName?: string;
  clinicName?: string;
  date: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  onViewAppointments: () => void;
}

export function AppointmentConfirmation({
  doctorName,
  specialtyName,
  clinicName,
  date,
  startTime,
  endTime,
  consultationFee,
  onViewAppointments,
}: AppointmentConfirmationProps) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-6 text-center">
      <div className="flex justify-center">
        <div className="stamp-ring size-20 rounded-full text-status-success">
          <CheckCircle2 className="size-10" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Appointment Booked Successfully!
        </h2>
        <p className="text-sm text-muted-foreground">
          Your appointment has been scheduled. You can view or manage it from your appointments dashboard.
        </p>
      </div>

      {/* The written prescription, with its carbon copy behind */}
      <div className="relative text-left">
        <div
          aria-hidden="true"
          className="absolute inset-x-2 -top-1.5 bottom-2 rotate-1 rounded-lg border border-border/70 bg-card/60 px-6 py-4 opacity-60"
        >
          <div className="heading-2 text-muted-foreground/40">
            MediCare — Appointment prescription
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground/40">
            <div className="flex justify-between">
              <span>Specialist</span>
              <span>{doctorName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formatDate(date)}</span>
            </div>
          </div>
        </div>

        <div className="paper-sheet relative px-6 py-6 shadow-md">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-base font-bold text-foreground">
              <RxMark className="size-6 text-sm" />
              MediCare
            </p>
            <span className="heading-2 text-muted-foreground">Confirmation</span>
          </div>
          <div className="letterhead-rule mt-3" />

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="size-4 text-primary" />
              <span className="font-medium text-foreground">{doctorName}</span>
              {specialtyName && (
                <span className="text-xs text-primary">{specialtyName}</span>
              )}
            </div>
            {clinicName && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Building2 className="size-4 text-primary" />
                <span>{clinicName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="size-4 text-primary" />
              <span className="tabular">{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="size-4 text-primary" />
              <span className="tabular">
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 font-semibold text-foreground">
              <span>Consultation Fee</span>
              <div className="flex items-center text-primary">
                <DollarSign className="size-4" />
                <span className="tabular">{formatCurrency(consultationFee)}</span>
              </div>
            </div>
          </div>

          <div className="stamp-ring mt-5 inline-flex -rotate-3 items-center gap-1.5 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-primary">
            Booked
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={onViewAppointments} className="w-full sm:w-auto px-8">
          View My Appointments
        </Button>
      </div>
    </div>
  );
}