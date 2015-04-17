#npm-autolink

## Description
- Automatically create sym links between your dev folder of node modules
- .autolink will configure scanned modules with glob patterns

## .autolink files
- File containing your glob patterns to your package.json files
- npm-autolink will recursivly look for .autolink files in your parent folders
- One line per pattern
- Glob patterns relatives to autolink dir

Exemple, .autolink : 
```
dev/*/package.json
dev/bigproject/*/package.json
```

## Usage :

```
Usage: npm-autolink [options] [command]

Sub-commands:

  list      list dev packages available
  matches   list packages matches that will be linked

Npm autolinking feature

Options:

  -h, --help  output usage information


```

## TODO :
- What if multiple versions of same module are found ?