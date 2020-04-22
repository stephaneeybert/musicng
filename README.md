# MusicNg

Installation

Install some dependencies
npm install web-midi-api
npm install @types/webmidi
npm install tone @tonejs/ui
npm install @tonejs/midi
npm install midi-json-parser
npm install midi-file-slicer
npm install nexusui
npm install vexflow@latest
npm install @types/vexflow
npm install ../lib-i18n/dist/lib-i18n/lib-i18n-0.0.1.tgz
npm install @ngx-translate/core --save-dev
npm install @ngx-translate/http-loader --save-dev

Add some modules types index.d.ts files in the typings directory
typings/
├── midi-file
│   └── index.d.ts
├── nexusui
│   └── index.d.ts
└── tone
    └── index.d.ts

Copy the following content:
declare module 'tone';
into the typings/tone/index.d.ts file.

Copy the following content:
declare module 'nexusui';
into the typings/nexusui/index.d.ts file.

Copy the content of the https://raw.githubusercontent.com/Tonejs/Midi/master/src/midi-file.d.ts file
into the typings/midi-file/index.d.ts file.
