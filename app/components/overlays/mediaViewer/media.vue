<script setup lang="ts">
import { storeToRefs } from 'pinia';
import useMediaViewer from '~/utils/store/mediaViewer';
import { useMouse } from '@vueuse/core';

const store = useMediaViewer();

const props = defineProps<{
    media: { src: string, type: "image" | "video" | "unknown" } | null;
    zoom: number;
    resetZoom?: () => void;
    onLoad?: () => void;
    onError?: () => void;
    isDragging?: (dragging: boolean) => void;
    imageFit: "scaled-down" | "fit" | "cover";
}>();
// ##################################################
// State Management
// ##################################################

const animate = ref(true);
const fullscreen = ref(false);
const mediaLoadStatus = ref<"loading" | "loaded" | "error">("loading");
const imageRef = useTemplateRef<HTMLImageElement>('imageRef');
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef');
const imageContainer = useTemplateRef<HTMLDivElement>('imageContainer');

// ##################################################
// Dragging and Zooming
// ##################################################

const initSize = ref({ width: 0, height: 0 });
const initialZoom = ref(1); // Store the calculated initial zoom level

const isDragging = ref(false);
const startPosition = ref({ x: 0, y: 0 });
const position = ref({ x: 0, y: 0 });

// const fileOffIcon = useTemplateRef('fileOffIcon');

// Image dimensions
const imageDimensions = ref({ width: 0, height: 0 });

const mouse = useMouse({
  target: imageContainer,
});

const getLastCursor = () => {
  mouse.x.value = store.lastCursor.x;
  mouse.y.value = store.lastCursor.y;
};

onMounted(() => {
  getLastCursor();
});
onUnmounted(() => {
  store.lastCursor = { x: mouse.x.value, y: mouse.y.value };
});

const getCursorOffsetFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const offsetX = mouse.x.value - rect.left - scrollX;
  const offsetY = mouse.y.value - rect.top - scrollY;
  return {
    x: offsetX,
    y: offsetY,
  };
};

// Calculate initial zoom to fit image properly in viewport
const calculateInitialZoom = () => {
  if (!imageRef.value || !imageContainer.value) return 1;
  
  const img = imageRef.value;
  const container = imageContainer.value;
  
  // Save the natural dimensions for reference
  initSize.value = {
    width: img.naturalWidth,
    height: img.naturalHeight
  };
  
  // Calculate ratios
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // If image is smaller than viewport, no need to zoom
  if (img.naturalWidth <= containerWidth && img.naturalHeight <= containerHeight) {
    return 1;
  }
  
  // Calculate zoom ratios to fit image in viewport (similar to Telegram's resizeContentByScreenSize)
  const widthRatio = containerWidth / img.naturalWidth;
  const heightRatio = containerHeight / img.naturalHeight;

  // Move the image to where the cursor is
  const cursorPos = {
    x: position.value.x + (img.naturalWidth / 2),
    y: position.value.y + (img.naturalHeight / 2),
  };
  // Use the smaller ratio to ensure image fits in both dimensions
  // Apply a small margin (95%) to ensure it's not right at the edge
  return Math.min(widthRatio, heightRatio) * 0.95;
};

// Handle window resize
const updateImageDimensions = () => {
  if (imageRef.value) {
    const img = imageRef.value;
    imageDimensions.value = {
      width: img.width * props.zoom,
      height: img.height * props.zoom,
    };
  }
};

// Snap image to viewport edges
const snapToEdges = () => {
  if (!imageRef.value) return;
  if (!imageContainer.value) return;
  const { width, height } = imageDimensions.value;
  const viewportWidth = imageContainer.value?.clientWidth;
  const viewportHeight = imageContainer.value?.clientHeight;

  // Calculate bounds
  const maxX = Math.max(0, (width - viewportWidth) / 2);
  const maxY = Math.max(0, (height - viewportHeight) / 2);

  // Snap to edges or center
  if (width <= viewportWidth) {
    position.value.x = 0; // Center horizontally
  } else {
    position.value.x = Math.max(-maxX, Math.min(maxX, position.value.x));
  }

  if (height <= viewportHeight) {
    position.value.y = 0; // Center vertically
  } else {
    position.value.y = Math.max(-maxY, Math.min(maxY, position.value.y));
  }
};

const HandleZoom = (newValues: [number], oldValues: [number]) => {
  const [newZoom] = newValues;
  const [oldZoom] = oldValues || [null];
  
  // If it's just a zoom change (not an image change)
  if (oldZoom !== null) {
    const zoomFactor = newZoom / oldZoom;
    
    if (imageContainer.value) {
      // Calculate the point to zoom towards (cursor position)
      const containerRect = imageContainer.value.getBoundingClientRect();
      const zoomOrigin = getCursorOffsetFromElement(imageContainer.value);
      const zoomOriginX = zoomOrigin.x;
      const zoomOriginY = zoomOrigin.y;

      // Calculate the vector from zoom origin to current position
      const dx = zoomOriginX - (containerRect.width / 2 + position.value.x);
      const dy = zoomOriginY - (containerRect.height / 2 + position.value.y);
      
      // Apply zoom adjustment to position
      position.value = {
        x: position.value.x - dx * (zoomFactor - 1),
        y: position.value.y - dy * (zoomFactor - 1)
      };
    }
  }
  
  updateImageDimensions();
  snapToEdges();
};

// Reset position when index or zoom changes
watch([() => props.zoom], (newValues, oldValues) => {
  HandleZoom(newValues, oldValues);
  updateImageDimensions();
  snapToEdges();
});

// Dragging handlers
const startDragging = (event: MouseEvent) => {
    event.preventDefault();
    const isRightClick = event.button === 2;
    if (isRightClick) {
        event.preventDefault();
        return;
    }
    isDragging.value = true;
    props.isDragging?.(true);
    startPosition.value = {
        x: event.clientX - position.value.x,
        y: event.clientY - position.value.y,
    };
};

const onDragging = (event: MouseEvent) => {
    if (!isDragging.value) return;
    position.value = {
        x: event.clientX - startPosition.value.x,
        y: event.clientY - startPosition.value.y,
    };
    snapToEdges();
};

const stopDragging = (event: MouseEvent) => {
    isDragging.value = false;
    props.isDragging?.(false);
};

// Reset zoom to initial calculated value instead of always 1
const resetZoom = () => {
    // When resetting zoom, also center the image
    props.resetZoom?.();
    position.value = { x: 0, y: 0 };
    nextTick(() => {
        updateImageDimensions();
        snapToEdges();
        position.value = { x: 0, y: 0 };
    });
};

// Prevent default image drag
const preventDefaultDrag = (event: Event) => {
  event.preventDefault();
};

// Handle window resize
const handleResize = () => {
  // Recalculate initial zoom when window is resized
  const newZoom = calculateInitialZoom();
  initialZoom.value = newZoom;
  
  updateImageDimensions();
  snapToEdges();
};

const centerImage = () => {
  if (!imageRef.value || !imageContainer.value) return;
  position.value = { x: 0, y: 0 };
};

// Track cursor position for zoom
const StartDownPos = ref({ x: 0, y: 0 });
const EndUpPos = ref({ x: 0, y: 0 });
const containerClickDown = (event: MouseEvent) => {
  StartDownPos.value = {
    x: event.clientX,
    y: event.clientY,
  };
};
const containerClickUp = (event: MouseEvent) => {
  if (fullscreen.value) return;
  const isRightClick = event.button === 2;
  if (isRightClick) {
    event.preventDefault();
    return;
  }

  EndUpPos.value = {
    x: event.clientX,
    y: event.clientY,
  };
  // check if the cursor moved more than 5px
  const movedX = Math.abs(EndUpPos.value.x - StartDownPos.value.x);
  const movedY = Math.abs(EndUpPos.value.y - StartDownPos.value.y);
  // if so, do not close the viewer
  if (movedX > 5 || movedY > 5) {
    return;
  }
  
  // if clicked on the image, exit the viewer
  if (event.target === imageRef.value) {
    store.closeViewer();
  }
};

onMounted(() => {
  // Calculate initial zoom when component is mounted
  initialZoom.value = calculateInitialZoom();
  updateImageDimensions();
  snapToEdges();
  
  // Add event listeners for resizing
  window.addEventListener('resize', handleResize);
});

watch(() => props.imageFit, (newImageFit) => {
    nextTick(() => {
        updateImageDimensions();
        snapToEdges();
    });
});

</script>

<template>
    <div
        ref="imageContainer"
        class="relative cursor-move flex items-center justify-center overflow-hidden"
        @mousedown.prevent="startDragging"
        @mousemove.prevent="onDragging"
        @mouseup.prevent="stopDragging"
        @mouseleave.prevent="stopDragging"
        @contextmenu.prevent="preventDefaultDrag"
        @click="containerClickUp"
        @mousedown.capture="containerClickDown"
    >
        <img
            v-if="media && media.type === 'image'"
            ref="imageRef"
            :src="media.src"
            :style="{
                transform: `translate(${position.x}px, ${position.y}px) scale(${props.zoom})`,
                cursor: isDragging ? 'grabbing' : 'grab',
            }"
            class="z-10 select-none ease-out object-contain"
            :class="{ 'duration-300 transition-transform': !isDragging && animate,
                'max-w-full max-h-full': imageFit === 'scaled-down',
                'bg-[#000] !object-contain max-w-none max-h-none size-full': imageFit === 'fit',
                'max-w-none': imageFit === 'cover',
            }"
            @mouseup="stopDragging"
            @mousedown="startDragging"
            @dragstart="preventDefaultDrag"
            @dragend="preventDefaultDrag"
            @load="onLoad ? onLoad() : null"
            @error="onError ? onError() : null"
            alt="Viewer image"
        />
        <video
            v-else-if="media && media.type === 'video'"
            ref="videoRef"
            controls
            class="w-full h-full object-contain transition-transform duration-300 ease-in-out"
            @dragstart.prevent
        >
            <source :src="media.src" type="video/mp4">
                Your browser does not support the video tag.
            </source>
        </video>
        <template v-else>
            <div class="text-white text-center">
                <p class="text-lg">Unable to display media</p>
            </div>
        </template>
    </div>
</template>