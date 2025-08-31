<script setup lang="ts">
import TreeNode from './Node.vue'
import type { TreeItem } from '~/utils/types/tree';

const props = defineProps<{
  items: TreeItem[]
  onClick?: (node: TreeItem) => void
}>()

function handleNodeClick(node: TreeItem) {
  props.onClick?.(node)
}
</script>

<template>
  <div class="tree">
    <TreeNode 
      v-for="node in items" 
      :key="node.id || node.path"
      :node="node"
      @node-click="handleNodeClick"
    />
    <div v-if="items.length === 0" class="text-sm text-gray-500">
      No items.
    </div>
  </div>
</template>

<style scoped>
.tree {
  padding: 0.4rem;
}
</style>