'use client';

import { ExternalLink } from 'lucide-react';
import { Loader, UserRound, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/router';
import { User } from 'r2r-js';
import React, { useEffect, useState, useCallback } from 'react';

// NEW: Import useRouter

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import { Enterprise } from '@/components/enterprise';
import Layout from '@/components/Layout';
import { Starter } from '@/components/starter';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
/* ==========================
   UpdateUserModal Interfaces
   ========================== */
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

/* ==========================
   UpdateUserModal Component
   ========================== */
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
          {/* Name */}
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
          {/* Email */}
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
          {/* Bio */}
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
          {/* Modal Buttons */}
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

/* ==========================
   Account Page (Index)
   ========================== */
const Index: React.FC = () => {
  const { getClient, authState, unsetCredentials } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Update Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const { toast } = useToast();

  // For the change password flow
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // NEW: Use Next.js router to read ?tab=...
  const router = useRouter();
  const { tab } = router.query;
  // Fallback to "info" if no tab param is present
  const currentTab = typeof tab === 'string' ? tab : 'info';

  // Fetch user data
  const fetchUserAccount = useCallback(async () => {
    try {
      setLoading(true);
      const client: any = await getClient();
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

  // Handle update user
  const handleUpdateUser = async (data: Partial<User>) => {
    try {
      const client: any = await getClient();
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

  // Handle change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill in both fields to change your password.',
      });
      return;
    }

    try {
      setIsChangingPassword(true);
      const client: any = await getClient();
      if (!client) {
        throw new Error('No authenticated client available');
      }

      await client.users.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast({
        variant: 'success',
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });

      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        variant: 'destructive',
        title: 'Change Password Failed',
        description:
          'Failed to change password. Please check your details and try again.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Component did mount
  useEffect(() => {
    fetchUserAccount();
  }, [fetchUserAccount]);

  // Loading state
  if (loading) {
    return (
      <Layout pageTitle="Account" includeFooter={false}>
        <div className="flex justify-center items-center h-screen">
          <Loader className="animate-spin" size={64} />
        </div>
      </Layout>
    );
  }

  // When user changes tab, update the URL so it's bookmarkable
  const handleTabChange = (newTab: string) => {
    router.push(`/account?tab=${newTab}`, undefined, { shallow: true });
  };

  // Actual page content
  return (
    <Layout pageTitle="Account" includeFooter={false}>
      <main className="w-full flex flex-col container h-screen-[calc(100%-4rem)]">
        <div className="mx-auto max-w-3xl mb-12 mt-20 w-full">
          {/* =========== 
              Page Title 
              =========== */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
              Account Settings
              <a
                href="https://r2r-docs.sciphi.ai/api-and-sdks/users/users"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center hover:text-blue-400 text-gray-400"
                title="View Users Documentation"
              >
                <ExternalLink size={18} />
              </a>
            </h1>
          </div>

          {/* =========== 
              Tabs Layout
              =========== */}
          <Tabs
            // Use the current tab from the URL
            value={currentTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Tabs List */}
            <TabsList className="mb-4">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="plans">Plans & Billing</TabsTrigger>
            </TabsList>

            {/* =============
                Info Tab
               ============= */}
            <TabsContent value="info">
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
                      className="pr-2"
                      shape="outline_wide"
                    >
                      <Pencil className="w-4 h-4 mr-2 mt-1" />
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {/* Bio */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">
                        Bio
                      </h3>
                      <p>{userProfile?.bio || 'No bio provided'}</p>
                    </div>

                    {/* Account Details */}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* =============
                Security Tab
               ============= */}
            <TabsContent value="security">
              <Card className="bg-zinc-900">
                <CardContent>
                  <h2 className="text-lg font-semibold mb-4 pt-2">
                    Security Settings
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">
                    Here, you can manage your password, and soon 2FA, and other
                    security options.
                  </p>

                  {/* Change Password Form */}
                  <h2 className="font-bold font-medium text-gray-400 mb-2">
                    Update Your Password
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      shape="outline_widest"
                    >
                      {isChangingPassword
                        ? 'Changing...'
                        : 'Update Your Password'}
                    </Button>
                  </div>
                  <div>
                    <div className="pt-6" />
                    <div className="border-t border-zinc-800">
                      <h3 className="pt-6 text-lg font-semibold text-red-600 flex items-center gap-2 justify-center mb-4">
                        <AlertTriangle size={20} className="text-red-500" />
                        Proceed With Caution
                        <AlertTriangle size={20} className="text-red-500" />
                      </h3>
                      <div className="flex justify-center">
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* =============
                Payment Tab
               ============= */}
            <TabsContent value="plans">
              <Card className="bg-zinc-900">
                <CardContent>
                  <h2 className="text-lg font-semibold mb-2 pt-4">Plans</h2>
                  <p className="text-sm text-gray-400">
                    {/* Manage your payment methods and view billing information
                    here. */}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-10">
                    <Starter />
                    {/* <CardDemo /> */}
                    <Enterprise />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* =============
            Update Modal
           ============= */}
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
