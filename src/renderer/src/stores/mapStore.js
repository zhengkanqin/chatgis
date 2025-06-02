import { defineStore } from 'pinia'

export const useMapStore = defineStore('map', {
  state: () => ({
    selectedLayers: [],
    map: null  // 添加地图实例
  }),
  actions: {
    setMap(map) {
      this.map = map
    },
    setSelectedLayer(layer) {
      this.selectedLayers = [layer]
    },
    clearSelectedLayer() {
      this.selectedLayers = []
    },
    toggleSelectedLayer(layer) {
      const index = this.selectedLayers.findIndex(l => l.id === layer.id)
      if (index === -1) {
        this.selectedLayers.push(layer)
      } else {
        this.selectedLayers.splice(index, 1)
      }
    }
  }
}) 