<script setup lang="ts">

const props = defineProps<{
    videoRef: HTMLVideoElement | null;
    togglePlay: () => void;
    paused: boolean;
    duration: number;
    currentTime: number;
    setCurrentTime?: (time: number) => void;
    volume?: number;
    muted?: boolean;
    setVolume?: (volume: number) => void;
}>();

const setGlobalVolume = (volume: number) => {
    if (props.setVolume) {
        props.setVolume(volume);
    } else if (props.videoRef) {
        props.videoRef.volume = volume;
    } else {
        console.warn('No video reference or setVolume function provided');
    }
};

const VolumeIconComputed = computed(() => {
    if (typeof props.volume === 'undefined') { 
        return 'material-symbols:volume-off'; 
    }
    if (props.muted) {
        return 'material-symbols:volume-off';
    }
    if (props.volume > 0.5) {
        return 'material-symbols:volume-up';
    } else if (props.volume > 0) {
        return 'material-symbols:volume-down';
    } else {
        return 'mdi:question-mark';
    }
});

const toggleMute = () => {
    if (props.videoRef) {
        props.videoRef.muted = !props.videoRef.muted;
    }
};

const addZero = (num: number) => {
    return num < 10 ? '0' + num : num;
};

const secondsToTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const hoursVisible = hours > 0;

    return `${hoursVisible ? addZero(hours) + ':' : ''}${addZero(minutes)}:${addZero(secs)}`;
};

</script>

<template>
    <div v-if="videoRef" class="px-32 w-full max-w-[800px] pointer-events-auto absolute bottom-12">
        <div class="w-full bg-black/90 p-4 rounded-md flex flex-col gap-4 *:text-white">
            <div class="flex gap-4">
                <p>{{ secondsToTime(currentTime) }}</p>
                <input step="0.01" type="range" min="0" :max="duration" :value="currentTime" class="w-full"
                    @input="(e) => setCurrentTime && setCurrentTime(parseFloat(((e.target as HTMLInputElement).value)))"
                    @change="(e) => setCurrentTime && setCurrentTime(parseFloat(((e.target as HTMLInputElement).value)))"
                />
                <p>{{ secondsToTime(duration) }}</p>
            </div>
            <div class="w-full flex items-center">
                <div class="left w-full flex gap-4 items-center">
                    <template v-if="props.setVolume">
                        <div class="cursor-pointer" @click="toggleMute">
                            <Icon :name="VolumeIconComputed" class="text-2xl" />
                        </div>
                        <input type="range" min="0" max="100" :value="videoRef?.volume * 100" class=""
                            @input="(e) => setGlobalVolume(parseFloat(((e.target as HTMLInputElement).value)) / 100)"
                            @change="(e) => setGlobalVolume(parseFloat(((e.target as HTMLInputElement).value)) / 100)"
                        />
                    </template>
                </div>
                <div class="center flex gap-4 items-center">
                    <button @click="togglePlay">
                        <Icon :name="paused ? 'material-symbols:play-arrow' : 'material-symbols:pause'" class="text-2xl" />
                    </button>
                </div>
                <div class="right w-full">
                </div>
            </div>
        </div>
    </div>
</template>