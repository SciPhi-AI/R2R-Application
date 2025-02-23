import {
  Loader,
  UserRound,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { User } from 'r2r-js';
import React, { useState, useEffect } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import CopyableContent from '@/components/ui/CopyableContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/UserContext';

interface UserInfoDialogProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

const formatValue = (value: any) => {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'N/A';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value.toString();
};

const InfoRow: React.FC<{
  label: string;
  values: { label?: string; value: any }[];
  children?: React.ReactNode;
}> = ({ label, values, children }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700">
    <span className="font-medium">{label}:</span>
    <span className="text-gray-300 flex items-center space-x-4">
      {values.map((item, index) => (
        <span key={index} className="flex items-center">
          {item.label && (
            <span className="mr-1 text-gray-500">{item.label}:</span>
          )}
          <span>{formatValue(item.value)}</span>
        </span>
      ))}
      {children}
    </span>
  </div>
);

const ExpandableInfoRow: React.FC<{
  label: string;
  values: string[] | undefined;
}> = ({ label, values }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="py-2 border-b border-gray-700">
      <div className="flex items-center justify-between">
        <span className="font-medium">{label}:</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 flex items-center space-x-2"
        >
          <span>{values?.length || 0} items</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {isExpanded && values && values.length > 0 && (
        <div className="mt-2 pl-4 text-gray-300">
          <div className="grid grid-cols-2 gap-2">
            {values.map((value, index) => (
              <div key={index}>
                <CopyableContent
                  content={value}
                  truncated={
                    value.length > 20
                      ? `${value.substring(0, 8)}...${value.slice(-4)}`
                      : value
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const UserInfoDialog: React.FC<UserInfoDialogProps> = ({
  id,
  open,
  onClose,
}) => {
  const { getClient, deleteUser, updateUser } = useUserContext();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<{
    name: string;
    bio: string;
    isSuperuser: boolean;
  }>({
    name: '',
    bio: '',
    isSuperuser: false,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || !open) {
        return;
      }

      try {
        setLoading(true);
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const user = await client.users.retrieve({ id });
        setUserProfile(user.results);
        setEditedData({
          name: user.results.name || '',
          bio: user.results.bio || '',
          isSuperuser: user.results.isSuperuser || false,
        });
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, open, getClient]);

  const handleDeleteUser = async () => {
    try {
      await deleteUser(id, '');
      toast({
        title: 'User Deleted',
        description: 'The user has been successfully deleted.',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updatedUser = await updateUser(
        id,
        { email: userProfile?.email || '', role: 'user' },
        editedData.name,
        editedData.bio,
        editedData.isSuperuser
      );
      setUserProfile(updatedUser);
      setIsEditing(false);
      toast({
        title: 'Success',
        description: 'User information updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user information.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>User Details</DialogTitle>
            {!loading && userProfile && (
              <Button shape="outline" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader className="animate-spin" size={32} />
          </div>
        ) : userProfile ? (
          <Card className="bg-zinc-900">
            <CardHeader>
              <div className="flex items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-zinc-800 p-4 rounded-full">
                    <UserRound size={40} />
                  </div>
                  <div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={editedData.name}
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                name: e.target.value,
                              })
                            }
                            placeholder="User name"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={editedData.isSuperuser}
                            onCheckedChange={(checked) =>
                              setEditedData({
                                ...editedData,
                                isSuperuser: checked,
                              })
                            }
                          />
                          <Label>Admin privileges</Label>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <h2 className="text-xl font-semibold">
                            {userProfile?.name || 'Unnamed User'}
                          </h2>
                          {userProfile?.isSuperuser && (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </div>
                        <p className="text-gray-400">{userProfile?.email}</p>
                        <p className="text-gray-400">
                          <CopyableContent
                            content={userProfile?.id}
                            truncated={userProfile?.id}
                          />
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {!isEditing && (
                  <>
                    <InfoRow
                      label="Account Status"
                      values={[
                        { label: 'Active', value: userProfile?.isActive },
                        { label: 'Verified', value: userProfile?.isVerified },
                        {
                          label: 'Super User',
                          value: userProfile?.isSuperuser,
                        },
                      ]}
                    />

                    <InfoRow
                      label="Account Dates"
                      values={[
                        {
                          label: 'Created',
                          value: new Date(
                            userProfile?.createdAt || ''
                          ).toLocaleDateString(),
                        },
                        {
                          label: 'Updated',
                          value: new Date(
                            userProfile?.updatedAt || ''
                          ).toLocaleDateString(),
                        },
                      ]}
                    />
                  </>
                )}

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editedData.bio}
                        onChange={(e) =>
                          setEditedData({ ...editedData, bio: e.target.value })
                        }
                        placeholder="User bio"
                        rows={4}
                      />
                    </div>
                    <Button className="w-full" onClick={handleSaveChanges}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <>
                    {userProfile?.bio && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Bio
                        </h3>
                        <p className="text-gray-300">{userProfile.bio}</p>
                      </div>
                    )}

                    <ExpandableInfoRow
                      label="Collections"
                      values={userProfile?.collectionIds}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button color="danger" className="w-full">
                          Delete User
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the user account and remove all associated
                            data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteUser}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>Failed to load user details</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserInfoDialog;
