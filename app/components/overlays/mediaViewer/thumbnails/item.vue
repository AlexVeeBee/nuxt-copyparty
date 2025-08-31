<script setup lang="ts">
import type { DetailedMedia } from '~/utils/store/mediaViewer';

type MediTypes = 
| 'video'
| 'image'
| 'audio'
| 'unknown'
| 'no-support';
const currentType = ref<MediTypes>('unknown');
const supportedImages = ref(['jpg', 'jpeg', 'png', 'gif', 'webp']);
const supportedVideos = ref(['mp4', 'webm', 'ogg', 'quicktime']);
const mediaTypeAka: Record<string, string> = {
  'quicktime': 'mov',
  'mpeg': 'mp3/mp4',
}
const currentMediaBlob = ref<Blob | null>(null);
const currentObjectUrl = ref<string | null>(null);
// const srcType = ref<'image' | 'video' | 'unknown'>('unknown');
const getMediaBlob = async (src: string) => {
    if (!src) {
        return null;
    }
    const fetchUrl = await fetch(src, {
        headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': '0',
        'Accept': 'image/*,video/*',
        },
    });
    return fetchUrl.blob();
};
const getMediaType = async (src: string) => {
  try {
    const blob = await getMediaBlob(src);
    if (!blob) {
      return 'unknown';
    }
    currentMediaBlob.value = blob;
    const fileType = blob.type.split('/')[0];
    console.debug('File type:', fileType);
    switch (fileType) {
      case 'image':
        const imageType = blob.type.split('/')[1];
        console.debug('Image type:', imageType);
        currentType.value = imageType as MediTypes;
        if (supportedImages.value.includes(imageType)) {
          return 'image';
        }
        return 'no-support';
      case 'video':
        const videotype = blob.type.split('/')[1];
        console.debug('Video type:', videotype);
        currentType.value = videotype as MediTypes;
        if (supportedVideos.value.includes(videotype)) {
          return 'video';
        }
        return 'no-support';
      case 'audio':
        const audiotype = blob.type.split('/')[1];
        currentType.value = audiotype as MediTypes;
        return 'audio';
      case 'application':
        const type = blob.type.split('/')[1];
        console.debug('Application type:', type);
        currentType.value = type as MediTypes;
        if (supportedImages.value.includes(type)) {
          return 'image';
        } else if (supportedVideos.value.includes(type)) {
          return 'video';
        }
        return 'no-support';
      default:
        return 'unknown';
    }
  } catch (error) {
    console.error('Error fetching media:', error);
    return 'unknown';
  }
};

const props = defineProps<{
  path: string;
}>();

const generateThumbnail = (path: string, type: string) => {
    switch (type) {
        case 'video':
            return new Promise(async (resolve, reject) => {
                const video = await getMediaBlob(path);
                if (!video) {
                    reject('No video blob');
                    return;
                }
                const videoElement = document.createElement('video');
                videoElement.src = URL.createObjectURL(video);
                videoElement.addEventListener('loadeddata', () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 90;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL());
                    } else {
                        reject(new Error('Failed to get canvas context'));
                    }
                });
                videoElement.addEventListener('error', () => {
                    reject(new Error('Failed to load video'));
                });
            });
        default:
            return Promise.resolve(path);
    }
};

const loading = ref(true);
const image = ref<string | null>(null);
const error = ref(false);

const loadImage = async () => {
    loading.value = true;
    error.value = false;
    image.value = null;

    const type = await getMediaType(props.path);
    if (type === 'no-support') {
        error.value = true;
        loading.value = false;
        return;
    }
    currentType.value = type;

    if (type === 'image' || type === 'video') {
        switch (type) {
            case 'image':
                image.value = props.path;
                break;
            case 'video':
                const thumbnail = await generateThumbnail(props.path, type) || null;
                if (thumbnail && thumbnail.toString().includes('data:image')) {
                    image.value = thumbnail.toString();
                } else {
                    image.value = props.path;
                }                
                break;
            default:
                image.value = null;
        }
        loading.value = false;
    } else {
        error.value = true;
        loading.value = false;
    }
};
const onLoad = async () => {
};
const onError = () => {
    error.value = true;
    loading.value = false;
    image.value = null;
};

onMounted(() => {
  loadImage();
});

</script>

<template>
    <div class="w-16 h-16">
        <template v-if="loading">
            <div class="w-full h-full bg-gray-800 flex items-center justify-center">
                <Icon name="mdi:loading" class="w-8 h-8 text-gray-500 animate-spin" />
            </div>
        </template>
        <template v-else>
            <template v-if="image">
                <img 
                    :src="image" alt="Video Thumbnail" 
                    @load="onLoad"
                    @error="onError"
                    class="w-full h-full object-cover"
                />
            </template>
            <div v-else class="w-full h-full bg-gray-800 flex items-center justify-center">
                <Icon
                    :name="{
                        'image': 'material-symbols:image',
                        'video': 'material-symbols:video-file',
                        'audio': 'material-symbols:audio-file',
                        'unknown': 'mdi:help-circle',
                        'no-support': 'mdi:help-circle',
                    }[currentType] || 'mdi:warning'"
                    class="text-3xl text-gray-500"
                />
            </div>
        </template>
    </div>
</template>