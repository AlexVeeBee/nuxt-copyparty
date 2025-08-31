<script setup lang="ts">
import type { DetailedMedia } from '~/utils/store/mediaViewer';
import useMediaViewer from '~/utils/store/mediaViewer';
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  images: DetailedMedia[];
  currentIndex: number;
  maxVisible?: number;
}>();

const store = useMediaViewer();
const thumbnailsRef = ref<HTMLDivElement | null>(null);
const showThumbnails = ref(false);
const showThumbsTimer = ref<number | null>(null);

// Default to 5 visible thumbnails
const visibleThumbnails = props.maxVisible || 5;

// Calculate which thumbnails to show
const thumbnailsToShow = computed(() => {
  const { currentIndex, images } = props;
  
  // If we have fewer images than the max visible, show all
  if (images.length <= visibleThumbnails) {
    return images.map((details, i) => ({ details, index: i }));
  }
  
  // Calculate how many thumbnails to show on each side
  const half = Math.floor(visibleThumbnails / 2);
  let startIdx = currentIndex - half;
  let endIdx = currentIndex + half;
  
  // Adjust if we're near the beginning
  if (startIdx < 0) {
    endIdx -= startIdx; // Add the overflow to the end
    startIdx = 0;
  }
  
  // Adjust if we're near the end
  if (endIdx >= images.length) {
    startIdx = Math.max(0, startIdx - (endIdx - images.length + 1));
    endIdx = images.length - 1;
  }
  
  // Create array of visible thumbnails
  return images
    .slice(startIdx, endIdx + 1)
    .map((details, idx) => ({ details, index: startIdx + idx }));
});

// Toggle thumbnails visibility
const toggleThumbnails = () => {
  showThumbnails.value = !showThumbnails.value;
}


// Navigation via thumbnails
const goToImage = (index: number) => {
  store.goTo(index);
};

</script>

<template>
  <div>
    <!-- Toggle button -->
    <button 
      @click="toggleThumbnails" 
      class="fixed bottom-4 right-4 z-30 bg-black/75 hover:bg-black/90 p-2 rounded-lg text-white flex items-center space-x-2 transition-all"
      :class="{ 'bg-blue-900/90 hover:bg-blue-800/90 ': showThumbnails }"
    >
      <Icon name="mdi:image-multiple" class="w-6 h-6" />
    </button>
    
    <!-- Thumbnails stripe -->
    <Transition name="slide-up">
      <div 
        v-if="showThumbnails" 
        class="fixed bottom-0 left-0 right-0 overflow-x-auto py-2 px-4 bg-black/75 z-20"
        ref="thumbnailsRef"
      >
        <div class="flex justify-center items-center space-x-2">
          <!-- Show all thumbnails with current one highlighted -->
          <OverlaysMediaViewerThumbnailsItem
            v-for="item in thumbnailsToShow" 
            :path="item.details.src"
            :key="item.index"
            :class="[
              'w-16 h-16 flex-shrink-0 relative cursor-pointer',
              { 'border-2 border-blue-500 transform scale-110': item.index === currentIndex }
            ]"
            @click="goToImage(item.index)"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
