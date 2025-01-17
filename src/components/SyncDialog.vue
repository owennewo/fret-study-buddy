<script setup lang="ts">
import { ref } from 'vue';

const projects = ref([
    {
        name: 'Project 1',
        localModifiedDateTime: new Date('2021-01-01T12:00:00'),
        remoteModifiedDateTime: new Date('2021-01-02T12:00:00'),
    },
    {
        name: 'Project 2',
        localModifiedDateTime: new Date('2021-01-02T12:00:00'),
        remoteModifiedDateTime: new Date('2021-01-01T12:00:00'),
    },
    {
        name: 'Project 3',
        localModifiedDateTime: new Date( '2021-01-02T12:00:00'),
        remoteModifiedDateTime: new Date('2021-01-02T12:00:00'),
    },
    {
        name: 'Project 4',
        localModifiedDateTime: new Date('2021-01-02T12:00:00'),
        remoteModifiedDateTime: null,
    },
    {
        name: 'Project 5',
        localModifiedDateTime: null,
        remoteModifiedDateTime: new Date('2021-01-02T12:00:00'),
    },
]);



const getLocalChipStyle = (item) => {
    if (!item.localModifiedDateTime) return 'chip-missing';
    if (!item.remoteModifiedDateTime || item.localModifiedDateTime >= item.remoteModifiedDateTime) return 'chip-newer';
    return 'chip-older';
};

const getRemoteChipStyle = (item) => {
    if (!item.remoteModifiedDateTime) return 'chip-missing';
    if (!item.localModifiedDateTime || item.remoteModifiedDateTime >= item.localModifiedDateTime) return 'chip-newer';
    return 'chip-older';
};


const getAction = (project: any) => {
    const { localModifiedDateTime, remoteModifiedDateTime } = project;

    if (!localModifiedDateTime && remoteModifiedDateTime) return 'Pull';
    if (localModifiedDateTime && !remoteModifiedDateTime) return 'Push';

    const localTime = new Date(localModifiedDateTime).getTime();
    const remoteTime = new Date(remoteModifiedDateTime).getTime();

    if (localTime == remoteTime) return 'None';

    return localTime > remoteTime ? 'Push' : 'Pull';
};

const getSyncIcon = (action: string) => {
    switch (action) {
        case 'Pull':
            return 'pi pi-arrow-left';
        case 'Push':
            return 'pi pi-arrow-right';
        default:
            return 'pi pi-equals';
    }
};
</script>

<template>
    <p-datatable :value="projects" tableStyle="min-width: 50rem">
        <p-column field="name" header="Name"></p-column>
        <p-column header="Most Recent" class="sync-comparison">
            <template #body="slotProps" >
                <div class="sync-comparison">
                <p-chip
                    :removable="slotProps.data.localModifiedDateTime ? true : false"
                    :label="'Local'"
                    :class="getLocalChipStyle(slotProps.data)"
                />
                <p-button
                    :disabled="getAction(slotProps.data) === 'None'"
                    :class="getAction(slotProps.data) === 'None' ? 'p-button-secondary p-button-text': ''"
                    :icon="getSyncIcon(getAction(slotProps.data))"
                />
                <p-chip
                    :removable="slotProps.data.remoteModifiedDateTime ? true : false"
                    :label="'Local'"
                    :class="getRemoteChipStyle(slotProps.data)"
                >
                <i class="pi pi-google"></i>
                <span class="ml-2 font-medium">Remote</span>
                </p-chip>
            </div>
            </template>
        </p-column>
    </p-datatable>
</template>

<style scoped>
.chip-missing {
    background-color: #ddd;
    color: #333;
}
.chip-newer{
    background-color: #5cb85c;
    color: white;
}
.chip-older{
    background-color: orange;
    color: white;
}

.sync-comparison {
    display: flex;
    gap: 2rem;
}
</style>
