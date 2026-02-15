import {getRenderLayersProperty} from "../properties";
import {
    addRenderLayer,
    getRenderLayerTextureSource,
    RenderLayer,
    selectRenderLayer,
    unselectAllRenderLayers
} from "./renderlayer";


let renderLayerPanel: Panel;

export function loadRenderLayerPanel(): void {
    // Spectre Layers panel
    renderLayerPanel = createRenderLayerPanel();
    updateInterfacePanels();
}

export function unloadRenderLayerPanel(): void {
    renderLayerPanel.delete();
}

export function addRenderLayerDialog(): void {
    let config: InputFormConfig = createAddRenderLayerFormConfig();

    let dialog: Dialog = new Dialog({
        id: "create_spectre_render_layer",
        title: "Create Render Layer",
        width: 610,
        form: config,
        onConfirm(formResult: any, event: Event): void | boolean {
            // TODO - Warning for if any results are missing
            let renderLayer: RenderLayer = new RenderLayer({
                name: formResult.layerName || "Layer",
                type: formResult.layerType || "no_type",
                textureIdentifier: formResult.textureIdentifier || "minecraft:no_texture",
                previewTextureUuid: formResult.previewTextureIndex || Texture.getDefault().uuid
            });
            addRenderLayer(renderLayer);

            dialog.hide();
        }
    })
    dialog.show();
}

function createRenderLayerPanel(): Panel {
    let renderLayerComponent = Vue.extend({
        props: {
            renderlayer
        },
        methods: {
            getDescription(renderlayer: RenderLayer): string {
                return `${renderlayer.data.type}, ${renderlayer.data.textureIdentifier}`;
            },
            selectRenderLayer(renderlayer: RenderLayer, mouseEvent: MouseEvent): void {
                selectRenderLayer(renderlayer, mouseEvent);
            },
            dragRenderLayer(mouseEvent: MouseEvent): void {
                if (mouseEvent.button == 1) return; // Don't accept middle click I think this is doing?
                if (getFocusedTextInput()) return;

                let renderlayer = this.renderlayer;
                let active: boolean = false;
                let helper;

                let vueScope = this;

                // Scrolling
                let list: HTMLElement = document.getElementById("renderlayer_list");
                let listOffset = $(list).offset();

                // Magic numbers from https://github.com/JannisX11/blockbench/blob/master/js/texturing/textures.js#L2495
                let scrollInterval = function() {
                    if (!active) return;
                    if (mouse_pos.y < listOffset.top) {
                        list.scrollTop += (mouse_pos.y - listOffset.top) / 7 - 3;
                    } else if (mouse_pos.y > listOffset.top + list.clientHeight) {
                        list.scrollTop += (mouse_pos.y - (listOffset.top + list.clientHeight)) / 6 + 3;
                    }
                }

                let scrollInternvalID;

                function move(moveMouseEvent: MouseEvent): void {
                    let offsetX: number = moveMouseEvent.clientX - mouseEvent.clientX;
                    let offsetY: number = moveMouseEvent.clientY - mouseEvent.clientY;

                    if (!active) {
                        let distance: number = Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
                        if(distance > 6) {
                            active = true;
                        }
                    }
                    if(!active) return;

                    if (moveMouseEvent) moveMouseEvent.preventDefault();

                    // Fake display element which follows the mouse when dragged
                    if (!helper) {
                        helper = vueScope.$el.cloneNode();
                        helper.classList.add("texture_drag_helper");
                        helper.setAttribute("layerid", renderlayer.data.name)

                        document.body.append(helper);
                        scrollInternvalID = setInterval(scrollInterval, 1000/60);
                        Blockbench.addFlag("dragging_renderlayers");
                    }
                    helper.style.left = `${moveMouseEvent.clientX}px`
                    helper.style.top = `${moveMouseEvent.clientY}px`

                    // Drag
                    $(".outliner_node[order]").attr("order", null);
                    $(".drag_hover").removeClass("drag_hover");
                    $(".renderlayer[order]").attr("order", null);

                    // TODO - Apply to bones/cubes by checking drag here

                    // Apply move above/below indicator (the blue lines with the default theme)
                    if (isNodeUnderCursor(document.querySelector("#renderlayer_list"), moveMouseEvent)) {
                        let layerTarget = findNodeUnderCursor("#renderlayer_list li.renderlayer", moveMouseEvent);
                        if (layerTarget) {
                            let targetOffsetY = moveMouseEvent.clientY - $(layerTarget).offset().top;
                            layerTarget.setAttribute("order", targetOffsetY > 24 ? "1" : "-1");
                            return;
                        }
                    }
                }

                function drop(dropMouseEvent: MouseEvent): void {
                    if (helper) helper.remove();
                    clearInterval(scrollInternvalID);
                    removeEventListeners(document, "mousemove touchmove", move);
                    removeEventListeners(document, "mouseup touchend", drop);
                    dropMouseEvent.stopPropagation();

                    if (!active || Menu.open) return;

                    Blockbench.removeFlag("dragging_renderlayers");
                }

                addEventListeners(document, "mousemove touchmove", move, {passive: false});
                addEventListeners(document, "mouseup touchend", drop, {passive: false});
            },
            getRenderLayerTextureSource(layer: RenderLayer): string {
                return getRenderLayerTextureSource(layer);
            }
        },
        template: `
            <li
                v-bind:class="{ selected: renderlayer.selected }"
                v-bind:layerid="renderlayer.data.name"
                class="texture"
                @click.stop="selectRenderLayer(renderlayer, $event)"
                @mousedown.stop="dragRenderLayer($event)" @touchstart.stop="dragRenderLayer($event)"
            >
            <div class="texture_icon_wrapper">
              <img v-bind:texid="renderlayer.data.textureIdentifier" v-bind:src="getRenderLayerTextureSource(renderlayer)" class="texture_icon" width="48px" alt="" />
            </div>
              <div class="texture_description_wrapper">
                <div class="texture_name">{{ renderlayer.data.name }}</div>
                <div class="texture_res">{{ getDescription(renderlayer) }}</div>
              </div>              
            </li>
        `
    })

    return new Panel("render_layers", {
        icon: "fa-layer-group",
        name: "Spectre Layers",
        growable: true,
        resizable: true,
        condition: {
            // TODO - Spectre project type check here
            modes: ["edit", "paint"]
        },
        default_position: {
            slot: "left_bar",
            height: 400,
            float_position: [0, 0],
            float_size: [300, 400],
            attached_to: "textures",
            attached_index: 1,
            sidebar_index: 2
        },
        toolbars: [
            new Toolbar("render_layer_list", {
                children: [
                    "create-spectre-render-layer",
                    "+", // Everything after this will appear to the right of the bar instead of the left
                    "export-to-spectre-button"
                ]
            })
        ],
        form: new InputForm({}), // TODO - input form
        component: {
            name: "spectre-render-layers",
            data() { return {

            }},
            components: {
                "RenderLayer": renderLayerComponent
            },
            methods: {
                // openMenu(event): void { // Opens a menu on right click
                //     // console.log("hiya");
                //     // renderLayerPanel.show(event);
                // },
                getRenderLayers(): RenderLayer[] {
                    return getRenderLayersProperty();
                },
                unselectAll(): void {
                    unselectAllRenderLayers();
                }
            },
            template: `
              <div>
                <ul id="renderlayer_list" class="list mobile_scrollbar" @click.stop="unselectAll()">
                  <RenderLayer
                      v-for="renderlayer in getRenderLayers()"
                      :key="renderlayer.data.name"
                      :renderlayer="renderlayer"
                  ></RenderLayer>
                </ul>
              </div>
            `
        }
    })
}

function createAddRenderLayerFormConfig(): InputFormConfig {
    // TODO - I'd love to have image previews of the textures here
    // Map<Texture UUID, Texture Name> - UUID is used for finding the texture, name is used for visual input from user
    let availableTextures: Record<string, string> = {}
    Texture.all.forEach(texture => {
        availableTextures[texture.uuid] = texture.name;
    })

    return {
        info: {
            label: "Render Layer Info",
            text: "",
            type: "info",
        },
        layerName: {
            label: "generic.name",
            description: "The name of this Render Layer. Converted to an ID for linking bones/cubes to layers, and used as given for debugging.",
            type: "text",
            placeholder: "layer",
        },
        layerType: {
            label: "Type",
            description: "The type of the layer",
            type: "text",
            value: "minecraft:entity",
            placeholder: "minecraft:entity",
        },
        textureIdentifier: {
            label: "Texture Identifier",
            description: "The Minecraft Identifier path for this layer's texture. This will be used when exported, but won't do much for previewing in Blockbench.",
            type: "text",
            placeholder: "minecraft:entity/zombie"
        },
        previewTextureIndex: {
            label: "Blockbench Preview Texture",
            description: "The preview texture used in Blockbench. This texture won't be used when exported, only the texture identifier will be used.",
            type: "select",
            options: availableTextures
        },

        propertiesWhitespace: { label: "", text: "", type: "info" },
        properties: {
            label: "Render Layer Properties",
            text: "",
            type: "info",
        }
    }
}