<script setup lang="ts">
const route = useRoute();

const fsPath = ref(route.query.path || "/");

interface IFile {
    name: string;
    path: string;
    type: "file" | "directory";
}

const files = ref<IFile[]>([]);

const fetchFiles = async () => {
};

watch(() => route.query, (newQuery) => {
    console.log("Route changed to:", newQuery);
});

</script>

<template>
    <FilesPage></FilesPage>
</template>