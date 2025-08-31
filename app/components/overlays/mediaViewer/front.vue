<script setup lang="ts">
import { storeToRefs } from 'pinia';
import useMediaViewer from '~/utils/store/mediaViewer';

// Props with TypeScript
interface Props {
  zoom: number;
  resetZoom?: () => void;
  setZoom?: (zoom: number) => void;
}
type ImageFit = 
| 'scaled-down' // No fit
| 'fit' // Fit to screen
// | 'fill' // Fill the screen
// | 'contain' // Contain within the screen
| 'cover'; // Cover the screen

const props = withDefaults(defineProps<Props>(), {
  zoom: 1,
});
const emit = defineEmits<{
  (e: 'update:zoom', value: number): void;
}>();

// Store
const mediaShowControls = ref(true);
const fullscreen = ref(false);
const animate = ref(true);
const imageFit = ref<"scaled-down" | "fit" | "cover">('scaled-down'); // Default image fit
const mediaLoadStatus = ref<"loading" | "loaded" | "error">("loading");
const initSize = ref({ width: 0, height: 0 });
const initialZoom = ref(1); // Store the calculated initial zoom level
const imageViewerStore = useMediaViewer();
const { images, currentIndex, allowZoom } = storeToRefs(imageViewerStore);

// ##################################################
// Dragging and Zooming
// ##################################################

// Dragging state
const isDragging = ref(false);
const position = ref({ x: 0, y: 0 });
const startPosition = ref({ x: 0, y: 0 });
const imageRef = useTemplateRef<HTMLImageElement>('imageRef');
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef');
const imageContainer = useTemplateRef<HTMLDivElement>('imageContainer');
const fileOffIcon = useTemplateRef('fileOffIcon');


// Reset zoom to initial calculated value instead of always 1
const resetZoom = () => {
  emit('update:zoom', initialZoom.value);
  // When resetting zoom, also center the image
  props.resetZoom?.();
};

// Navigation
const canGoPrev = computed(() => currentIndex.value > 0);
const canGoNext = computed(() => currentIndex.value < images.value.length - 1);

// ###################################################
// Media Load Handling
// ###################################################

const handleMediaLoad = () => {
  mediaLoadStatus.value = "loaded";
};

const handleMediaError = () => {
  mediaLoadStatus.value = "error";
};

// ##################################################
// Media Handling
// ##################################################

const mediaTitle = ref<string | null>(null);
const currentType = ref<"image" | "video" | "unknown" | string | null>(null);
const supportedImages = ref(['jpg', 'jpeg', 'png', 'gif', 'webp', 'octet-stream']);
const supportedVideos = ref(['mp4', 'webm', 'ogg', 'quicktime', 'octet-stream']);
const mediaTypeAka: Record<string, string> = {
  'quicktime': 'mov',
  'mpeg': 'mp3 / mp4',
  'x-matroska': 'mkv',
  'octet-stream': 'bin'
}
const currentMediaBlob = ref<Blob | null>(null);
const currentObjectUrl = ref<string | null>(null);
// const srcType = ref<'image' | 'video' | 'unknown'>('unknown');
const getMediaBlob = async () => {
  const currentImage = images.value[currentIndex.value];
  if (!currentImage) {
    throw new Error('No image found at current index');
  }
  const src = currentImage.src;
  const fetchUrl = await fetch(src, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': '0',
      'Accept': 'image/*,video/*',
    },
  });
  const blob = await fetchUrl.blob();
  return blob;
};
const srcType = ref<'image' | 'video' | 'audio' | 'unknown' | 'no-support'>('unknown');
const getMediaType = async () => {
  try {
    const blob = await getMediaBlob();
    if (!blob) {
      mediaLoadStatus.value = "error";
      return 'unknown';
    }
    currentMediaBlob.value = blob;
    const fileType = blob.type.split('/')[0];
    console.debug('File type:', fileType);
    mediaLoadStatus.value = "loading";
    const type = blob.type.split('/')[1];
    if (!type) {
      mediaLoadStatus.value = "error";
      return 'unknown';
    }
    switch (fileType) {
      case 'image': {
        allowZoom.value = true;
        console.debug('Image type:', type);
        currentType.value = type;
        if (supportedImages.value.includes(type)) {
          return 'image';
        }
        return 'no-support';
      } case 'video': {
        allowZoom.value = false;
        console.debug('Video type:', type);
        currentType.value = type;
        if (supportedVideos.value.includes(type)) {
          return 'video';
        }
        return 'no-support';
      } case 'audio': {
        currentType.value = type;
        return 'audio';
      } case 'application': {
        currentType.value = type;
        if (supportedImages.value.includes(type)) {
          allowZoom.value = true;
          return 'image';
        } else if (supportedVideos.value.includes(type)) {
          allowZoom.value = false;
          return 'video';
        } else {
          mediaLoadStatus.value = "error";
          return 'no-support';
        }
        break;
      } default:
        mediaLoadStatus.value = "error";
        return 'unknown';
        break;
    }
    return "unknown";
  } catch (error) {
    console.error('Error fetching media:', error);
    mediaLoadStatus.value = "error";
    return 'unknown';
  }
};

// Watch for image changes
watch(currentIndex, () => {
  // Reset position when changing images
  position.value = { x: 0, y: 0 };
  animate.value = false;
  mediaLoadStatus.value = "loading";
  currentObjectUrl.value = null;
  srcType.value = "unknown";
  
  // Wait for image to load for proper calculations
  nextTick(() => {
    getMediaType().then((type) => {
      if (type == 'no-support') mediaLoadStatus.value = "loaded";
      if (type == 'audio') mediaLoadStatus.value = "loaded";
      srcType.value = type;
    });
    animate.value = true;
    if (imageRef.value && imageRef.value.complete) {
      handleMediaLoad();
    }
  });
}, { immediate: true });

// ###################################################
// Fullscreen handling
// ###################################################

const fullscreenchange = () => {
  fullscreen.value = document.fullscreenElement !== null;
  if (!fullscreen.value) {
    mediaShowControls.value = true;
    fullscreenEvents.stopEvents();
  }
};

const VideoData = ref({
  src: '',
  type: '',
  paused: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
});

const overLayDisableTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

const fullscreenEvents = {
  onMouseMove: (event: MouseEvent) => {
    mediaShowControls.value = true;
    VideoShowControls.value = true;
    if (overLayDisableTimeout.value) {
      clearTimeout(overLayDisableTimeout.value);
    }
    overLayDisableTimeout.value = setTimeout(() => {
      mediaShowControls.value = false;
      VideoShowControls.value = false;
      if (overLayDisableTimeout.value) {
        clearTimeout(overLayDisableTimeout.value);
        overLayDisableTimeout.value = null;
      }
    }, 2000);
  },
  enter: () => {
    if (imageContainer.value) {
      window.addEventListener('mousemove', fullscreenEvents.onMouseMove);
      fullscreenEvents.onMouseMove(new MouseEvent('mousemove'));
      imageContainer.value.requestFullscreen();
    }
  },
  exit: () => {
    if (document.fullscreenElement) {
      fullscreenEvents.stopEvents();
      document.exitFullscreen();
      mediaShowControls.value = true;
    }
  },
  stopEvents: () => {
    window.removeEventListener('mousemove', fullscreenEvents.onMouseMove);
    if (overLayDisableTimeout.value) {
      clearTimeout(overLayDisableTimeout.value);
      overLayDisableTimeout.value = null;
    }
  },
}

const VideoInterval = ref<ReturnType<typeof setInterval> | null>(null);
const videoControlsTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const VideoShowControls = ref(false);

const video = {
  onKeyDown: (e: KeyboardEvent) => {
      if (e.key === ' ') {
          e.preventDefault();
          video.togglePlay();
      }
  },
  onMouseMove: (event: MouseEvent) => {
    VideoShowControls.value = true;
    if (videoControlsTimeout.value) {
      clearTimeout(videoControlsTimeout.value);
    }
    videoControlsTimeout.value = setTimeout(() => {
      VideoShowControls.value = false;
      if (videoControlsTimeout.value) {
        clearTimeout(videoControlsTimeout.value);
        videoControlsTimeout.value = null;
      }
    }, 2000);
  },

  startVideoInterval: () => {
    if (!videoRef.value) return;
    videoRef.value.volume = VideoData.value.volume;
    window.addEventListener('mousemove', video.onMouseMove);
    window.addEventListener('keydown', video.onKeyDown);
    video.onMouseMove(new MouseEvent('mousemove'));
    if (VideoInterval.value) {
      clearInterval(VideoInterval.value);
    }
    VideoInterval.value = setInterval(() => {
      if (videoRef.value) {
        VideoData.value.currentTime = videoRef.value.currentTime;
      }
    }, 100);
  },
  stopVideoInterval: () => {
    window.removeEventListener('mousemove', video.onMouseMove);
    window.removeEventListener('keydown', video.onKeyDown);
    if (!videoRef.value) return;
    videoRef.value?.pause();
    if (videoControlsTimeout.value) {
      clearTimeout(videoControlsTimeout.value);
      videoControlsTimeout.value = null;
    }
    if (VideoInterval.value) {
      clearInterval(VideoInterval.value);
      VideoInterval.value = null;
    }
  },
  togglePlay: () => {
    if (!videoRef.value) return;
    if (videoRef.value.paused) {
      VideoData.value.paused = false;
      videoRef.value.play();
    } else {
      VideoData.value.paused = true;
      videoRef.value.pause();
    }
  },
}

const messages = ref<{
  id: string;
  type: 'error' | 'info' | 'warning';
  message: string;
}[]>([]);

const showNextPrevious = computed(() => {
  return images.value.length > 1 && (isNextPossible.value || isPrevPossible.value);
});
const isNextPossible = computed(() => {
  if (!images.value || images.value.length === 0) return false;
  return currentIndex.value < images.value.length - 1 || imageViewerStore.allowLoop;
});
const isPrevPossible = computed(() => {
  if (!images.value || images.value.length === 0) return false;
  return currentIndex.value > 0 || imageViewerStore.allowLoop;
});

</script>

<template>
  <div class="z-0 relative w-full h-full flex items-center justify-center overflow-hidden"
    ref="imageContainer"
    @fullscreenchange="fullscreenchange"
    :class="{
      'bg-[#000]': fullscreen,
    }"
  >
    <div class="z-[2] absolute inset-0 top-0 bottom-0 left-0 right-0"
      @click="() => {
        if (!fullscreen) {
          imageViewerStore.closeViewer();
        }
      }"
    ></div>
    <OverlaysMediaViewerToolbar
      :visible="mediaShowControls"
      :zoom="props.zoom"
      :zoom-allowed="allowZoom"
      :closeViewer="imageViewerStore.closeViewer"
      :dragging="isDragging"
      :resetZoom="resetZoom"
      :currentIndex="currentIndex"
      :setZoom="props.setZoom"
      :isFullscreen="fullscreen"
      :onEnterFullscreen="fullscreenEvents.enter"
      :onExitFullscreen="fullscreenEvents.exit"
      :imageFit="imageFit"
      :onSetImageFit="(fit) => {
        imageFit = fit;
      }"
      :available-fit-options="{
        'image': ['scaled-down', 'fit', 'cover'] as ImageFit[],
        'video': [] as ImageFit[],
        'audio': [] as ImageFit[],
        'no-support': [] as ImageFit[],
        'unknown': [] as ImageFit[],
      }[srcType]"
    />
    <template v-if="srcType === 'image'">
      <OverlaysMediaViewerMedia
        class="w-full h-full"
        :media="{
          src: images[currentIndex || 0]?.src || '',
          type: srcType ? srcType as 'image' | 'video' | 'unknown' : 'unknown',
        }"
        :current-index="currentIndex"
        :zoom="props.zoom"
        :image-fit="imageFit"
        @load="handleMediaLoad"
        @error="handleMediaError"
        :is-dragging="(dragging) => {
          isDragging = dragging;
        }"
      />
    </template>
    <template v-else-if="srcType === 'video'" >
      <video
        ref="videoRef"
        class="z-10 select-none ease-out object-contain max-w-full max-h-full"
        :class="{ 'duration-300 transition-transform': !isDragging && animate,
          'w-full h-full bg-[#000]': fullscreen,
        }"
        alt="Viewer video"
        :muted="VideoData.muted"
        @vue:mounted="video.startVideoInterval"
        @vue:unmounted="video.stopVideoInterval"
        @load="handleMediaLoad"
        @loadeddata="handleMediaLoad"
        @error="handleMediaError"
        @pause="() => {
          VideoData.paused = true;
        }"
        @playing="() => {
          VideoData.paused = false;
        }"
        @volumechange="(e) => {
          if(!e.target) return;
          VideoData.volume = (e.target as HTMLVideoElement).volume;
          VideoData.muted = (e.target as HTMLVideoElement).muted;
        }"
        @click="(e) => {
          video.togglePlay();
        }"
        @dblclick="() => {
          if (fullscreen) {
            fullscreenEvents.exit();
          } else {
            fullscreenEvents.enter();
          }
        }" 
        autoplay
      >
        <source :src="images[currentIndex || 0]?.src"/>
        Your browser does not support the video tag.
      </video>
      <Transition name="lift-fade-100" mode="out-in">
        <OverlaysMediaViewerVideoControls
          v-if="videoRef && VideoShowControls"
          class="z-10"
          :videoRef="videoRef"
          :togglePlay="video.togglePlay"
          :paused="VideoData.paused"
          :duration="videoRef?.duration"
          :currentTime="VideoData.currentTime"
          :setCurrentTime="(time) => {
            if (videoRef) {
              videoRef.currentTime = time;
            }
          }"
          :volume="VideoData.volume"
          :muted="VideoData.muted"
          :setVolume="(volume) => {
            if (!videoRef) return;
            
            videoRef.volume = volume;
            videoRef.muted = volume === 0;
          }"
        />
      </Transition>
    </template>
    <!-- Navigation Buttons -->
    <div v-if="showNextPrevious" class="z-10 w-full absolute inset-0 flex items-center justify-between pointer-events-none">
      <div class="pointer-events-auto ">
        <button
          v-if="isPrevPossible"
          @click="imageViewerStore.prev"
          class="p-4"
          title="Previous"
        >
          <Icon name="mdi:chevron-left" class="text-2xl text-white" />
        </button>
      </div>
      <div class="pointer-events-auto">
        <button
          v-if="isNextPossible"
          @click="imageViewerStore.next"
          class="p-4"
          title="Next"
        >
          <Icon name="mdi:chevron-right" class="text-2xl text-white" />
        </button>
      </div>
    </div>
    <div class="absolute top-12 left-0 right-0 z-10">
      <div v-for="(msg, index) in messages" :key="msg.id" class="pointer-events-auto">
        <div :class="{
          'bg-red-800/75': msg.type === 'error',
          'bg-yellow-800/75': msg.type === 'warning',
          'bg-blue-800/75': msg.type === 'info',
        }" class="p-1 gap-4 flex items-center justify-center">
          <Icon 
            :name="{
              'error': 'mdi:alert',
              'warning': 'mdi:alert',
              'info': 'mdi:information-outline',
            }[msg.type]"
            class="text-white w-8 h-8" />
          <span class="text-white text-sm">{{ msg.message }}</span>
          <button @click="messages.splice(index, 1)" class="text-white hover:text-gray-300">
            <Icon name="mdi:close" class="w-4 h-4" />
          </button>
        </div>
      </div>
      <template v-if="srcType === 'audio'">
        <div class="w-full bg-yellow-800/75 p-1 gap-4 flex items-center justify-center">
          <Icon name="mdi:file-question" class="text-white w-8 h-8" ref="fileOffIcon" />
          <div class="flex flex-col">
            <span class="text-white text-lg">Audio file detected.</span>
            <span class="text-white text-sm">Audio files are not supported in this viewer.</span>
          </div>
        </div>
      </template>
      <template v-if="srcType === 'no-support'">
        <div class="w-full bg-yellow-800/75 p-1 gap-4 flex items-center justify-center">
          <Icon name="mdi:file-question" class="text-white w-8 h-8" ref="fileOffIcon" />
          <div class="flex flex-col">
            <span class="text-white text-lg">Unsupported media type. The browser may not support this file.</span>
            <span class="text-white text-sm">Only the following formats are supported: {{ supportedImages.join(', ') }} and {{ supportedVideos.map(format => mediaTypeAka[format] ? `${format} (${mediaTypeAka[format]})` : format).join(', ') }}</span>
            <span v-if="currentType" class="text-white text-sm">Current type: {{ currentType }} <template v-if="mediaTypeAka[currentType]">({{ mediaTypeAka[currentType] }})</template></span>
          </div>
        </div>
      </template>
      <div
        v-if="mediaLoadStatus === 'error'"
        class="pointer-events-none"
      >
        <div class="bg-red-800/75 p-1 gap-4 flex items-center justify-center">
          <Icon name="mdi:warning" class="text-white w-8 h-8" ref="fileOffIcon" />
          <div class="flex flex-col">
            <span class="text-white text-lg">Media failed to load.</span>
            <span class="text-white text-sm">Cannot determine the media type if the file does not exist.</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="mediaLoadStatus === 'loading'"
      class="z-10 absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div class="bg-black/75 p-4 rounded-full flex items-center justify-center">
        <Icon name="mdi:loading" class="animate-spin text-white text-4xl" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure image is non-selectable */
img {
  user-select: none;
  -webkit-user-drag: none;
}

/* Smooth transitions for buttons */
button {
  transition: background-color 0.3s ease;
}
</style>