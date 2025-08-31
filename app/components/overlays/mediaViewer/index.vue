<script setup lang="ts">
import { NuxtErrorBoundary } from '#components';
import useMediaViewer from '~/utils/store/mediaViewer';

const store = useMediaViewer();
const zoom = ref(1);
const min_zoom = 0.25;
const max_zoom = 15; // Match Telegram's kMaxZoomLevel of 7 (x8)
const ctrlHold = ref(false);

// Handle keyboard navigation
const onArrowKeyDown = (event: KeyboardEvent) => {
    if (!store.isOpen) return;
    
    switch (event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            event.preventDefault();
            event.stopPropagation();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            event.stopPropagation();
            store.prev();
            break;
        case 'ArrowRight':
            event.preventDefault();
            event.stopPropagation();
            store.next();
            break;
        case 'Escape':
            event.preventDefault();
            event.stopPropagation();
            store.closeViewer();
            break;
        case 'Control':
            ctrlHold.value = true;
            break;
        case '+':
        case '=':
            // Zoom in with + key
            event.preventDefault();
            zoomIn();
            break;
        case '-':
            // Zoom out with - key
            event.preventDefault();
            zoomOut();
            break;
        case '0':
            // Reset zoom with 0 key
            event.preventDefault();
            resetZoom();
            break;
    }
};

const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control') {
        ctrlHold.value = false;
    }
};

// Zoom functions
const zoomIn = () => {
    zoom.value = Math.min(zoom.value + 0.25, max_zoom);
};

const zoomOut = () => {
    zoom.value = Math.max(zoom.value - 0.25, min_zoom);
};

const resetZoom = () => {
    zoom.value = 1;
};

const lastCurrentIndex = ref(-1);

// Handle mouse wheel for zoom and navigation
const onScroll = (event: WheelEvent) => {
    if (!store.isOpen) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey) {
        if (!store.allowZoom) return;
        // Zoom with Ctrl + wheel
        const delta = -Math.sign(event.deltaY) * 0.25;
        zoom.value = Math.max(min_zoom, Math.min(max_zoom, zoom.value + delta));
    } else {
        // Navigate with wheel
        if (event.deltaY < 0) {
            store.prev();
        } else {
            store.next();
        }
    }
};

// Start/stop event handlers
const stopHandlers = () => {
    document.removeEventListener('keydown', onArrowKeyDown);
    document.removeEventListener('keyup', onKeyUp);
};

const startHandlers = () => {
    document.addEventListener('keydown', onArrowKeyDown);
    document.addEventListener('keyup', onKeyUp);
};

onMounted(() => {
    startHandlers();
});

onUnmounted(() => {
    stopHandlers();
});

// Reset zoom when viewer opens or image changes
watch(
    () => store.isOpen,
    (newValue) => {
        if (newValue) {
            lastCurrentIndex.value = store.currentIndex;
            zoom.value = 1;
        }
    },
    { immediate: true }
);

watch(
    () => store.currentIndex,
    (newIndex) => {
        if (lastCurrentIndex.value !== newIndex) {
            lastCurrentIndex.value = newIndex;
            zoom.value = 1; // Reset zoom when changing images
        }
    }
);

const imageData = ref({
    width: 0,
    height: 0,
    size: 0,
});

// const getImageData = async () => {
//     if (!store.isOpen) return;
//     const image = store.images[store.currentIndex];
//     const imgel = new Image();
//     imgel.src = image;

//     const xhr = new XMLHttpRequest();
//     xhr.open('HEAD', image, false);
//     xhr.send(null);
//     if (xhr.status !== 200) {
//         return {
//             width: 0,
//             height: 0,
//             size: 0,
//         };
//     }
//     imgel.src = image;
//     imgel.onload = () => {
//         imgel.width = imgel.width;
//         imgel.height = imgel.height;
//     };
//     imgel.onerror = () => {
//         console.error('Error loading image');
//     };
    
//     imageData.value = {
//         width: imgel.width,
//         height: imgel.height,
//         size: parseInt(xhr.getResponseHeader('Content-Length') || '0', 10),
//     };
// };

// watch(
//     () => store.currentIndex,
//     async () => {
//         await getImageData();
//     },
//     { immediate: true }
// );

const bytesToSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
};
const imageinfoOpen = ref(false);
</script>

<template>
    <div class="fixed z-[80] inset-0 flex items-center justify-center pointer-events-none
        transition-[background-color] duration-300 ease-in-out"
        :class="{
            'bg-black/90': store.isOpen,
        }"
    >
        <Transition name="scale-fade" mode="out-in">
            <div
                v-if="store.isOpen"
                class="fixed pointer-events-auto inset-0 flex"
               
            >
                <div class="border-r border-gray-800 bg-black/90 h-full" v-if="imageinfoOpen">
                    <div class="p-2 border-b border-gray-800">
                        <h1 class="text-white text-lg h-min text-nowrap flex items-center gap-2">
                            <Icon name="mdi:image" class="text-2xl cursor-pointer" @click="store.prev" />
                            Image Information
                        </h1>
                    </div>
                    <div class="p-4">
                        <p class="text-white text-sm">
                            {{ imageData.width }} x {{ imageData.height }} px
                        </p>
                        <p class="text-white text-sm">
                            {{ bytesToSize(imageData.size) }}
                        </p>
                    </div>
                </div>
                <NuxtErrorBoundary>
                    <template #error="e">
                        <div class="flex flex-col w-full h-full overflow-auto">
                            <div class="text-white text-center my-32 max-w-[1200px] mx-auto">
                                <h1 class="text-2xl font-bold mb-4">
                                    {{ e.error.message }}
                                </h1>
                                <pre class="text-sm text-gray-400 text-left overflow-auto">{{ e.error.stack }}</pre>
                                <div class="flex justify-center mt-12 items-center">
                                    <p class="text-white text-lg">Press <span class="font-bold">ESC</span> to close</p>
                                    <button class="ml-4 text-white text-lg btn btn-icon" @click="store.closeViewer">
                                        <Icon name="mdi:close" class="text-2xl" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #default>
                        <OverlaysMediaViewerFront
                            :images="store.images"
                            :currentIndex="store.currentIndex"
                            :closeViewer="store.closeViewer"
                            :prev="store.prev"
                            :next="store.next"
                            :zoom="zoom"
                            :min_zoom="min_zoom"
                            :max_zoom="max_zoom"
                            :reset-zoom="resetZoom"
                            :set-zoom="(zoomValue) => (zoom = zoomValue)"
                            @wheel.prevent="onScroll"
                        />

                        <div v-if="store.images[store.currentIndex]?.description" class="pointer-events-none absolute left-0 right-0 flex justify-center text-white"
                            :class="{
                                'bottom-4': true,
                                // 'bottom-24': store.images.length > 1,
                                // 'bottom-4': store.images.length <= 1,
                            }"
                        >
                            <div class="bg-black/90 p-2 rounded-md">
                                <p class="text-sm">
                                    {{ store.images[store.currentIndex]?.description }}
                                </p>
                            </div>
                        </div>

                        <!-- Add thumbnails stripe if we have multiple images -->
                        <OverlaysMediaViewerThumbnailsStripe
                            v-if="store.images.length > 1"
                            :images="store.images"
                            :currentIndex="store.currentIndex"
                            :maxVisible="7"
                            @wheel.prevent="onScroll"
                        />
                    </template>
                </NuxtErrorBoundary>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>