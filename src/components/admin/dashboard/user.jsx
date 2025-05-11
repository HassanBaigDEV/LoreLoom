import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import apiClient from "@/lib/axios";
import { adminService } from "@/lib/adminService";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export default function UsersPage({ users = [], stories = [], onUpdateRole }) {
  const [userStoryCounts, setUserStoryCounts] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, userId: null });

  useEffect(() => {
    if (users.length) fetchUserStories();
  }, [users]);

  const fetchUserStories = async () => {
    try {
      const storyCounts = {};
      
      await Promise.all(
        users.map(async (user) => {
          try {
            const response = await apiClient.get("/author/stories", {
              params: { author: user.id },
            });
            storyCounts[user.id] = response.data.length;
          } catch (error) {
            console.error(`Error fetching stories for user ${user.id}:`, error);
            storyCounts[user.id] = 0;
          }
        })
      );

      setUserStoryCounts(storyCounts);
    } catch (error) {
      console.error("Error fetching user stories:", error);
    }
  };

  console.log("Users data:", users);

  const handleRoleChange = (userId, newRole) => {
    onUpdateRole(userId, newRole);
  };

  // Placeholder handlers for actions
  const handleActivate = async (userId) => {
    try {
      await adminService.updateUserActiveStatus(userId, true);
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      alert('Failed to activate user');
    }
  };
  const handleDeactivate = async (userId) => {
    try {
      await adminService.updateUserActiveStatus(userId, false);
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      alert('Failed to deactivate user');
    }
  };
  const handleDelete = (userId) => {
    setConfirmDialog({ open: true, userId });
  };

  const handleConfirmDelete = async () => {
    try {
      await adminService.deleteUser(confirmDialog.userId);
      setConfirmDialog({ open: false, userId: null });
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      setConfirmDialog({ open: false, userId: null });
      alert('Failed to delete user');
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, userId: null });
  };

  return (
    <div className="p-6">
      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Username</th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Email</th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Stories</th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Created At</th>
              <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user, idx) => (
              <tr key={user?.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{user?.username}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{user?.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{user?.role === 'admin' ? 'Admin' : 'User'}</td>
                <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{userStoryCounts[user.id] ?? '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(user?.created_at).toLocaleDateString()}</td>
                <td className="flex gap-2 px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleActivate(user?.id)}
                    className={`px-2 py-1 text-xs rounded ${user?.is_active ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-green-700 bg-green-100 hover:bg-green-200'}`}
                    disabled={user?.is_active}
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleDeactivate(user?.id)}
                    className={`px-2 py-1 text-xs rounded ${!user?.is_active ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'}`}
                    disabled={!user?.is_active}
                  >
                    Deactivate
                  </button>
                  <button onClick={() => handleDelete(user?.id)} className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete User"
        content="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
      />
    </div>
  );
}
