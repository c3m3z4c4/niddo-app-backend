import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, House, Meeting, GreenAreaEvent, Rsvp, RsvpStatus, DuesConfig, DuesPayment, DuesSummary, Debtor } from '@/types';

// ── Users ───────────────────────────────────────────────────────────────────
export function useUsersQuery() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then(r => r.data),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string; lastName: string; email: string; password: string;
      role?: string; phone?: string; address?: string; houseId?: string;
    }) => api.post<User>('/users', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<User>(`/users/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

// ── Houses ──────────────────────────────────────────────────────────────────
export function useHousesQuery() {
  return useQuery<House[]>({
    queryKey: ['houses'],
    queryFn: () => api.get<House[]>('/houses').then(r => r.data),
  });
}

export function useCreateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { houseNumber: string; address?: string; status?: string; type?: string }) =>
      api.post<House>('/houses', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['houses'] }),
  });
}

export function useUpdateHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<House>(`/houses/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['houses'] }),
  });
}

export function useDeleteHouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/houses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['houses'] }),
  });
}

// ── Meetings ─────────────────────────────────────────────────────────────────
export function useMeetingsQuery() {
  return useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: () => api.get<Meeting[]>('/meetings').then(r => r.data),
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string; description?: string; location: string;
      date: string; startTime: string; endTime?: string;
    }) => api.post<Meeting>('/meetings', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<Meeting>(`/meetings/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meetings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

// ── Events ───────────────────────────────────────────────────────────────────
export function useEventsQuery() {
  return useQuery<GreenAreaEvent[]>({
    queryKey: ['events'],
    queryFn: () => api.get<GreenAreaEvent[]>('/events').then(r => r.data),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string; description?: string; greenArea: string;
      date: string; startTime: string; endTime?: string;
    }) => api.post<GreenAreaEvent>('/events', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<GreenAreaEvent>(`/events/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

// ── RSVPs ────────────────────────────────────────────────────────────────────
/** Returns all RSVPs for the current user */
export function useMyRsvpsQuery() {
  return useQuery<Rsvp[]>({
    queryKey: ['my-rsvps'],
    queryFn: () => api.get<Rsvp[]>('/rsvps').then(r => r.data),
  });
}

/** Returns RSVP counts for a specific target (admin use) */
export function useRsvpAttendanceQuery(targetType: string, targetId: string) {
  return useQuery<Rsvp[]>({
    queryKey: ['rsvp-attendance', targetType, targetId],
    queryFn: () => api.get<Rsvp[]>(`/rsvps/${targetType}/${targetId}/attendance`).then(r => r.data),
    enabled: !!targetId,
  });
}

export function useUpsertRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { targetType: string; targetId: string; status: RsvpStatus }) =>
      api.post<Rsvp>('/rsvps', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-rsvps'] }),
  });
}

export function useRemoveRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetType, targetId }: { targetType: string; targetId: string }) =>
      api.delete(`/rsvps/${targetType}/${targetId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-rsvps'] }),
  });
}

// ── Dues / Cuotas ────────────────────────────────────────────────────────────

export function useDuesConfigQuery() {
  return useQuery<DuesConfig | null>({
    queryKey: ['dues-config'],
    queryFn: () => api.get<DuesConfig>('/dues/config').then(r => r.data).catch(() => null),
  });
}

export function useDuesSummaryQuery(month: number, year: number) {
  return useQuery<DuesSummary>({
    queryKey: ['dues-summary', month, year],
    queryFn: () => api.get<DuesSummary>(`/dues/summary?month=${month}&year=${year}`).then(r => r.data),
  });
}

export function useDuesPaymentsQuery() {
  return useQuery<DuesPayment[]>({
    queryKey: ['dues-payments'],
    queryFn: () => api.get<DuesPayment[]>('/dues').then(r => r.data),
  });
}

export function useDebtorsQuery() {
  return useQuery<Debtor[]>({
    queryKey: ['dues-debtors'],
    queryFn: () => api.get<Debtor[]>('/dues/debtors').then(r => r.data),
  });
}

export function useSetDuesConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amount: number }) => api.post<DuesConfig>('/dues/config', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dues-config'] }),
  });
}

export function useGenerateDues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      api.post<{ generated: number; exempt: number }>('/dues/generate', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dues-payments'] });
      qc.invalidateQueries({ queryKey: ['dues-summary'] });
      qc.invalidateQueries({ queryKey: ['dues-debtors'] });
    },
  });
}

export function useUpdateDuesPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; paidAt?: string | null; notes?: string } }) =>
      api.patch<DuesPayment>(`/dues/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dues-payments'] });
      qc.invalidateQueries({ queryKey: ['dues-summary'] });
      qc.invalidateQueries({ queryKey: ['dues-debtors'] });
    },
  });
}
