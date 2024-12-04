// UserInfoDialog.tsx
import { Loader, UserRound, ChevronDown, ChevronUp } from 'lucide-react';
import { User } from 'r2r-js';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import CopyableContent from '@/components/ui/CopyableContent';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const { getClient } = useUserContext();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id || !open) return;

      try {
        setLoading(true);
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const user = await client.users.retrieve({ id });
        setUserProfile(user.results);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, open, getClient]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
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
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-semibold">
                        {userProfile?.name || 'Unnamed User'}
                      </h2>
                      {userProfile?.is_superuser && (
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
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <InfoRow
                  label="Account Status"
                  values={[
                    { label: 'Active', value: userProfile?.is_active },
                    { label: 'Verified', value: userProfile?.is_verified },
                    { label: 'Super User', value: userProfile?.is_superuser },
                  ]}
                />

                <InfoRow
                  label="Account Dates"
                  values={[
                    {
                      label: 'Created',
                      value: new Date(
                        userProfile?.created_at || ''
                      ).toLocaleDateString(),
                    },
                    {
                      label: 'Updated',
                      value: new Date(
                        userProfile?.updated_at || ''
                      ).toLocaleDateString(),
                    },
                  ]}
                />

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
                  values={userProfile?.collection_ids}
                />
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
