<script setup lang="ts">
import type { ITree } from '~/utils/api/files';

const props = defineProps<{
    tree: ITree;
}>();

const treeComputed = computed(() => {
    if (!props.tree) return [];
    function processTree(tree: any) {
        const result: any[] = [];
        for (const key in tree) {
            const name = key.startsWith('k') ? key.slice(1) : key;
            if (key === 'a' && Array.isArray(tree[key])) {
                // Move directories listed in 'a' outside the 'a' folder
                for (const dir of tree[key]) {
                    result.push({
                        name: dir,
                        kind: 'directory',
                        children: []
                    });
                }
            } else if (Array.isArray(tree[key])) {
                result.push({
                    name,
                    kind: 'directory',
                    children: tree[key].map((item: string) => ({
                        name: item,
                        children: []
                    }))
                });
            } else if (typeof tree[key] === 'object' && tree[key] !== null) {
                result.push({
                    name,
                    kind: 'directory',
                    children: processTree(tree[key])
                });
            }
        }
        return result;
    }

    return processTree(props.tree);
});
</script>

<template>
    <!-- <pre>{{ tree }}</pre> -->
    <!-- <pre>{{ treeComputed }}</pre> -->
    <UITree
        :items="treeComputed"
    />
</template>