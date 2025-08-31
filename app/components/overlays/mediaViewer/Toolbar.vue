<script setup lang="ts">
import useMediaViewer from '~/utils/store/mediaViewer'; '~/utils/store/mediaViewer';

type ImageFit = 
| 'scaled-down' // No fit
| 'fit' // Fit to screen
// | 'fill' // Fill the screen
// | 'contain' // Contain within the screen
| 'cover'; // Cover the screen

const ImageFitOptions: ImageFit[] = [
    'scaled-down',
    'fit',
    'cover',
];

const ImageFitIcons = {
    "scaled-down": 'mdi:crop-free',
    fit: 'mdi:fit-to-page',
    fill: 'mdi:fill',
    contain: 'mdi:contain',
    cover: 'mdi:crop-square',
};

const store = useMediaViewer();
const props = withDefaults(defineProps<{
    title?: string;
    visible: boolean;
    zoom?: number;
    currentIndex: number;
    dragging: boolean;
    closeViewer: () => void;
    resetZoom: () => void;
    setZoom?: (zoom: number) => void;
    zoomAllowed?: boolean;
    isFullscreen?: boolean;
    onEnterFullscreen?: () => void;
    onExitFullscreen?: () => void;
    imageFit?: ImageFit;
    onSetImageFit?: (size: ImageFit) => void;
    availableFitOptions?: ImageFit[];
}>(), {
    title: 'Media Viewer',
    zoomAllowed: true,
});
const zoomOptsOpen = ref(false);
const zooming = ref(false);
const zoomingTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
watch(
    () => props.zoom,
    (newZoom) => {
        zooming.value = true;
        zoomingTimeout.value && clearTimeout(zoomingTimeout.value);
        zoomingTimeout.value = setTimeout(() => {
            zooming.value = false;
        }, 500);
    },
);
const showFitTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showFitUpdate = ref(false);
const showMain = computed(() => {
    const isDragging = props.dragging;
    const isZooming = zooming.value;
    const isZoomingOpen = zoomOptsOpen.value;
    return !isDragging && !isZooming && !isZoomingOpen;
});

watch(
    () => props.imageFit,
    (newFit) => {
        showFitUpdate.value = true;
        showFitTimeout.value && clearTimeout(showFitTimeout.value);
        showFitTimeout.value = setTimeout(() => {
            showFitUpdate.value = false;
        }, 3000);
    },
);

const currentFit = computed(() => {
    return props.imageFit || 'scaled-down';
});

const ExitTimeout = () => {
    props.onExitFullscreen?.();
    props.closeViewer?.();
}

const availableFitOptions = computed(() => {
    return props.availableFitOptions || ImageFitOptions;
});

</script>

<template>
    <div class="absolute z-20 w-full top-0">
        <template v-if="visible">
            <div class="w-full"
                :class="{
                    'pointer-events-none': dragging,
                }"
                v-if="!isFullscreen"
            >
                <div class="bg-black/75 border-b border-gray-800">
                    <Transition name="lift-fade-100" mode="out-in">
                        <div v-if="showMain" class="flex justify-between items-center">
                            <div class="p-2 pl-4 flex gap-2">
                                <h1 class="text-white text-lg max-md:hidden">
                                    {{ title }}
                                </h1>
                                <h3
                                    v-if="title == 'Media Viewer'"
                                    class="text-yellow-300 text-lg max-md:hidden"
                                >
                                    BETA 0.5.0
                                </h3>
                            </div>
                            <div class="flex items-center gap-4 px-2">
                                <h1 class="text-lg text-white" v-if="store.images.length > 1">
                                    {{ currentIndex + 1 }} / {{ store.images.length }}
                                </h1>
                                <div class="flex cursor-pointer border border-gray-400 rounded-lg overflow-hidden" v-if="imageFit && onSetImageFit && availableFitOptions.length > 0">
                                    <div v-for="(size, index) in availableFitOptions"
                                        :key="index"
                                        @click="() => {
                                            onSetImageFit?.(size);
                                        }"
                                        class="text-white text-lg p-1"
                                        :class="{
                                            'bg-primary/20': currentFit === size,
                                        }"
                                    >
                                        <Icon :name="ImageFitIcons[size]" />
                                    </div>
                                </div>
                                <template v-if="zoomAllowed">
                                    <div class="cursor-pointer border px-2 border-gray-400 rounded-lg" v-if="zoom"
                                        @click="resetZoom" 
                                        data-tooltip="Reset zoom"
                                        data-tooltip-position="bottom"
                                    >
                                        <div class="text-white text-md">
                                            {{ Math.round(zoom * 100) }}%
                                        </div>
                                    </div>
                                    <button 
                                        v-else
                                        @click="resetZoom" 
                                        class="py-2 text-white hover:text-gray-400 focus:outline-none pointer-events-auto"
                                        title="Reset zoom"
                                    >
                                        <Icon name="mdi:magnify-minus" />
                                    </button>
                                </template>
                                <button 
                                    v-if="!props.isFullscreen && props.onEnterFullscreen"
                                    @click="onEnterFullscreen"
                                    class="py-2 text-white text-2xl hover:text-gray-400 focus:outline-none pointer-events-auto"
                                    title="Enter fullscreen"
                                >
                                    <Icon name="mdi:fullscreen" />
                                </button>
                                <button
                                    @click="closeViewer"
                                    class="py-2 text-white text-2xl hover:text-gray-400 focus:outline-none pointer-events-auto"
                                    title="Close viewer"
                                >
                                    <Icon name="mdi:close" />
                                </button>
                            </div>
                        </div>
                        <div v-else class="flex justify-center items-center gap-2">
                            <template v-if="dragging">
                                <div class="p-2 flex items-center gap-2">
                                    <Icon name="ant-design:drag" class="text-white text-2xl" />
                                    <h1 class="text-white text-lg">Dragging</h1>
                                </div>
                            </template>
                            <template v-if="zoom && zooming">
                                <div class="p-2 flex items-center gap-2">
                                    <Icon name="mdi:magnify" class="text-white text-2xl" />
                                    <h1 class="text-white text-lg">{{ Math.round(zoom * 100) }}%</h1>
                                </div>
                            </template>
                        </div>
                    </Transition>
                </div>
            </div>
            <div class="z-20 relative flex items-center justify-end bg-black/75 border-b border-gray-800"
                :class="{
                    'pointer-events-none': dragging,
                }"
                v-if="isFullscreen"
            >
                <div class="flex items-center gap-2">
                    <Transition name="fade" mode="out-in">
                        <div class="bg-black/75 cursor-pointer border px-2 border-gray-400 rounded-lg" 
                            v-if="zoom && zoom !== 1"
                            @click="resetZoom" 
                            title="Reset zoom"
                        >
                            <div class="text-white text-lg">
                                {{ Math.round(zoom * 100) }}%
                            </div>
                        </div>
                    </Transition>
                    <button 
                        @click="onExitFullscreen"
                        class="p-2 text-white text-2xl hover:text-gray-400 focus:outline-none pointer-events-auto"
                        title="Exit fullscreen"
                    >
                        <Icon name="mdi:fullscreen-exit" class="text-white text-2xl" />
                    </button>
                    <button 
                        @click="ExitTimeout"
                        class="p-2 text-white text-2xl hover:text-gray-400 focus:outline-none pointer-events-auto"
                        title="Close viewer"
                    >
                        <Icon name="mdi:close" class="text-white text-2xl" />
                    </button>
                </div>
            </div>
        </template>
        <div v-if="showFitUpdate" class="bg-black/75 border-b border-gray-800 flex justify-center items-center">
            <div>
                <div class="p-2 flex items-center gap-2">
                <Icon 
                    :name="ImageFitIcons[currentFit]"
                    class="text-white text-2xl" />
                    <h1 class="text-white text-lg">
                        {{ currentFit }}
                    </h1>
                </div>
            </div>
        </div>
    </div>
</template>