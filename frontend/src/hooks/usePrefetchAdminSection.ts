"use client";

import { useCallback } from "react";
import { getUsersAdmin } from "@/features/users/api/users-admin";
import { getPatientsAdmin } from "@/features/patients/api/patients-admin";
import { getAppointmentsAdmin } from "@/features/appointments/api/appointments-admin";
import { getPaymentsAdmin } from "@/features/payments/api/payments-admin";
import { getReviewsAdmin } from "@/features/reviews/api/reviews-admin";
import { getSchedulesAdmin } from "@/features/schedules/api/schedules-admin";
import { getSlotsAdmin } from "@/features/slots/api/slots-admin";
import { getClinics } from "@/features/clinics";
import { getSpecialties } from "@/features/specialties";
import { getDoctors } from "@/features/doctors";
import { prefetchAdminQuery } from "@/lib/prefetch";
import { queryKeys } from "@/lib/query-keys";
import { PAGINATION_DEFAULTS, STALE_TIMES } from "@/config";

const DEFAULT_LIST_PARAMS = {
  page: PAGINATION_DEFAULTS.page,
  limit: PAGINATION_DEFAULTS.limit,
};

export function usePrefetchAdminSection() {
  const prefetch = useCallback((href: string) => {
    switch (href) {
      case "/admin/users":
        prefetchAdminQuery({
          queryKey: queryKeys.users.all(DEFAULT_LIST_PARAMS),
          queryFn: () => getUsersAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/patients":
        prefetchAdminQuery({
          queryKey: queryKeys.patients.all(DEFAULT_LIST_PARAMS),
          queryFn: () => getPatientsAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.users.all({ role: "patient", limit: 100 }),
          queryFn: () => getUsersAdmin({ role: "patient", limit: 100 }),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/clinics":
        prefetchAdminQuery({
          queryKey: queryKeys.clinics.all,
          queryFn: getClinics,
          staleTime: STALE_TIMES.clinics,
        });
        break;
      case "/admin/specialties":
        prefetchAdminQuery({
          queryKey: queryKeys.specialties.all,
          queryFn: getSpecialties,
          staleTime: STALE_TIMES.specialties,
        });
        break;
      case "/admin/doctors":
        prefetchAdminQuery({
          queryKey: queryKeys.doctors.all,
          queryFn: getDoctors,
          staleTime: STALE_TIMES.doctors,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.clinics.all,
          queryFn: getClinics,
          staleTime: STALE_TIMES.clinics,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.specialties.all,
          queryFn: getSpecialties,
          staleTime: STALE_TIMES.specialties,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.users.all({ role: "doctor", limit: 100 }),
          queryFn: () => getUsersAdmin({ role: "doctor", limit: 100 }),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/doctor-schedules":
        prefetchAdminQuery({
          queryKey: queryKeys.schedules.admin({ page: 1, limit: 100 }),
          queryFn: () => getSchedulesAdmin({ page: 1, limit: 100 }),
          staleTime: STALE_TIMES.adminLists,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.doctors.all,
          queryFn: getDoctors,
          staleTime: STALE_TIMES.doctors,
        });
        break;
      case "/admin/appointment-slots":
        prefetchAdminQuery({
          queryKey: queryKeys.slots.admin(DEFAULT_LIST_PARAMS),
          queryFn: () => getSlotsAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.doctors.all,
          queryFn: getDoctors,
          staleTime: STALE_TIMES.doctors,
        });
        prefetchAdminQuery({
          queryKey: queryKeys.schedules.admin({ page: 1, limit: 100 }),
          queryFn: () => getSchedulesAdmin({ page: 1, limit: 100 }),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/appointments":
        prefetchAdminQuery({
          queryKey: queryKeys.appointments.admin(DEFAULT_LIST_PARAMS),
          queryFn: () => getAppointmentsAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/payments":
        prefetchAdminQuery({
          queryKey: queryKeys.payments.admin(DEFAULT_LIST_PARAMS),
          queryFn: () => getPaymentsAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
      case "/admin/reviews":
        prefetchAdminQuery({
          queryKey: queryKeys.reviews.admin(DEFAULT_LIST_PARAMS),
          queryFn: () => getReviewsAdmin(DEFAULT_LIST_PARAMS),
          staleTime: STALE_TIMES.adminLists,
        });
        break;
    }
  }, []);

  return prefetch;
}