import { Loader } from 'lucide-react';
import { UserSearch } from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect, useCallback } from 'react';

import UserInfoDialog from '@/components/ChatDemo/utils/userDialogInfo';
import Layout from '@/components/Layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import Pagination from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
import { formatFileSize } from '@/lib/utils';

const USERS_PER_PAGE = 10;

const UserTable = ({
  users,
  copyToClipboard,
  setSelectedUserID,
  setIsUserInfoDialogOpen,
}: {
  users: any[];
  copyToClipboard: (text: string, description: string) => void;
  setSelectedUserID: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsUserInfoDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const emptyRows = Array(USERS_PER_PAGE - users.length).fill(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-48 text-white">User ID</TableHead>
          <TableHead className="w-36 text-white"></TableHead>
          <TableHead className="w-48 text-white">Email</TableHead>
          <TableHead className="w-36 text-white">Number of Files</TableHead>
          <TableHead className="w-36 text-white">Total File Size</TableHead>
          <TableHead className="w-24 text-white">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.user_id} className="h-16">
            <TableCell className="font-medium">
              <div
                className="overflow-x-auto whitespace-nowrap cursor-pointer"
                onClick={() => {
                  const text = user.user_id;
                  const description = 'User ID copied to clipboard';
                  copyToClipboard(text, description);
                }}
              >
                {user.user_id
                  ? `${user.user_id.substring(0, 8)}...${user.user_id.slice(-8)}`
                  : 'N/A'}
              </div>
            </TableCell>
            <TableCell>
              {user.is_superuser && (
                <Badge variant="secondary">Superuser</Badge>
              )}
            </TableCell>
            <TableCell className="font-medium">
              {user.email ? user.email : 'N/A'}
            </TableCell>
            <TableCell>{user.num_files}</TableCell>
            <TableCell>{formatFileSize(user.total_size_in_bytes)}</TableCell>
            <TableCell>
              <Button
                onClick={() => {
                  setSelectedUserID(user.user_id);
                  setIsUserInfoDialogOpen(true);
                }}
                color="filled"
                shape="slim"
                className="flex justify-center items-center"
              >
                <UserSearch className="h-6 w-6" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {emptyRows.map((_, index) => (
          <TableRow key={`empty-${index}`} className="h-16">
            <TableCell colSpan={6}></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const Index: React.FC = () => {
  const { getClient, pipeline } = useUserContext();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUserID, setSelectedUserID] = useState<string>();
  const [isUserInfoDialogOpen, setIsUserInfoDialogOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const { toast } = useToast();

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: 'Copied!', description }))
      .catch((err) => console.error('Could not copy text: ', err));
  };

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

  const totalUsers = users.length;
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  return (
    <Layout pageTitle="Users Overview" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="absolute inset-0 bg-zinc-900 mt-[5rem] sm:mt-[5rem] ">
          <div className="mx-auto max-w-6xl mb-12 mt-4 absolute inset-4 md:inset-1">
            {isLoading ? (
              <Loader className="mx-auto mt-20 animate-spin" size={64} />
            ) : (
              <>
                {totalUsers <= 5 && showAlert && (
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
                <UserTable
                  users={paginatedUsers}
                  copyToClipboard={copyToClipboard}
                  setSelectedUserID={setSelectedUserID}
                  setIsUserInfoDialogOpen={setIsUserInfoDialogOpen}
                />
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
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
