import { Loader } from 'lucide-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';
import { formatFileSize } from '@/lib/utils';

interface UserInfoDialogProps {
  userID: string;
  apiUrl?: string;
  open: boolean;
  onClose: () => void;
}

interface UserOverview {
  user_id: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  collection_ids: string[];
  num_files: number;
  total_size_in_bytes: number;
  document_ids: string[];
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
  return value.toString();
};

const UserInfoDialog: React.FC<UserInfoDialogProps> = ({
  userID,
  open,
  onClose,
}) => {
  const { getClient, pipeline } = useUserContext();
  const [userOverview, setUserOverview] = useState<UserOverview | null>(null);

  useEffect(() => {
    const fetchUserOverview = async () => {
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const userData = await client.usersOverview([userID]);
        setUserOverview(userData.results[0]);
      } catch (error) {
        console.error('Error fetching user overview:', error);
        setUserOverview(null);
      }
    };

    if (open && userID) {
      fetchUserOverview();
    }
  }, [open, userID]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            User Overview
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2 h-96 overflow-y-auto">
          {userOverview ? (
            <div className="grid grid-cols-1 gap-2">
              <InfoRow
                label="User ID"
                values={[{ value: userOverview.user_id }]}
              >
                {userOverview.is_superuser && (
                  <Badge variant="secondary">Superuser</Badge>
                )}
              </InfoRow>
              <InfoRow label="Email" values={[{ value: userOverview.email }]} />
              <InfoRow
                label="Account Creation"
                values={[
                  {
                    label: 'Created',
                    value: formatValue(userOverview.created_at),
                  },
                  {
                    label: 'Last Updated',
                    value: formatValue(userOverview.updated_at),
                  },
                ]}
              />
              <InfoRow
                label="Account Status"
                values={[
                  {
                    label: 'Active',
                    value: formatValue(userOverview.is_active),
                  },
                  {
                    label: 'Verified',
                    value: formatValue(userOverview.is_verified),
                  },
                ]}
              />
              <ExpandableInfoRow
                label="Collections"
                values={userOverview.collection_ids}
              />
              <InfoRow
                label="File Statistics"
                values={[
                  { label: 'Total Files', value: userOverview.num_files },
                  {
                    label: 'Total Size',
                    value: formatFileSize(userOverview.total_size_in_bytes),
                  },
                ]}
              />
              <ExpandableInfoRow
                label="Associated Documents"
                values={userOverview.document_ids}
              />
            </div>
          ) : (
            <Loader className="mx-auto mt-20 animate-spin" size={64} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
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
          {values.map((value, index) => (
            <div key={index}>{value}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserInfoDialog;
