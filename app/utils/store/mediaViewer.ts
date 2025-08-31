export interface DetailedMedia {
    id: string;
    src: string;
    description?: string;
}

interface MediaMetadata {
    type: string;
    width: number;
    height: number;
    size: number;
}

const useMediaViewer = defineStore('imageViewer', {
    state: () => ({
        lastCursor: { x: 0, y: 0 },
        images: [] as DetailedMedia[],
        // metadata: {} as Record<string, MediaMetadata>,
        currentIndex: 0,
        isOpen: false,
        isLoading: false,
        allowLoop: true,
        allowZoom: true,
        historyStates: [] as { images: DetailedMedia[], index: number }[],
    }),
    actions: {
        async openViewer(images: DetailedMedia[], index: number = 0) {
            this.images = images;
            this.currentIndex = index;
            if (index < 0 || index >= this.images.length) {
                this.currentIndex = Math.max(0, Math.min(index, this.images.length - 1));
            }

            // Save to history for browser back button support
            this.historyStates.push({
                images: [...images],
                index: this.currentIndex
            });
            this.isOpen = true;

            // Preload adjacent images
            this.preloadAdjacentImages();
        },
        
        closeViewer() {
            this.isOpen = false;
            this.historyStates = [];
        },
        
        setImages(images: DetailedMedia[]) {
            this.images = images;
            // Preload adjacent images when set changes
            this.preloadAdjacentImages();
        },
        
        setLoading(loading: boolean) {
            this.isLoading = loading;
        },
        
        next() {
            if (this.currentIndex < this.images.length - 1) {
                this.currentIndex++;
                this.preloadAdjacentImages();
            } else if (this.allowLoop) {
                this.currentIndex = 0;
                this.preloadAdjacentImages();
            }
        },
        
        prev() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.preloadAdjacentImages();
            } else if (this.allowLoop) {
                this.currentIndex = this.images.length - 1;
                this.preloadAdjacentImages();
            }
        },
        
        // Jump to specific index
        goTo(index: number) {
            if (index >= 0 && index < this.images.length) {
                this.currentIndex = index;
                this.preloadAdjacentImages();
            }
        },
        
        // Toggle looping behavior
        toggleLoop() {
            this.allowLoop = !this.allowLoop;
        },
        
        // Preload adjacent images for smoother navigation
        preloadAdjacentImages() {
            const preloadCount = 0; // Number of images to preload in each direction
            
            if (!this.images.length) return;
            
            for (let i = 1; i <= preloadCount; i++) {
                // Preload next images
                const nextIndex = this.currentIndex + i;
                if (nextIndex < this.images.length) {
                    const img = new Image();
                    img.src = this.images[nextIndex || 0]?.src || "";
                }
                
                // Preload previous images
                const prevIndex = this.currentIndex - i;
                if (prevIndex >= 0) {
                    const img = new Image();
                    img.src = this.images[prevIndex]?.src || "";
                }
            }
        },
    },
    getters: {
        currentImage: (state) => state.images[state.currentIndex] || '',
        hasNext: (state) => state.currentIndex < state.images.length - 1 || state.allowLoop,
        hasPrev: (state) => state.currentIndex > 0 || state.allowLoop,
        totalImages: (state) => state.images.length,
    }
});
export default useMediaViewer;