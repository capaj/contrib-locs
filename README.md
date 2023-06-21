# contrib-locs

a CLI util to keep a list of all people who are to blame for all the the individual lines in the codebase. This can be used to roughly compare contribution volume between all the comitters.

Only runs in node 16. If you need node 18, please upvote this: https://github.com/nodegit/nodegit/issues/1980

## Install

```
npm i contrib-locs -g
```

it stores the ledger inside the repo in json format. It can look like this:

```json
{
  "lastCommit": "aaaaa",
  "contributors": [
    {
      "email": "capajj@gmail.com",
      "loc": 299,
      "total_additions": 247,
      "total_deletions": 52,
      "percentageOfTotal": 100
    }
  ]
}
```

It counts all the lines added/removed in all commits, so the line is counted even if it was removed later.

There are two command

- `init`
- `preCommit`

## First run

invoke `contrib-locs init` in your project repo root.

## Set up githooks with husky

Here's an example husky(7.x.x) CLI command to use to set up git hook to update contributors before each commit:

```
 npx husky add .husky/pre-commit "contrib-locs preCommit"
```

## Config

Is defined in the root of your git repo in a file `.contrib-locs` file. File format is JSON5.
Default config looks like this:

```js
{
  matchFiles: ['*', '!contrib-locs.json'],
  matchUsers: ['*', '!*[bot]@users.noreply.github.com'] // filters out github bots
}
```

### Including/excluding files

You will most likely want to ignore certain files. Like for example files that are generated code.
By default contrib-locs only works on files that are in git, so if such files are in `.gitignore` there's no additional config needed.
If you want to exclude/include files in git add `matchFiles`

For example if you only want to count files that are typescript files and markdown, you can use this:

```js
{
  matchFiles: ['**/*.ts', '**/*.tsx', '**/*.md']
}
```

`match` is used as param for [micromatch](https://www.npmjs.com/package/micromatch) so you can also negate if needed. Like if you want to count all files except json:

```js
{
  matchFiles: ['*', '!**/*.json']
}
```

### Including/excluding users

```js
{
  matchUsers: ['*@uber.com', '!*[bot]@users.noreply.github.com'] // only people from uber domain will get counted, bots will be ignored
}
```

contributions from unmatched users are skipped. They don't even count into the `totalLinesAddedOrRemoved`.
