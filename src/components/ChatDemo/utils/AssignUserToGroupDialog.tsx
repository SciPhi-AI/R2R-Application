import { Loader } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import Table, { Column } from '@/components/ChatDemo/Table';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { User } from '@/types';

interface UserWithId extends User {
  id: string;
}

interface AssignUserToGroupDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  onAssignSuccess: () => void;
}

const AssignUserToGroupDialog: React.FC<AssignUserToGroupDialogProps> = ({
  open,
  onClose,
  groupId,
  onAssignSuccess,
}) => {
  const { getClient } = useUserContext();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<UserWithId[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithId[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.usersOverview();
      console.log('Fetched data:', data);
      const users: UserWithId[] = data.results.map((user: User) => ({
        ...user,
        id: user.user_id,
        // Ensure name and email are included if available
        // name: user.name || '',
        // email: user.email || '',
      }));
      console.log('Mapped users:', users);
      setAllUsers(users);
      setFilteredUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getClient, toast]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    console.log('Filtering users with query:', searchQuery);
    if (searchQuery.trim() === '') {
      setFilteredUsers(allUsers);
      console.log('Set filteredUsers to allUsers:', allUsers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allUsers.filter((user: UserWithId) => {
        const userId = user.id ? user.id.toLowerCase() : '';
        const userName = user.name ? user.name.toLowerCase() : '';
        const userEmail = user.email ? user.email.toLowerCase() : '';

        const isMatch =
          userId.includes(query) ||
          userName.includes(query) ||
          userEmail.includes(query);

        if (isMatch) {
          console.log('User matched:', user);
        }

        return isMatch;
      });
      console.log('Filtered users:', filtered);
      setFilteredUsers(filtered);
    }
  }, [searchQuery, allUsers]);

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredUsers.map((user) => user.id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectItem = (item: UserWithId, selected: boolean) => {
    if (selected) {
      setSelectedUserIds((prev) => [...prev, item.id]);
    } else {
      setSelectedUserIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const handleAssign = async () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'No Users Selected',
        description: 'Please select at least one user to assign.',
        variant: 'destructive',
      });
      return;
    }

    setAssigning(true);
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const assignPromises = selectedUserIds.map((userId) =>
        client.addUserToGroup(userId, groupId)
      );

      await Promise.all(assignPromises);

      toast({
        title: 'Success',
        description: 'Selected users have been assigned to the group.',
        variant: 'success',
      });

      onAssignSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning users:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign users. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const columns: Column<UserWithId>[] = [
    { key: 'id', label: 'User ID', truncate: true, copyable: true },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-4">
              Assign Users to Group
            </DialogTitle>
            <Input
              placeholder="Search by User ID, Name, or Email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center mt-20">
              <Loader className="animate-spin" size={64} />
            </div>
          ) : (
            <Table
              data={filteredUsers}
              columns={columns}
              itemsPerPage={10}
              currentData={filteredUsers.slice(0, 10)}
              onSelectAll={handleSelectAll}
              onSelectItem={handleSelectItem}
              selectedItems={filteredUsers.filter((user) =>
                selectedUserIds.includes(user.id)
              )}
              initialSort={{ key: 'id', order: 'asc' }}
              initialFilters={{}}
              tableHeight="400px"
              currentPage={1}
              onPageChange={() => {}}
              totalItems={filteredUsers.length}
            />
          )}
          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button onClick={onClose} shape="outline">
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || selectedUserIds.length === 0}
            >
              Assign to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AssignUserToGroupDialog;
