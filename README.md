# ShicoX

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and hot-reloads with electron

```
yarn electron:serve
```

### Compiles and minifies for production

```
yarn build
```

### Compiles and builds the app for production

```
yarn electron:build
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Testing

If using VSCode add something like the following to `launch.json`

```json
({
  "type": "node",
  "request": "launch",
  "name": "Mocha Tests",
  "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
  "args": [
    "-u",
    "bdd",
    "--timeout",
    "999999",
    "--colors",
    "${workspaceFolder}/test"
  ],
  "internalConsoleOptions": "openOnSessionStart",
  "skipFiles": ["<node_internals>/**"]
},
{
  "type": "node",
  "request": "launch",
  "name": "Mocha Current File",
  "program": "${workspaceFolder}/node_modules/mocha/bin/_mocha",
  "args": ["-u", "bdd", "--timeout", "999999", "--colors", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
})
```
