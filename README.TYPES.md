# Types

# Have a typings directory

# In the tsconfig.json file, add its entry in the typeRoots array
"typeRoots": [
  "typings",
  "node_modules/@types"
],

# Add its entry in the exclude array
  "exclude": [
    // IDEs should not type-check the different node_modules directories of the different packages.
    // This would cause the IDEs to be slower and also linters would check the node_modules.
    "node_modules/",
    "typings"
  ]

# Add some modules types index.d.ts files in the typings directory
typings/
├── midi-file
│   └── index.d.ts
└── nexusui
    └── index.d.ts

# Copy the following content:
declare module 'nexusui';
# into the typings/nexusui/index.d.ts file.

# Copy the content of the https://raw.githubusercontent.com/Tonejs/Midi/master/src/midi-file.d.ts file
# into the typings/midi-file/index.d.ts file.
