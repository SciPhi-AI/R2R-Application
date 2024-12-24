import { Loader, UserRound, Pencil } from 'lucide-react';
import { User } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

interface UpdateUserModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate: (data: UpdateUserData) => void;
  currentData: User;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  bio?: string;
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
  open,
  onClose,
  onUpdate,
  currentData,
}) => {
  const [formData, setFormData] = useState<UpdateUserData>({
    name: currentData.name || '',
    email: currentData.email || '',
    bio: currentData.bio || '',
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Your email"
              type="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Input
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="A brief bio"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onUpdate(formData);
                onClose();
              }}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index: React.FC = () => {
  const { getClient, authState, unsetCredentials } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchUserAccount = useCallback(async () => {
    try {
      setLoading(true);
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const user = await client.users.me();
      setUserProfile(user.results);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
    }
  }, [getClient]);

  const handleUpdateUser = async (data: UpdateUserData) => {
    try {
      const client = await getClient();
      if (!client || !userProfile) {
        return;
      }

      await client.users.update({
        id: userProfile.id,
        ...data,
      });

      toast({
        variant: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
      });

      fetchUserAccount();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
      });
    }
  };

  useEffect(() => {
    fetchUserAccount();
  }, [fetchUserAccount]);

  if (loading) {
    return (
      <Layout pageTitle="Account" includeFooter={false}>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin" size={64} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Account" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-3xl mb-12 mt-20 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-6">
              Account Settings
            </h1>

            <Card className="bg-zinc-900">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-zinc-800 p-4 rounded-full">
                      <UserRound size={40} />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">
                        {userProfile?.name || 'Unnamed User'}
                      </h2>
                      <p className="text-gray-400">{userProfile?.email}</p>
                    </div>
                  </div>
                  <Button
                    color="primary"
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Bio
                    </h3>
                    <p>{userProfile?.bio || 'No bio provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-400">
                      Account Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-400">User ID</span>
                        <p className="font-mono text-sm">{userProfile?.id}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">
                          Created At
                        </span>
                        <p>
                          {new Date(
                            userProfile?.createdAt || ''
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">
                      Danger Zone
                    </h3>
                    <DeleteButton
                      selectedDocumentIds={[]}
                      onDelete={() => {}}
                      onSuccess={() => {
                        unsetCredentials();
                      }}
                      showToast={toast}
                      userId={userProfile?.id}
                      isUser={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {userProfile && (
          <UpdateUserModal
            open={isUpdateModalOpen}
            onClose={() => setIsUpdateModalOpen(false)}
            onUpdate={handleUpdateUser}
            currentData={userProfile}
          />
        )}
      </main>
    </Layout>
  );
};

export default Index;
