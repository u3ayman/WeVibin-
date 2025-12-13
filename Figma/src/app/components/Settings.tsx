import { Volume2, Mic, Keyboard, Bell } from 'lucide-react';

export function Settings() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="mb-8">Settings</h1>

        {/* Audio Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-5 h-5 text-primary" />
            <h2>Audio</h2>
          </div>
          <div className="space-y-4 bg-card rounded-xl p-6 border border-border">
            <div>
              <label className="block mb-2">Output Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block mb-2">Music Ducking (when someone speaks)</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="40"
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-primary" />
            <h2>Voice</h2>
          </div>
          <div className="space-y-4 bg-card rounded-xl p-6 border border-border">
            <div>
              <label className="block mb-2">Input Sensitivity</label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="60"
                className="w-full accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div>Push-to-Talk Mode</div>
                <div className="text-sm text-muted-foreground">
                  Requires holding a key to transmit voice
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border space-y-3">
            <div className="flex justify-between items-center py-2">
              <span>Push-to-Talk</span>
              <kbd className="px-3 py-1 bg-muted rounded border border-border font-mono">
                Space
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Play/Pause</span>
              <kbd className="px-3 py-1 bg-muted rounded border border-border font-mono">
                Ctrl + P
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Skip Forward</span>
              <kbd className="px-3 py-1 bg-muted rounded border border-border font-mono">
                Ctrl + →
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span>Skip Back</span>
              <kbd className="px-3 py-1 bg-muted rounded border border-border font-mono">
                Ctrl + ←
              </kbd>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h2>Notifications</h2>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div>Friend comes online</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when friends go online
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div>Party invites</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when invited to parties
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
