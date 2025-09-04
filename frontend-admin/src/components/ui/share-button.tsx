'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Mail, 
  MessageCircle,
  Check,
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'button' | 'icon';
  size?: 'sm' | 'default' | 'lg';
}

export function ShareButton({ 
  url, 
  title, 
  description = '', 
  variant = 'button',
  size = 'default' 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-sky-500 hover:bg-sky-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-blue-700 hover:bg-blue-800',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Impossible de copier le lien');
    }
  };

  const openShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: fullUrl,
        });
      } catch (error) {
        // L'utilisateur a annulé ou erreur
        console.log('Partage annulé');
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Button
        variant={variant === 'icon' ? 'outline' : 'default'}
        size={size}
        onClick={handleNativeShare}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {variant === 'button' && 'Partager'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Partager cette offre</DialogTitle>
            <DialogDescription>
              Partagez cette opportunité avec votre réseau
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* URL Copy */}
            <div className="space-y-2">
              <Label>Lien de l'offre</Label>
              <div className="flex gap-2">
                <Input
                  value={fullUrl}
                  readOnly
                  className="flex-1"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="space-y-2">
              <Label>Partager sur</Label>
              <div className="grid grid-cols-2 gap-2">
                {shareLinks.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <Button
                      key={platform.name}
                      variant="outline"
                      className={`gap-2 ${platform.color} text-white border-0`}
                      onClick={() => openShare(platform.url)}
                    >
                      <Icon className="w-4 h-4" />
                      {platform.name}
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => {
                  copyToClipboard();
                  setIsOpen(false);
                }}
              >
                <Copy className="w-4 h-4" />
                Copier le lien et fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}