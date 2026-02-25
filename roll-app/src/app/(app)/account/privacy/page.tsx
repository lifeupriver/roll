'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Database, Users, Clock, Trash2, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';

interface PrivacyData {
  photo_count: number;
  total_bytes: number;
  circle_count: number;
  circles: { id: string; name: string; isOwner: boolean }[];
  account_created_at: string;
  last_login: string;
  email: string;
  privacy_statement: string;
}

export default function PrivacyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    async function fetchPrivacy() {
      try {
        const res = await fetch('/api/account/privacy');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchPrivacy();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account/privacy', { method: 'DELETE' });
      if (res.ok) {
        toast('Account deletion initiated. You will be logged out.', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        const json = await res.json();
        toast(json.error || 'Failed to delete account', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          type="button"
          onClick={() => router.push('/account')}
          className="p-2 -ml-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Privacy & Data
        </h1>
      </div>

      {/* Privacy promise */}
      <Card className="p-[var(--space-component)] bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
        <div className="flex items-start gap-3">
          <Shield size={24} className="text-[var(--color-action)] flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[var(--color-ink)]">
              Our Privacy Promise
            </h2>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mt-1">
              {data?.privacy_statement}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          <Card className="p-[var(--space-component)] flex items-center gap-3">
            <Database size={20} className="text-[var(--color-ink-tertiary)]" />
            <div>
              <p className="font-[family-name:var(--font-mono)] font-bold text-[var(--color-ink)]">
                {data.photo_count.toLocaleString()}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Photos ({formatBytes(data.total_bytes)})
              </p>
            </div>
          </Card>
          <Card className="p-[var(--space-component)] flex items-center gap-3">
            <Users size={20} className="text-[var(--color-ink-tertiary)]" />
            <div>
              <p className="font-[family-name:var(--font-mono)] font-bold text-[var(--color-ink)]">
                {data.circle_count}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Circles</p>
            </div>
          </Card>
          <Card className="p-[var(--space-component)] flex items-center gap-3">
            <Clock size={20} className="text-[var(--color-ink-tertiary)]" />
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink)]">
                {data.account_created_at ? new Date(data.account_created_at).toLocaleDateString() : '—'}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Member since</p>
            </div>
          </Card>
          <Card className="p-[var(--space-component)] flex items-center gap-3">
            <Lock size={20} className="text-[var(--color-ink-tertiary)]" />
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink)]">
                {data.email}
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Account</p>
            </div>
          </Card>
        </div>
      )}

      {/* Circle memberships */}
      {data && data.circles.length > 0 && (
        <div className="flex flex-col gap-[var(--space-tight)]">
          <h3 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">
            Circle Memberships
          </h3>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            These circles can see photos you share with them.
          </p>
          {data.circles.map((circle) => (
            <div key={circle.id} className="flex items-center gap-2 py-1.5">
              <Users size={14} className="text-[var(--color-ink-tertiary)]" />
              <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">{circle.name}</span>
              {circle.isOwner && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-action)] bg-[var(--color-action)]/10 px-1.5 py-0.5 rounded">
                  Owner
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Data export */}
      <Card className="p-[var(--space-component)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-[var(--color-ink-tertiary)]" />
            <div>
              <p className="font-medium text-[var(--color-ink)]">Export Your Data</p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Download all your photos and account data
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            Request Export
          </Button>
        </div>
      </Card>

      {/* Delete account */}
      <Card className="p-[var(--space-component)] border-[var(--color-error)]/30">
        <div className="flex flex-col gap-[var(--space-element)]">
          <div className="flex items-center gap-3">
            <Trash2 size={20} className="text-[var(--color-error)]" />
            <div>
              <p className="font-medium text-[var(--color-error)]">Delete Account</p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
          </div>
          {!confirmDelete ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="self-start text-[var(--color-error)]"
            >
              Delete My Account
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                isLoading={deleting}
                className="text-[var(--color-error)] border border-[var(--color-error)]"
              >
                Yes, permanently delete everything
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
