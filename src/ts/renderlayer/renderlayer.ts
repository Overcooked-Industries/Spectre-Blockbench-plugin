// This file holds all classes and functions related to handling & manging a project's RenderLayers
import {getRenderLayersProperty} from "../properties";
import {loadRenderLayerPanel, unloadRenderLayerPanel} from "./layerui";

export interface RenderLayerData {
    name: string;
    type: string;
    textureIdentifier: string;
    previewTextureUuid: string;
}

// Main Render Layer class which holds information about each layer
// FOR SOME REASON you can't have custom class objects with functions as Properties without either:
// 1: Blockbench's autosave killing the object and its functions(but not its variables)
// or 2: Reopening the project not automatically recreating an instance of said custom class
// You can get around #2 with a custom "merge" (& reset?) method in your Property's PropertyOptions,
// but even with a custom Property class overriding the "copy" function, I couldn't get it to work.
export class RenderLayer {
    data: RenderLayerData;
    selected: boolean = false;

    constructor(data: RenderLayerData) {
        this.data = data;
    }
}

export function loadRenderLayers(): void {
    loadRenderLayerPanel();
}

export function unloadRenderLayers(): void {
    unloadRenderLayerPanel();
}

export function addRenderLayer(layer: RenderLayer): void {
    let projectRenderLayers: Array<RenderLayer> = getRenderLayersProperty();
    if (projectRenderLayers != undefined) {
        projectRenderLayers.push(layer);
    }
}

export function selectRenderLayer(layer: RenderLayer, event: MouseEvent): void {
    layer.selected = true;
    updateInterfacePanels();
}

export function unselectRenderLayer(layer: RenderLayer): void {
    layer.selected = false;
}

export function unselectAllRenderLayers(): void {
    getRenderLayersProperty().forEach(layer => {
        unselectRenderLayer(layer);
    });
    updateInterfacePanels();
}

export function getRenderLayerTextureSource(layer: RenderLayer): string {
    let textureIndex: number = Texture.all.findInArray("uuid", layer.data.previewTextureUuid);
    let texture: Texture = Texture.all[textureIndex] || Texture.getDefault();
    return texture.source;
}