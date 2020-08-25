# contrib-locs

a CLI util to keep a list of all people who are to blame for all the the inidividual lines in the codebase

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
