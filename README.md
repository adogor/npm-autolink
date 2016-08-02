# npm-autolink

## Description
- Automatically create sym links between your dev folder of node modules
- .autolink will configure scanned modules with glob patterns

## .autolink files
- File containing your glob patterns to your package.json files
- npm-autolink will recursivly look for .autolink files in your parent folders
- One line per pattern
- Glob patterns relatives to autolink dir

Example .autolink file:
```
dev/*/package.json
dev/bigproject/*/package.json
```

## Usage

`npm-autolink [command] [options]`

```sh
# Print usage information
$ npm-autolink -h
$ npm-autolink --help

# List available dev packages
$ npm-autolink list

# List packages matches that will be linked
$ npm-autolink matches

# Link node modules. Optional [id]
$ npm-autolink link [id]

# Remove symlinks. Optional [id]
$ npm-autolink remove [id]
```

## TODO :
- What if multiple versions of same module are found ?
