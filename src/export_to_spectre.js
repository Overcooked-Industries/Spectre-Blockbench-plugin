let exportButton;

function load() {
    exportButton = new Action("export-to-spectre-button", {
        click() {
            let a = TextureLayer.name;
            let text = "";

            const json = JSON.stringify({ a }, null, 2);
            Blockbench.export({
                type: 'Spectre Model',
                extensions: ['json'],
                name: `${Project?.name ?? "unnamed"}.json`,
                content: json
            });
        },

        icon: "S",
        name: "Export Spectre Model"
    });

    // Insert into export menu after last item with id 'export_...'
    let exportMenu = MenuBar.menus.file.structure.find(x => x.id === 'export');
    let lastExportItem = exportMenu.children
        .filter(x => (typeof x === 'string' ? x : x.id).startsWith('export_'))
        .last();
    let lastExportItemIndex = exportMenu.children.indexOf(lastExportItem);
    let blenderExportIndex = lastExportItemIndex + 1;
    exportMenu.children.splice(blenderExportIndex, 0, 'export-to-spectre-button');
}

function unload() {
    exportButton.delete();
}


Plugin.register(
    'export_to_spectre', {
    title: 'Export to Spectre',
    author: 'Kilip1000',
    description: 'Export your project as a Spectre json.',
    icon: 'icon.png',
    creation_date: '2025-02-01',
    version: '2.0.0',
    variant: 'desktop',
    min_version: '4.12.4',
    has_changelog: false,
    tags: ['Exporter'],
    repository: '',
    onload: load,
    onunload: unload
});
