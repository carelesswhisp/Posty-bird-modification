"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const util = require('./utils');
const template = [
    {
        label: 'Edit',
        submenu: [
            {
                role: 'undo',
            },
            {
                role: 'redo',
            },
            {
                type: 'separator',
            },
            {
                role: 'cut',
            },
            {
                role: 'copy',
            },
            {
                role: 'paste',
            },
            {
                role: 'pasteandmatchstyle',
            },
            {
                role: 'delete',
            },
            {
                role: 'selectall',
            },
        ],
    },
    {
        label: 'View',
        submenu: [
            {
                role: 'reload',
            },
            {
                role: 'forcereload',
            },
            {
                role: 'toggledevtools',
            },
            {
                type: 'separator',
            },
            {
                role: 'resetzoom',
            },
            {
                role: 'zoomin',
            },
            {
                role: 'zoomout',
            },
            {
                type: 'separator',
            },
            {
                role: 'togglefullscreen',
            },
        ],
    },
    {
        role: 'window',
        submenu: [
            {
                role: 'minimize',
            },
            {
                role: 'close',
            },
            {
                role: 'quit',
            },
        ],
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
                click() {
                    electron_1.shell.openExternal('https://postybirb.com');
                },
            },
        ],
    },
];
if (util.isOSX()) {
    template.unshift({
        label: electron_1.app.name,
        submenu: [
            {
                role: 'about',
            },
            {
                type: 'separator',
            },
            {
                role: 'services',
            },
            {
                type: 'separator',
            },
            {
                role: 'hide',
            },
            {
                role: 'hideothers',
            },
            {
                role: 'unhide',
            },
            {
                type: 'separator',
            },
            {
                role: 'quit',
            },
        ],
    });
    template[3].submenu = [
        {
            role: 'close',
        },
        {
            role: 'minimize',
        },
        {
            role: 'zoom',
        },
        {
            type: 'separator',
        },
        {
            role: 'front',
        },
    ];
}
module.exports = template;
