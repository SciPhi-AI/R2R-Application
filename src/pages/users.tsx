import { Loader, UserSearch } from 'lucide-react';
import { User } from 'r2r-js';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import Table, { Column } from '@/components/ChatDemo/Table';
import UserInfoDialog from '@/components/ChatDemo/utils/userDialogInfo';
import Layout from '@/components/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

const PAGE_SIZE = 100;
const ITEMS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalEntries, setTotalEntries] = useState<number>(0);
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
        user.id?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  /*** Fetching Users in Batches ***/
  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      let offset = 0;
      let allUsers: User[] = [];
      let totalEntries = 0;

      // Fetch first batch
      const firstBatch = await client.users.list({
        offset: offset,
        limit: PAGE_SIZE,
      });

      if (firstBatch.results.length > 0) {
        totalEntries = firstBatch.totalEntries;
        setTotalEntries(totalEntries);

        allUsers = firstBatch.results;
        setUsers(allUsers);

        // Set loading to false after the first batch is fetched
        setLoading(false);
      } else {
        setLoading(false);
        return;
      }

      offset += PAGE_SIZE;

      // Continue fetching in the background
      while (offset < totalEntries) {
        const batch = await client.users.list({
          offset: offset,
          limit: PAGE_SIZE,
        });

        if (batch.results.length === 0) {
          break;
        }

        allUsers = allUsers.concat(batch.results);
        setUsers([...allUsers]);

        offset += PAGE_SIZE;
      }

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  }, [pipeline?.deploymentUrl, getClient]);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const columns: Column<User>[] = [
    {
      key: 'id',
      label: 'User ID',
      truncate: true,
      copyable: true,
    },
    {
      key: 'isSuperuser',
      label: 'Role',
      renderCell: (user) =>
        user.isSuperuser ? <Badge variant="secondary">Superuser</Badge> : null,
    },
    { key: 'email', label: 'Email', copyable: true },
    { key: 'num_files', label: 'Number of Files' },
  ];

  return (
    <Layout pageTitle="Users Overview">
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-6xl mb-12 mt-10">
          {loading ? (
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
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                totalEntries={totalEntries}
                onPageChange={handlePageChange}
                loading={loading}
                tableHeight="600px"
                actions={(user) => (
                  <Button
                    onClick={() => {
                      setSelectedUserID(user.id);
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
          id={selectedUserID}
          open={isUserInfoDialogOpen}
          onClose={() => setIsUserInfoDialogOpen(false)}
        />
      )}
    </Layout>
  );
};

export default Index;
