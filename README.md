# MusicNg

Installation instructions


Types

Have a typings directory
In the tsconfig.json file,
add its entry in the typeRoots array
"typeRoots": [
      "typings",
    ],
and add its entry in the exclude array
  "exclude": [
    "typings"
  ]

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
