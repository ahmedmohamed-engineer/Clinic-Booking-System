"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useClinicsList } from "@/features/clinics/hooks/useClinicsList";
import { useSpecialtiesList } from "@/features/specialties/hooks/useSpecialtiesList";
import { useDoctorsList } from "@/features/doctors/hooks/useDoctorsList";
import { useAvailableSlots } from "@/features/slots/hooks/useAvailableSlots";
import { useBookAppointment } from "@/features/appointments/hooks/useBookAppointment";
import { StepWizard } from "@/components/business/StepWizard";
import { ClinicSelector } from "@/components/business/ClinicSelector";
import { SpecialtySelector } from "@/components/business/SpecialtySelector";
import { DoctorCard } from "@/components/business/DoctorCard";
import { AppointmentConfirmation } from "@/components/business/AppointmentConfirmation";
import { Skeleton } from "@/components/feedback/Skeleton";
import { toISODateString } from "@/lib/utils";
import type { AppointmentRecord } from "@/types/models/appointment";

const SlotPicker = dynamic(
  () => import("@/components/business/SlotPicker").then((mod) => mod.SlotPicker),
  { loading: () => <Skeleton variant="calendar" /> },
);

export default function BookAppointmentPage() {
  const router = useRouter();
  const t = useTranslations("book");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    toISODateString(new Date())
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] =
    useState<AppointmentRecord | null>(null);

  const { data: clinics = [], isLoading: isLoadingClinics } = useClinicsList();
  const { data: specialties = [], isLoading: isLoadingSpecialties } =
    useSpecialtiesList();
  const { data: doctors = [], isLoading: isLoadingDoctors } = useDoctorsList({
    clinicId: selectedClinicId,
    specialtyId: selectedSpecialtyId,
  });
  const { data: slots = [], isLoading: isLoadingSlots } = useAvailableSlots({
    doctorId: selectedDoctorId ?? undefined,
    date: selectedDate,
  });

  const bookMutation = useBookAppointment();

  // Find selected entities for confirmation details
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const isNextDisabled = () => {
    if (currentStep === 0) return !selectedClinicId;
    if (currentStep === 1) return !selectedSpecialtyId;
    if (currentStep === 2) return !selectedDoctorId;
    if (currentStep === 3) return !selectedSlotId;
    return false;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (!selectedSlotId) return;
      bookMutation.mutate(selectedSlotId, {
        onSuccess: (data) => {
          setConfirmedAppointment(data);
        },
      });
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  if (confirmedAppointment) {
    return (
      <div className="container-custom flex flex-col gap-8 p-6">
        <AppointmentConfirmation
          doctorName={selectedDoctor?.doctor.displayName ?? ""}
          specialtyName={selectedDoctor?.doctor.specialtyName}
          clinicName={selectedDoctor?.doctor.clinicName}
          date={selectedDate}
          startTime={selectedSlot?.startTime ?? ""}
          endTime={selectedSlot?.endTime ?? ""}
          consultationFee={selectedDoctor ? Number(selectedDoctor.consultationFee) : 0}
          onViewAppointments={() => router.push("/appointments")}
        />
      </div>
    );
  }

  const steps = [
    {
      title: t("stepClinic"),
      content: (
        <ClinicSelector
          clinics={clinics}
          selectedClinicId={selectedClinicId}
          onSelect={(id) => {
            setSelectedClinicId(id);
            setSelectedDoctorId(null);
          }}
          isLoading={isLoadingClinics}
        />
      ),
    },
    {
      title: t("stepSpecialty"),
      content: (
        <SpecialtySelector
          specialties={specialties}
          selectedSpecialtyId={selectedSpecialtyId}
          onSelect={(id) => {
            setSelectedSpecialtyId(id);
            setSelectedDoctorId(null);
          }}
          isLoading={isLoadingSpecialties}
        />
      ),
    },
    {
      title: t("stepDoctor"),
      content: (
        <div className="space-y-4">
          {isLoadingDoctors ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="shimmer h-32 rounded-lg"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {t("noDoctors")}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {doctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  isSelected={selectedDoctorId === doctor.id}
                  onSelect={() => setSelectedDoctorId(doctor.id)}
                />
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t("stepDateTime"),
      content: (
        <SlotPicker
          slots={slots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={(id) => setSelectedSlotId(id)}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          isLoading={isLoadingSlots}
        />
      ),
    },
  ];

  return (
    <div className="container-custom flex flex-col gap-8 p-6">
      <header className="animate-fade-in flex flex-col gap-2">
        <h1 className="heading-1">{t("title")}</h1>
        <p className="body-text">
          {t("subtitle")}
        </p>
      </header>

      <div className="animate-fade-in">
        <StepWizard
          steps={steps}
          currentStep={currentStep}
          onNext={handleNext}
          onBack={handleBack}
          isNextDisabled={isNextDisabled()}
          isLoading={bookMutation.isPending}
        />
      </div>
    </div>
  );
}
