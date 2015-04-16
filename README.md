#npm-autolink

## Description
Automatically create sym links between your dev folder

## .autolink file in your home directory
- File containing your glob patterns to your package.json files
- One line per pattern

Exemple, ~/.autolink : 
```
/home/adogor/dev/*/package.json
/home/adogor/dev/bigproject/*/package.json
```

## Usage :

```
Usage: npm-autolink [options] [command]


Commands:

  list      list dev packages available
  matches   list packages matches that will be linked

Npm autolinking feature

Options:

  -h, --help  output usage information


```
