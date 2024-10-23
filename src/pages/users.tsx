import { Loader, UserSearch } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import Table, { Column } from '@/components/ChatDemo/Table';
import UserInfoDialog from '@/components/ChatDemo/utils/userDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { formatFileSize } from '@/lib/utils';
import { User } from '@/types';

const USERS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserID, setSelectedUserID] = useState<string>();
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users;
    }

    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(query) ||
        user.user_id?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const fetchUsers = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.usersOverview(undefined, undefined, 1000);
      setUsers(data.results || []);
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
    if (pipeline?.deploymentUrl) {
      fetchUsers();
    }
  }, [pipeline?.deploymentUrl, fetchUsers]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const columns: Column<User>[] = [
    {
      key: 'user_id',
      label: 'User ID',
      truncate: true,
      copyable: true,
      renderCell: (user) => {
        if (!user.user_id) {
          return 'N/A';
        }
        return `${user.user_id.substring(0, 8)}...${user.user_id.slice(-8)}`;
      },
    },
    {
      key: 'is_superuser',
      label: 'Role',
      renderCell: (user) =>
        user.is_superuser ? <Badge variant="secondary">Superuser</Badge> : null,
    },
    { key: 'email', label: 'Email' },
    { key: 'num_files', label: 'Number of Files' },
    {
      key: 'total_size_in_bytes',
      label: 'Total File Size',
      renderCell: (user) => formatFileSize(user.total_size_in_bytes),
    },
  ];

  return (
    <Layout pageTitle="Users Overview">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-6xl mb-12 mt-10">
          {isLoading ? (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-white">Users</h1>
                </div>

                <div className="flex items-center mt-6 gap-2">
                  <Input
                    placeholder="Search by Email or User ID"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-grow"
                  />
                  {/* Add any action buttons here if needed */}
                </div>
              </div>

              <Table<User>
                data={filteredUsers}
                columns={columns}
                itemsPerPage={USERS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                loading={isLoading}
                tableHeight="600px"
                actions={(user) => (
                  <Button
                    onClick={() => {
                      setSelectedUserID(user.user_id);
                      setIsUserInfoDialogOpen(true);
                    }}
                    color="filled"
                    shape="slim"
                    className="flex justify-center items-center"
                  >
                    <UserSearch className="h-8 w-8" />
                  </Button>
                )}
              />
            </>
          )}
        </div>
      </main>

      {selectedUserID && (
        <UserInfoDialog
          userID={selectedUserID}
          open={isUserInfoDialogOpen}
          onClose={() => setIsUserInfoDialogOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Index;
