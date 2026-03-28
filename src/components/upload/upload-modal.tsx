'use client';

import { useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/stores/ui-store';
import { useUploadStore, type UploadFile } from '@/stores/upload-store';
import { useAccounts } from '@/hooks/use-accounts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Upload,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlertTriangle,
  Calendar,
  Zap,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function StepIndicator({ current }: { current: number }) {
  const steps = ['Account', 'Upload', 'Captions', 'Schedule'];
  return (
    <nav
      aria-label="Upload steps"
      className="mb-6 w-full min-w-0 border-b border-border pb-4"
    >
      <ol className="grid w-full grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-3">
        {steps.map((label, i) => (
          <li key={label} className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                i + 1 === current
                  ? 'bg-primary text-primary-foreground'
                  : i + 1 < current
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1 < current ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="min-w-0 text-xs font-medium leading-tight sm:text-sm">
              {label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Step1AccountSelect() {
  const { data: accounts, isLoading } = useAccounts();
  const { selectedAccountIds, setSelectedAccounts } = useUploadStore();

  const toggle = (id: string) => {
    setSelectedAccounts(
      selectedAccountIds.includes(id)
        ? selectedAccountIds.filter((a) => a !== id)
        : [...selectedAccountIds, id]
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!accounts?.length) {
    return (
      <div className="w-full min-w-0 px-1 py-8 text-center text-muted-foreground">
        <p className="text-pretty text-sm leading-relaxed sm:text-base">
          No accounts available. Create one from Accounts first, then return here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {accounts.map((acc) => (
        <button
          key={acc.id}
          onClick={() => toggle(acc.id)}
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
            selectedAccountIds.includes(acc.id)
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/30'
          )}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={acc.avatar_url ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {acc.display_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{acc.display_name}</p>
            <p className="text-xs text-muted-foreground">
              {acc.instagram_username ? `@${acc.instagram_username}` : 'Not connected'}
            </p>
          </div>
          {selectedAccountIds.includes(acc.id) && (
            <Check className="h-5 w-5 text-primary shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}

function Step2FileUpload() {
  const { files, addFiles, removeFile } = useUploadStore();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
      const maxSize = 50 * 1024 * 1024;
      const newFiles: UploadFile[] = [];

      Array.from(fileList).forEach((file) => {
        if (!allowed.includes(file.type)) {
          toast.error(`${file.name}: unsupported format`);
          return;
        }
        if (file.size > maxSize) {
          toast.error(`${file.name}: exceeds 50MB limit`);
          return;
        }
        newFiles.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          hash: '',
          isDuplicate: false,
          status: 'pending',
          progress: 0,
        });
      });

      if (newFiles.length) addFiles(newFiles);
    },
    [addFiles]
  );

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.accept = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
          input.onchange = () => input.files && handleFiles(input.files);
          input.click();
        }}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Drop files here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">JPEG, PNG, WebP, MP4, MOV — max 50MB, up to 30 files</p>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {files.map((f) => (
            <div key={f.id} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-muted">
                {f.file.type.startsWith('video') ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <button
                onClick={() => removeFile(f.id)}
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              {f.isDuplicate && (
                <div className="absolute bottom-1 left-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Step3Captions() {
  const { captions, updateCaption } = useUploadStore();

  if (!captions.length) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Generating captions with AI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {captions.map((cap, i) => (
        <div key={cap.postId} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Post {i + 1}</span>
            <Badge variant="secondary">
              {cap.status === 'generating' ? 'Generating...' : cap.status === 'error' ? 'Error' : 'Ready'}
            </Badge>
          </div>
          <div className="space-y-2">
            <Label>Caption</Label>
            <Textarea
              rows={4}
              value={cap.caption}
              onChange={(e) => updateCaption(cap.postId, { caption: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {cap.hashtags.map((h) => (
              <Badge key={h} variant="outline" className="text-xs">
                #{h}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step4Schedule() {
  const { scheduleMode, setScheduleMode, files } = useUploadStore();

  const modes = [
    { value: 'now' as const, label: 'Publish Now', icon: Zap, desc: 'Publish immediately' },
    { value: 'optimal' as const, label: 'Optimal Times', icon: Clock, desc: 'AI picks best times' },
    { value: 'even' as const, label: 'Even Distribution', icon: Calendar, desc: 'Spread evenly across days' },
    { value: 'custom' as const, label: 'Custom', icon: Calendar, desc: 'Pick times manually' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Schedule {files.length} post{files.length !== 1 ? 's' : ''}.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setScheduleMode(mode.value)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
              scheduleMode === mode.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            )}
          >
            <mode.icon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium text-sm">{mode.label}</p>
              <p className="text-xs text-muted-foreground">{mode.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen } = useUIStore();
  const { currentStep, setStep, selectedAccountIds, files, reset } = useUploadStore();
  const [submitting, setSubmitting] = useState(false);

  const canNext =
    (currentStep === 1 && selectedAccountIds.length > 0) ||
    (currentStep === 2 && files.length > 0) ||
    currentStep === 3 ||
    currentStep === 4;

  const handleClose = () => {
    setUploadModalOpen(false);
    reset();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/uploads/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: selectedAccountIds[0],
          files: files.map((f) => ({
            media_type: f.file.type.startsWith('video') ? 'video' : 'image',
            media_urls: [f.previewUrl],
            media_hash: f.hash || null,
          })),
        }),
      });

      if (!res.ok) throw new Error('Upload failed');
      toast.success('Upload batch created! AI is generating captions.');
      handleClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={uploadModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        showCloseButton
        className={cn(
          'flex max-h-[90vh] w-full min-w-0 flex-col gap-0 overflow-hidden p-0',
          'max-w-[calc(100vw-1rem)] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl'
        )}
      >
        <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-2 pt-12 sm:px-8 sm:pb-4 sm:pt-14">
          <DialogHeader className="space-y-1 pb-4 pr-2 text-left sm:pb-5">
            <DialogTitle className="text-lg sm:text-xl">Upload Content</DialogTitle>
          </DialogHeader>

          <StepIndicator current={currentStep} />

          <div className="min-w-0 pb-2">
            {currentStep === 1 && <Step1AccountSelect />}
            {currentStep === 2 && <Step2FileUpload />}
            {currentStep === 3 && <Step3Captions />}
            {currentStep === 4 && <Step4Schedule />}
          </div>
        </div>

        <div className="flex shrink-0 justify-between gap-3 border-t border-border bg-muted/30 px-5 py-4 sm:px-8">
          <Button
            variant="outline"
            onClick={() => currentStep > 1 ? setStep((currentStep - 1) as 1 | 2 | 3 | 4) : handleClose()}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={() => setStep((currentStep + 1) as 1 | 2 | 3 | 4)}
              disabled={!canNext}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm & Schedule
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
