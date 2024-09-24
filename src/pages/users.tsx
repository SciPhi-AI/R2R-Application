import { Loader } from 'lucide-react';
import { UserSearch } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import Table, { Column } from '@/components/ChatDemo/Table';
import UserInfoDialog from '@/components/ChatDemo/utils/userDialogInfo';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { formatFileSize } from '@/lib/utils';

const USERS_PER_PAGE = 10;

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserID, setSelectedUserID] = useState<string>();
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const data = await client.usersOverview();
      setUsers(data.results || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      fetchUsers();
    }
  }, [pipeline?.deploymentUrl, fetchUsers]);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const columns: Column<any>[] = [
    {
      key: 'user_id',
      label: 'User ID',
      truncate: true,
      copyable: true,
      renderCell: (user) =>
        `${user.user_id.substring(0, 8)}...${user.user_id.slice(-8)}`,
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
    <Layout pageTitle="Users Overview" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : (
              <>
                {users.length <= 5 && showAlert && (
                  <div className="flex justify-center items-center">
                    <Alert
                      onClose={() => setShowAlert(false)}
                      className="w-5/6"
                    >
                      <AlertTitle>Users Overview</AlertTitle>
                      <AlertDescription>
                        Here, you&apos;ll find information about your users and
                        how they&apos;ve interacted with your deployment. Learn
                        more about{' '}
                        <Link
                          href="https://r2r-docs.sciphi.ai/cookbooks/user-auth"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500"
                        >
                          user authentication
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="https://r2r-docs.sciphi.ai/cookbooks/groups"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500"
                        >
                          group management
                        </Link>
                        .
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                <Table
                  data={users}
                  currentData={users.slice(
                    (currentPage - 1) * USERS_PER_PAGE,
                    currentPage * USERS_PER_PAGE
                  )}
                  columns={columns}
                  itemsPerPage={USERS_PER_PAGE}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  totalItems={users.length}
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
