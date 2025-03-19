import { Loader, UserPlus } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onUserCreated?: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  open,
  onClose,
  onUserCreated,
}) => {
  const { createUser } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await createUser({ email, password, role });
      setSuccess(true);
      setEmail('');
      setPassword('');
      setRole('user');
      console.log('User created successfully:', newUser);

      // Call the onUserCreated callback if provided
      if (onUserCreated) {
        onUserCreated();
      }

      // Close the dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'Error creating user. Please try again.');
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    // Reset form state when dialog is closed
    setEmail('');
    setPassword('');
    setRole('user');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-full bg-muted">
              <UserPlus size={24} />
            </div>
            <div>
              <DialogTitle>Create New User</DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">{role}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              required
              disabled={isLoading}
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              required
              disabled={isLoading}
              placeholder="••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              disabled={isLoading}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>User created successfully!</AlertDescription>
            </Alert>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 text-primary bg-blue-600 rounded-md 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500 
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader className="animate-spin mr-2" size={16} />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserForm;
