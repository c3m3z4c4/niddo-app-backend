import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User, House, Meeting, GreenAreaEvent } from '@/types';

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
