<template>
  <div>
    <div class="node" 
      @click="handleClickOpen"
    >
      <Icon 
        v-if="isFolder" 
        :icon="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'" 
        class="twisty shrink-0 p-0 text-2xl"
        :class="{ dim: !isFolder }"
        @click.stop="handleClick"
      />
      <Icon v-if="isFolder" icon="mdi:folder" class="md shrink-0"
        style="color: #FFCD57"
      />
      <Icon v-else icon="mdi:file" class="md shrink-0"
        style="color: #9AA5B1"
      />
      <span class="label">{{ node.name }}</span>
    </div>
    
    <div 
      v-if="isFolder && node.children?.length" 
      class="indent"
      :class="{ hidden: !expanded }"
    >
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        @node-click="$emit('nodeClick', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import TreeNode from './Node.vue'
import type { TreeItem } from '~/utils/types/tree';

const props = defineProps<{
  node: TreeItem
}>()

const emit = defineEmits<{
  nodeClick: [node: TreeItem]
}>()

const expanded = ref(false)

const isFolder = computed(() => props.node.kind === 'directory')

function handleClick() {
  if (isFolder.value) {
    expanded.value = !expanded.value
  }
  emit('nodeClick', props.node)
}
const handleClickOpen = () => {
  if (isFolder.value && !expanded.value) {
    expanded.value = true
  }
  emit('nodeClick', props.node)
}
</script>

<style scoped>
.node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.28rem 0.4rem;
  border-radius: 8px;
  user-select: none;
  cursor: pointer;
}

.node:hover {
  background: rgba(255, 255, 255, 0.04);
}

.node .label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.indent {
  margin-left: 0.8rem;
  border-left: 4px solid #2a3146;
  padding-left: 0.3rem;
}

.twisty {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.1rem;
  opacity: 0.8;
}

.icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.dim {
  opacity: 0.7;
}

.hidden {
  display: none;
}
</style>
