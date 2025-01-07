import { ExternalLink } from 'lucide-react'; // Add this to your existing imports at the top
import { Loader, UserRound, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { User } from 'r2r-js';
import React, { useState, useEffect, useCallback } from 'react';

import { DeleteButton } from '@/components/ChatDemo/deleteButton';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';
// import { ApiKeyNoPriv } from '@/types'; // or wherever you store your TS types

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
  const [apiKeys, setApiKeys] = useState<[] | null>(null);

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

  // Fetch the user's API keys
  const fetchApiKeys = useCallback(async () => {
    if (!userProfile) return;
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }
      const keysResp = await client.users.listApiKeys({ id: userProfile.id });
      console.log('keysResp = ', keysResp)
      console.log('keysResp.results = ', keysResp.results)
      setApiKeys(keysResp.results);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  }, [getClient, userProfile]);

  // Combined effect for user & keys
  useEffect(() => {
    fetchUserAccount();
  }, [fetchUserAccount]);

  // Once userProfile is loaded, fetch keys
  useEffect(() => {
    if (userProfile?.id) {
      fetchApiKeys();
    }
  }, [userProfile, fetchApiKeys]);

  const handleUpdateUser = async (data: Partial<User>) => {
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

  const handleCreateApiKey = async () => {
    try {
      if (!userProfile) return;
      const client = await getClient();
      const resp = await client.users.createApiKey({ id: userProfile.id });
      const { publicKey, apiKey } = resp.results;
  
      // Open a toast with scrollable and responsive inputs
      toast({
        variant: 'success',
        title: 'API Key Created',
        description: (
          <div className="space-y-4 max-w-full">
            <div>
              <p className="font-semibold">Public Key:</p>
              <textarea
                readOnly
                value={publicKey}
                className="w-full mt-1 bg-zinc-800 text-white p-2 rounded resize-none focus:outline-none"
                rows={2} // Adjust rows as needed
                onFocus={(e) => e.target.select()} // Auto-select for copying
              />
            </div>
            <div>
              <p className="font-semibold">API Key (copy it now!):</p>
              <textarea
                readOnly
                value={apiKey}
                className="w-full mt-1 bg-zinc-800 text-white p-2 rounded resize-none focus:outline-none"
                rows={4} // Adjust rows for longer keys
                onFocus={(e) => e.target.select()} // Auto-select for copying
              />
            </div>
          </div>
        ),
        duration: 20000, // Increase duration for easier copying
      });
  
      // Re-fetch the list of keys
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        variant: 'destructive',
        title: 'Error Creating API Key',
        description: String(error),
      });
    }
  };

  
    // Delete an API key
  const handleDeleteApiKey = async (keyId: string) => {
    try {
      if (!userProfile) return;
      const client = await getClient();
      await client.users.deleteApiKey({ id: userProfile.id, keyId });

      toast({
        variant: 'success',
        title: 'API Key Deleted',
        description: 'The API key was successfully removed.',
      });

      // Refresh the list of API keys
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        variant: 'destructive',
        title: 'Error Deleting API Key',
        description: String(error),
      });
    }
  };

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
                  >
                    <Pencil className="w-4 h-4 mr-2 mt-1" />
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
                        <span className="text-sm text-gray-400">Created At</span>
                        <p>
                          {new Date(
                            userProfile?.createdAt || ''
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Developer API Keys Section */}
                  <div className="pt-6 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">
                      Developer API Keys
                    </h3>

                    <Button onClick={handleCreateApiKey} variant="outline" className="pr-2">
                      <PlusCircle className="mr-2 w-4 h-4 mt-1" />
                      Create New Key
                    </Button>

                    <div className="mt-4">
                      {apiKeys && apiKeys.length > 0 ? (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left border-b border-zinc-800">
                              <th className="py-2">Public Key</th>
                              <th className="py-2">Key ID</th>
                              {/* <th className="py-2">Name</th> */}
                              <th className="py-2">Last Updated</th>
                              <th className="py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {apiKeys.map((key) => (
                              <tr
                                key={key.keyId}
                                className="border-b border-zinc-800"
                              >
                                <td className="py-2 pr-4 break-all">
                                  {key.publicKey}
                                </td>
                                <td className="py-2 pr-4 break-all">
                                  {key.keyId}
                                </td>
                                {/* <td className="py-2 pr-4">
                                  {key.name || ''}
                                </td> */}
                                <td className="py-2 pr-4">
                                  {new Date(key.updatedAt).toLocaleString()}
                                </td>
                                <td className="py-2">
                                  <Button
                                    onClick={() =>
                                      handleDeleteApiKey(key.keyId)
                                    }
                                    variant="destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500">No API keys found.</p>
                      )}
                    </div>
                  </div>

                  {/* Danger Zone */}
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
