// Lower Third Graphics Service for Live Streaming
// Handles text overlays, Bible verses, and animated graphics

export interface LowerThirdTemplate {
  id: string;
  name: string;
  type: 'name' | 'verse' | 'announcement' | 'custom';
  style: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
    fontSize: number;
    fontFamily: string;
    animation: 'slide' | 'fade' | 'typewriter' | 'none';
    position: 'bottom' | 'top' | 'center';
    width: number; // percentage
    height: number; // pixels
  };
  layout: {
    showIcon: boolean;
    showBackground: boolean;
    showBorder: boolean;
    borderRadius: number;
    padding: number;
    margin: number;
  };
}

export interface LowerThirdContent {
  id: string;
  templateId: string;
  title: string;
  subtitle?: string;
  verse?: {
    text: string;
    reference: string;
    translation: string;
  };
  duration: number; // seconds, 0 = manual
  isActive: boolean;
  timestamp: number;
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  translation: string;
}

class LowerThirdService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private overlayStream: MediaStream | null = null;
  private isInitialized = false;
  
  // Active graphics
  private activeGraphics: Map<string, LowerThirdContent> = new Map();
  private templates: Map<string, LowerThirdTemplate> = new Map();
  
  // Animation system
  private animationFrameId: number | null = null;
  private startTime = 0;
  
  // Event listeners
  private listeners: Map<string, Function[]> = new Map();

  // Default templates
  private defaultTemplates: LowerThirdTemplate[] = [
    {
      id: 'modern-name',
      name: 'Modern Name',
      type: 'name',
      style: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        textColor: '#ffffff',
        accentColor: '#3b82f6',
        fontSize: 24,
        fontFamily: 'Inter, sans-serif',
        animation: 'slide',
        position: 'bottom',
        width: 40,
        height: 80
      },
      layout: {
        showIcon: true,
        showBackground: true,
        showBorder: true,
        borderRadius: 8,
        padding: 16,
        margin: 32
      }
    },
    {
      id: 'elegant-verse',
      name: 'Elegant Verse',
      type: 'verse',
      style: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        textColor: '#f8fafc',
        accentColor: '#fbbf24',
        fontSize: 20,
        fontFamily: 'Georgia, serif',
        animation: 'fade',
        position: 'bottom',
        width: 70,
        height: 120
      },
      layout: {
        showIcon: true,
        showBackground: true,
        showBorder: false,
        borderRadius: 12,
        padding: 24,
        margin: 40
      }
    },
    {
      id: 'simple-announcement',
      name: 'Simple Announcement',
      type: 'announcement',
      style: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        textColor: '#ffffff',
        accentColor: '#fbbf24',
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        animation: 'typewriter',
        position: 'top',
        width: 60,
        height: 60
      },
      layout: {
        showIcon: false,
        showBackground: true,
        showBorder: false,
        borderRadius: 6,
        padding: 12,
        margin: 24
      }
    }
  ];

  // Initialize the graphics system
  async initialize(videoWidth: number = 1280, videoHeight: number = 720): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('[LowerThird] Initializing graphics system...');
      
      // Create canvas for graphics rendering
      this.canvas = document.createElement('canvas');
      this.canvas.width = videoWidth;
      this.canvas.height = videoHeight;
      this.ctx = this.canvas.getContext('2d');
      
      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Load default templates
      this.loadDefaultTemplates();
      
      // Create overlay stream from canvas
      this.overlayStream = this.canvas.captureStream(30); // 30 FPS
      
      this.isInitialized = true;
      console.log('[LowerThird] Graphics system initialized');
      
      this.emit('initialized', { width: videoWidth, height: videoHeight });
    } catch (error) {
      console.error('[LowerThird] Initialization failed:', error);
      throw error;
    }
  }

  // Load default templates
  private loadDefaultTemplates(): void {
    this.defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
    console.log(`[LowerThird] Loaded ${this.defaultTemplates.length} default templates`);
  }

  // Create custom template
  createTemplate(template: Omit<LowerThirdTemplate, 'id'>): string {
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: LowerThirdTemplate = {
      ...template,
      id
    };
    
    this.templates.set(id, newTemplate);
    this.emit('templateCreated', { template: newTemplate });
    
    console.log(`[LowerThird] Created custom template: ${newTemplate.name}`);
    return id;
  }

  // Show lower third graphic
  showLowerThird(content: Omit<LowerThirdContent, 'id' | 'timestamp'>): string {
    const id = `graphic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const graphic: LowerThirdContent = {
      ...content,
      id,
      timestamp: Date.now(),
      isActive: true
    };
    
    this.activeGraphics.set(id, graphic);
    
    // Auto-hide after duration if specified
    if (content.duration > 0) {
      setTimeout(() => {
        this.hideLowerThird(id);
      }, content.duration * 1000);
    }
    
    this.startRendering();
    this.emit('graphicShown', { graphic });
    
    console.log(`[LowerThird] Showing graphic: ${content.title}`);
    return id;
  }

  // Hide lower third graphic
  hideLowerThird(graphicId: string): void {
    const graphic = this.activeGraphics.get(graphicId);
    if (graphic) {
      graphic.isActive = false;
      
      // Remove after animation completes
      setTimeout(() => {
        this.activeGraphics.delete(graphicId);
        if (this.activeGraphics.size === 0) {
          this.stopRendering();
        }
      }, 1000); // 1 second for exit animation
      
      this.emit('graphicHidden', { graphicId });
      console.log(`[LowerThird] Hiding graphic: ${graphicId}`);
    }
  }

  // Hide all graphics
  hideAllGraphics(): void {
    const activeIds = Array.from(this.activeGraphics.keys());
    activeIds.forEach(id => this.hideLowerThird(id));
  }

  // Show Bible verse
  showVerse(verse: BibleVerse, templateId: string = 'elegant-verse', duration: number = 10): string {
    return this.showLowerThird({
      templateId,
      title: verse.text,
      subtitle: verse.reference,
      verse: {
        text: verse.text,
        reference: verse.reference,
        translation: verse.translation
      },
      duration,
      isActive: true
    });
  }

  // Show name/title
  showName(name: string, title?: string, templateId: string = 'modern-name', duration: number = 8): string {
    return this.showLowerThird({
      templateId,
      title: name,
      subtitle: title,
      duration,
      isActive: true
    });
  }

  // Show announcement
  showAnnouncement(message: string, templateId: string = 'simple-announcement', duration: number = 5): string {
    return this.showLowerThird({
      templateId,
      title: message,
      duration,
      isActive: true
    });
  }

  // Start rendering loop
  private startRendering(): void {
    if (this.animationFrameId) return;
    
    this.startTime = performance.now();
    this.render();
  }

  // Stop rendering loop
  private stopRendering(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clear canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  // Main rendering function
  private render = (): void => {
    if (!this.ctx || !this.canvas) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render all active graphics
    for (const graphic of this.activeGraphics.values()) {
      this.renderGraphic(graphic, elapsed);
    }
    
    // Continue animation if there are active graphics
    if (this.activeGraphics.size > 0) {
      this.animationFrameId = requestAnimationFrame(this.render);
    } else {
      this.animationFrameId = null;
    }
  };

  // Render individual graphic
  private renderGraphic(graphic: LowerThirdContent, elapsed: number): void {
    if (!this.ctx || !this.canvas) return;
    
    const template = this.templates.get(graphic.templateId);
    if (!template) return;
    
    const ctx = this.ctx;
    const canvas = this.canvas;
    
    // Calculate dimensions and position
    const width = (canvas.width * template.style.width) / 100;
    const height = template.style.height;
    
    let x = template.layout.margin;
    let y: number;
    
    switch (template.style.position) {
      case 'top':
        y = template.layout.margin;
        break;
      case 'center':
        y = (canvas.height - height) / 2;
        break;
      case 'bottom':
      default:
        y = canvas.height - height - template.layout.margin;
        break;
    }
    
    // Apply animation
    const animationProgress = this.calculateAnimationProgress(graphic, elapsed);
    const animatedPosition = this.applyAnimation(template, { x, y, width, height }, animationProgress, graphic.isActive);
    
    // Draw background
    if (template.layout.showBackground) {
      ctx.fillStyle = template.style.backgroundColor;
      this.drawRoundedRect(ctx, animatedPosition.x, animatedPosition.y, animatedPosition.width, animatedPosition.height, template.layout.borderRadius);
      ctx.fill();
    }
    
    // Draw border
    if (template.layout.showBorder) {
      ctx.strokeStyle = template.style.accentColor;
      ctx.lineWidth = 2;
      this.drawRoundedRect(ctx, animatedPosition.x, animatedPosition.y, animatedPosition.width, animatedPosition.height, template.layout.borderRadius);
      ctx.stroke();
    }
    
    // Draw text content
    this.drawTextContent(ctx, graphic, template, animatedPosition, animationProgress);
  }

  // Calculate animation progress (0 to 1)
  private calculateAnimationProgress(graphic: LowerThirdContent, elapsed: number): number {
    const graphicAge = elapsed - (graphic.timestamp - this.startTime);
    const animationDuration = 1000; // 1 second animation
    
    if (!graphic.isActive) {
      // Exit animation
      return Math.max(0, 1 - (graphicAge / animationDuration));
    } else {
      // Enter animation
      return Math.min(1, graphicAge / animationDuration);
    }
  }

  // Apply animation to position
  private applyAnimation(template: LowerThirdTemplate, position: any, progress: number, isEntering: boolean): any {
    const { animation } = template.style;
    
    switch (animation) {
      case 'slide':
        if (isEntering) {
          return {
            ...position,
            x: position.x - (position.width * (1 - progress))
          };
        } else {
          return {
            ...position,
            x: position.x - (position.width * (1 - progress))
          };
        }
      
      case 'fade':
        return {
          ...position,
          opacity: progress
        };
      
      case 'typewriter':
        return {
          ...position,
          textProgress: progress
        };
      
      default:
        return position;
    }
  }

  // Draw text content
  private drawTextContent(ctx: CanvasRenderingContext2D, graphic: LowerThirdContent, template: LowerThirdTemplate, position: any, progress: number): void {
    const padding = template.layout.padding;
    
    // Set text properties
    ctx.fillStyle = template.style.textColor;
    ctx.font = `${template.style.fontSize}px ${template.style.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Apply opacity for fade animation
    if (position.opacity !== undefined) {
      ctx.globalAlpha = position.opacity;
    }
    
    let textY = position.y + padding;
    
    // Draw title
    if (graphic.title) {
      let displayTitle = graphic.title;
      
      // Apply typewriter effect
      if (template.style.animation === 'typewriter' && position.textProgress !== undefined) {
        const charCount = Math.floor(graphic.title.length * position.textProgress);
        displayTitle = graphic.title.substring(0, charCount);
      }
      
      ctx.fillText(displayTitle, position.x + padding, textY);
      textY += template.style.fontSize + 8;
    }
    
    // Draw subtitle
    if (graphic.subtitle) {
      ctx.font = `${template.style.fontSize * 0.7}px ${template.style.fontFamily}`;
      ctx.fillStyle = template.style.accentColor;
      ctx.fillText(graphic.subtitle, position.x + padding, textY);
    }
    
    // Draw verse reference (if it's a verse)
    if (graphic.verse && template.type === 'verse') {
      ctx.font = `${template.style.fontSize * 0.6}px ${template.style.fontFamily}`;
      ctx.fillStyle = template.style.accentColor;
      const referenceY = position.y + position.height - padding - (template.style.fontSize * 0.6);
      ctx.fillText(`- ${graphic.verse.reference} (${graphic.verse.translation})`, position.x + padding, referenceY);
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
  }

  // Draw rounded rectangle
  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Get overlay stream for compositing with video
  getOverlayStream(): MediaStream | null {
    return this.overlayStream;
  }

  // Get all templates
  getTemplates(): LowerThirdTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get template by ID
  getTemplate(templateId: string): LowerThirdTemplate | null {
    return this.templates.get(templateId) || null;
  }

  // Get active graphics
  getActiveGraphics(): LowerThirdContent[] {
    return Array.from(this.activeGraphics.values());
  }

  // Update template
  updateTemplate(templateId: string, updates: Partial<LowerThirdTemplate>): void {
    const template = this.templates.get(templateId);
    if (template) {
      const updatedTemplate = { ...template, ...updates };
      this.templates.set(templateId, updatedTemplate);
      this.emit('templateUpdated', { template: updatedTemplate });
    }
  }

  // Delete template
  deleteTemplate(templateId: string): void {
    if (this.templates.delete(templateId)) {
      this.emit('templateDeleted', { templateId });
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[LowerThird] Event callback error for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  cleanup(): void {
    console.log('[LowerThird] Cleaning up graphics system...');
    
    this.stopRendering();
    this.hideAllGraphics();
    
    if (this.overlayStream) {
      this.overlayStream.getTracks().forEach(track => track.stop());
      this.overlayStream = null;
    }
    
    this.activeGraphics.clear();
    this.listeners.clear();
    this.canvas = null;
    this.ctx = null;
    this.isInitialized = false;
    
    console.log('[LowerThird] Cleanup complete');
  }
}

// Create singleton instance
export const lowerThirdService = new LowerThirdService();
