'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount, useDeleteAccount, useConnectAccount } from '@/hooks/use-accounts';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Plus, Link2, Trash2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AccountsPage() {
  const { data: accounts, isLoading } = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const connectAccount = useConnectAccount();

  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createAccount.mutateAsync({ display_name: newName });
      setNewName('');
      setDialogOpen(false);
      toast.success('Account created');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this account? This cannot be undone.')) return;
    try {
      await deleteAccount.mutateAsync(id);
      toast.success('Account deleted');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleConnect = async (id: string) => {
    try {
      await connectAccount.mutateAsync(id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage your Instagram influencer accounts.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Account</DialogTitle>
              <DialogDescription>
                Add a new influencer persona. You can connect Instagram later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  placeholder="e.g. Mia Fitness"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim() || createAccount.isPending}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !accounts?.length ? (
        <EmptyState
          icon={Users}
          title="No accounts yet"
          description="Create your first influencer account to get started."
          action={{ label: 'Add Account', onClick: () => setDialogOpen(true) }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={account.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {account.display_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{account.display_name}</h3>
                    {account.instagram_username ? (
                      <p className="text-sm text-muted-foreground">@{account.instagram_username}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    )}
                    <div className="mt-2">
                      <StatusBadge status={account.api_status} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {!account.instagram_user_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleConnect(account.id)}
                      disabled={connectAccount.isPending}
                    >
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Connect Instagram
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" render={<Link href={`/accounts/${account.id}`} />}>
                      <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                      Configure
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(account.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
