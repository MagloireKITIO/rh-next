import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; name: string; role: string }) =>
      companiesApi.inviteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('Invitation sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error sending invitation');
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      companiesApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('User role updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error updating user role');
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => companiesApi.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('User activated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error activating user');
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => companiesApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('User deactivated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deactivating user');
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => companiesApi.resendInvitation(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('Invitation resent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error resending invitation');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => companiesApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deleting user');
    },
  });
}