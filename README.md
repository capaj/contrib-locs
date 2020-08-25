# contrib-locs

a CLI util to keep a list of all people who are to blame for all the the inidividual lines in the codebase

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

## Set up githooks

Here's an example how you can set up git hook to update contributors before each commit:

```
  "husky": {
    "hooks": {
      "pre-commit": "contrib-locs c"
    }
  }
```
