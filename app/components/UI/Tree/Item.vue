<script setup lang="ts">
interface TreeItem {
    id: string;
    icon?: string;
    name: string;
}
defineProps<{
    item: TreeItem;
}>();
</script>

<template>
    <div class="tree-item">
        <span>{{ item.name }}</span>
    </div>
</template>

<style lang="css" scoped>
.tree-item {
    padding: 4px 8px;
    border-bottom: 1px solid #eee;
}
</style>
