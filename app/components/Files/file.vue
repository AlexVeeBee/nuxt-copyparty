<script setup lang="ts">
const props = defineProps<{
    type: 'file' | 'directory';
    name: string;
    size: number;
    modified: string;
    pathFromRoot?: string; // Optional prop to pass the full path
    onClick?: () => void;
}>();

const fileTypeIcons = {
    file: 'mdi:file',
    directory: 'mdi:folder',
    file_image: 'mdi:file-image',
    file_video: 'mdi:file-video',
    file_audio: 'mdi:file-music',
    file_doc: 'mdi:file-document',
    file_zip: 'mdi:zip-box',
    file_text: 'mdi:file-document-outline'
};

const estimatedFileType = computed(() => {
    if (props.type === 'directory') return 'directory';
    const ext = props.name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'webp':
            return 'file_image';
        case 'mp4':
        case 'avi':
            return 'file_video';
        case 'mp3':
        case 'wav':
            return 'file_audio';
        case 'pdf':
        case 'docx':
            return 'file_doc';
        case 'zip':
            return 'file_zip';
        case 'txt':
            return 'file_text';
        default:
            return 'file';
    }
});
const bytesToSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// const contextMenu = useContextMenuStore();

// const downloadFile = () => {
//     if (props.type !== 'file') return; // Only allow download for files
//     if (!props.pathFromRoot) {
//         console.error('Path from root is required for downloading files');
//         return;
//     }
//     const link = document.createElement('a');
//     link.href = `/api/backend/admin/files/view?path=${encodeURIComponent(props.pathFromRoot)}/${encodeURIComponent(props.name)}`;
//     link.download = props.name;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
// };

// const menu = computed(() => {
//     const items = [
//         {
//             type: 'button' as const,
//             label: 'Open',
//             icon: 'mdi:open-in-new',
//             onClick: () => {
//                 contextMenu.closeMenu();
//                 props.onClick?.();
//             }
//         },
//         {
//             type: 'button' as const,
//             label: 'Download',
//             icon: 'mdi:download',
//             onClick: () => {
//                 contextMenu.closeMenu();
//                 downloadFile();
//             }
//         }
//     ];
//     if (props.type === 'file') {
//         items.push({
//             type: 'button' as const,
//             label: 'Delete',
//             icon: 'mdi:delete',
//             onClick: () => {
//                 // Implement delete logic here
//             }
//         });
//     }
//     return items;
// });

// const showHoverColors = ref(false)

</script>

<template>
    <div class="select-none flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700"
    :class="{
        'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800': props.onClick,
        // 'bg-gray-100 dark:bg-gray-800': showHoverColors
        }"
        @click="props.onClick ? props.onClick() : null"
    >
        <!-- @contextmenu.prevent="(event) => {
            contextMenu.openMenu(event, menu, {
                onClose: () => showHoverColors = false
            });
            showHoverColors = true;
        }" -->
        <icon :name="fileTypeIcons[estimatedFileType]" class="file-icon" />
        <div class="file-details">
            <span class="file-name select-auto">{{ props.name }}</span>
        </div>
        <div class="flex-1 text-right text-sm text-gray-500 dark:text-gray-400">
            <span v-if="props.type === 'directory'">Directory</span>
            <span v-else>{{ bytesToSize(props.size) }}</span>
        </div>
    </div>
</template>