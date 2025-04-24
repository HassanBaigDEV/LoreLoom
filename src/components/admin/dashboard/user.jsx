import React from "react";
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

export default function UsersPage({ users = [], onUpdateRole }) {
  console.log("Users data:", users);

  const handleRoleChange = (userId, newRole) => {
    onUpdateRole(userId, newRole);
  };

  return (
    <div className="p-6">
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Stories</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user?.id} hover>
                <TableCell>{user?.username}</TableCell>
                <TableCell>{user?.email}</TableCell>
                <TableCell>
                  <FormControl size="small">
                    <Select
                      value={user?.role || "user"}
                      onChange={(e) =>
                        handleRoleChange(user?.id, e.target.value)
                      }
                      variant="outlined"
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="user">User</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>{user?.stories?.length || 0}</TableCell>
                <TableCell>
                  {new Date(user?.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
