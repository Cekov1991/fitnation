import { IonModal, IonButton } from '@ionic/react';
import { Share, PlusSquare, X } from 'lucide-react';

interface InstallInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

/**
 * iOS Install Instructions Modal
 * 
 * Since iOS Safari doesn't support the beforeinstallprompt event,
 * we need to show manual instructions for adding the app to the home screen.
 * 
 * Steps for iOS users:
 * 1. Tap the Share button in Safari
 * 2. Scroll down and tap "Add to Home Screen"
 */
export function InstallInstructionsModal({ 
  isOpen, 
  onClose, 
  onDismiss 
}: InstallInstructionsModalProps) {
  
  const handleDismiss = () => {
    onDismiss();
    onClose();
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose}
      initialBreakpoint={0.5}
      breakpoints={[0, 0.5, 0.75]}
      style={{
        '--background': 'var(--color-bg-modal)',
      } as React.CSSProperties}
    >
      <div 
        className="p-6 h-full"
        style={{ 
          backgroundColor: 'var(--color-bg-modal)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-xl font-bold bg-clip-text text-transparent"
            style={{ 
              backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' 
            }}
          >
            Install Fit Nation
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ 
              backgroundColor: 'var(--color-border-subtle)',
              color: 'var(--color-text-secondary)'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <p 
          className="mb-6 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Install this app on your iPhone for the best experience:
        </p>

        <div className="space-y-4 mb-8">
          {/* Step 1 */}
          <div 
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-surface)' }}
          >
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
            >
              <Share 
                className="w-5 h-5" 
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
            <div>
              <p className="font-semibold mb-1">Step 1</p>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Tap the <strong>Share</strong> button at the bottom of Safari
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div 
            className="flex items-start gap-4 p-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-bg-surface)' }}
          >
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
            >
              <PlusSquare 
                className="w-5 h-5" 
                style={{ color: 'var(--color-secondary)' }}
              />
            </div>
            <div>
              <p className="font-semibold mb-1">Step 2</p>
              <p 
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Scroll down and tap <strong>"Add to Home Screen"</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <IonButton 
            expand="block" 
            onClick={onClose}
            style={{
              '--background': 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, var(--color-secondary)))',
              '--border-radius': '12px',
              '--box-shadow': '0 4px 15px color-mix(in srgb, var(--color-primary) 30%, transparent)',
            } as React.CSSProperties}
          >
            Got it!
          </IonButton>
          
          <IonButton 
            expand="block" 
            fill="clear"
            onClick={handleDismiss}
            style={{
              '--color': 'var(--color-text-muted)',
            } as React.CSSProperties}
          >
            Don't show again
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
}
