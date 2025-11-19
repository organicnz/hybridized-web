// Global SoundCloud widget manager to control playback across pages

interface SoundCloudWidget {
  bind: (event: string, callback: () => void) => void;
  pause: () => void;
}

class SoundCloudWidgetManager {
  private widget: SoundCloudWidget | null = null;

  setWidget(widget: SoundCloudWidget) {
    this.widget = widget;
  }

  clearWidget() {
    this.widget = null;
  }

  pause() {
    if (this.widget) {
      try {
        this.widget.pause();
        console.log("SoundCloud widget paused");
      } catch (error) {
        console.error("Failed to pause SoundCloud widget:", error);
      }
    }
  }

  hasWidget(): boolean {
    return this.widget !== null;
  }
}

// Export singleton instance
export const soundCloudManager = new SoundCloudWidgetManager();
