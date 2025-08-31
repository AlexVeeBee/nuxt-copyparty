<script setup lang="ts">
const props = defineProps<{
  src: string;
  retry: () => void;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center bg-gray-800 p-8 rounded-lg">
    <Icon name="mdi:image-broken-variant" class="text-6xl text-gray-400 mb-4" />
    <p class="text-white text-lg mb-4">Failed to load image</p>
    <p class="text-gray-400 text-sm mb-6 max-w-md text-center break-all">{{ src }}</p>
    <button 
      @click="retry" 
      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
    >
      <Icon name="mdi:refresh" class="mr-2" />
      Retry
    </button>
  </div>
</template>
