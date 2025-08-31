<script setup lang="ts">
import { baseInputStyleClasses } from '~/utils/vars/styles';
import FilesAPI, { type IDirectoryEntry, type IFileEntry, type ITree } from '~/utils/api/files';
import File from './file.vue';
import useMediaViewer from '~/utils/store/mediaViewer';

const path = ref('/public');
const runtime = useRuntimeConfig()
const api = new FilesAPI(runtime.public.partyurl);
const inputPath = ref<string | null>(path.value);
interface IFileEntryWithCategory extends IFileEntry {
    category: 'file';
}
interface IDirectoryEntryWithCategory extends IDirectoryEntry {
    category: 'directory';
}
const files = ref<(IFileEntryWithCategory | IDirectoryEntryWithCategory)[]>([]);
const tree = ref<ITree>({}); // Adjust type as needed
const error = ref<string | null>(null);

const categorizeFilesAndDirs = (files: IFileEntry[], dirs: IDirectoryEntry[]) => {
    // add a category for files and directories with correct literal types
    return [
        ...files.map(file => ({ ...file, category: 'file' as const })),
        ...dirs.map(dir => ({ ...dir, category: 'directory' as const })),
    ];
};

const listTree = async (newPath: string) => {
    try {
        const res = await api.listTree(newPath);
        tree.value = res;
    } catch (error) {
        console.error('Failed to list tree:', error);
    }
};

const navigateToPath = async (newPath: string) => {
    path.value = newPath;
    inputPath.value = newPath; // Update input field with the new path
    error.value = null;
    files.value = [];
    try {
        const res = await api.getFiles(newPath);

        if (Array.isArray(res.files) && Array.isArray(res.dirs)) {
            // Sort directories and files alphabetically by name
            res.dirs.sort((a, b) => a.href.localeCompare(b.href));
            res.files.sort((a, b) => a.href.localeCompare(b.href));
        } else {
            throw new Error('Invalid response format from server (expected files and dirs arrays)');
        }

        files.value = categorizeFilesAndDirs(res.files, res.dirs);
        listTree(newPath);
    } catch (e: any) {
        console.error('Failed to navigate:', e);
        error.value = 'Failed to navigate: ' + e.message;
    }
};

const home = () => {
    navigateToPath('/');
    inputPath.value = null; // Clear input when navigating home
};

const up = () => {
    const segments = path.value.split('/').filter(Boolean);
    if (segments.length > 1) {
        segments.pop(); // Remove last segment
        path.value = '/' + segments.join('/');
    } else {
        path.value = '/'; // Reset to root if at the top level
    }
    inputPath.value = path.value; // Update input field with the new path
    navigateToPath(path.value);
};

watch(path, (newPath) => {
    inputPath.value = newPath;
});

await navigateToPath(path.value);

const handlePath = (newPath: string) => {
    console.log('Handling path:', newPath);
    if (newPath.endsWith('/')) {
        newPath = newPath.slice(0, -1); // Remove trailing slash for consistency
    }
    if (!newPath.startsWith('/')) {
        newPath = '/' + newPath; // Ensure path starts with a slash
    }
    // Remove multiple leading slashes, keep only one
    newPath = newPath.replace(/^\/+/, '/');
    if (newPath !== '/' && newPath.endsWith('/')) {
        newPath = newPath.slice(0, -1); // Remove trailing slash unless it's root
    }
    console.log('Processed path:', newPath);
    return newPath;
};

const mediaViewer = useMediaViewer();

const openFile = (file: { category: string; href: string }) => {
    if (file.category === 'directory') return; // Ignore directories
    const filePath = `${path.value}/${file.href}`;
    mediaViewer.openViewer([{
        id: filePath,
        src: `${api.getBaseUrl()}${handlePath(filePath)}`,
    }], 0);
};

const refresh = async () => {
    try {
        await navigateToPath(path.value);
    } catch (error) {
        console.error('Failed to refresh:', error);
        // Handle error, e.g., show a notification
    }
};

</script>

<template>
    <div class="p-4">
        <div class="mb-4 flex justify-between items-center gap-2">
            <div class="flex items-center gap-2">
                <button class="btn btn-icon" @click="home">
                    <Icon name="mdi:home" class="text-2xl" />
                </button>
                <button class="btn btn-icon" @click="up">
                    <Icon name="mdi:chevron-up" class="text-2xl" />
                </button>
                <button class="btn btn-icon" @click="refresh">
                    <Icon name="mdi:refresh" class="text-2xl" />
                </button>
            </div>
            <div class="w-full flex gap-4 items-center">
                <input
                    v-model="inputPath"
                    type="text"
                    class="w-full !px-3 !py-2"
                    :class="[
                        baseInputStyleClasses,
                    ]"
                    placeholder="Enter path..."
                    @keyup.enter="navigateToPath(inputPath ? handlePath(inputPath) : path)"
                />
            </div>
        </div>
        <div class="flex">
            <div class="w-1/4 min-w-[200px] overflow-x-auto">
                <FilesTree :tree="tree" />
            </div>
            <div class="w-full">
                <div class="text-red-500">
                    {{ error }}
                </div>
                <!-- <pre>{{ files }}</pre> -->
                <template
                    v-for="(file, index) in files"
                    :key="index"
                >
                    <File
                        :type="file.category"
                        :pathFromRoot="path"
                        :name="file.href"
                        :size="file.sz"
                        :modified="new Date(file.ts).toLocaleString()"
                        @click="file.category === 'directory' ? navigateToPath(handlePath(`${path}/${file.href}`)) : openFile(file)"
                    />
                </template>
            </div>
        </div>
    </div>
</template>