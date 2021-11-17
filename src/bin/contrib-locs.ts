#!/usr/bin/env node

import debug from 'debug'
import Yargs from 'yargs'
import { repoStatsFileName } from '../LocsStats'
import { onPreCommit } from '../onPreCommit'
import { initializeInRepo } from '../initializeInRepo'

export const log = debug('contrib-locs')

Yargs.scriptName('contrib-locs')
  .command(
    ['init', 'i'],
    'initialize a contributors ledger in this repo',
    {
      path: {
        alias: 'p',
        default: process.cwd()
      }
    },
    async ({ path: gitPath }) => {
      const statInstance = await initializeInRepo(gitPath)
      log(statInstance.usersMap)
      statInstance.saveAsFile()
      console.log(
        `Saved in ${repoStatsFileName}, counted ${statInstance.totalCommits} commits`
      )
    }
  )

  .demandCommand(1)
  .command(
    ['preCommit', 'c'],
    'update contributors ledger and stage it for commit',
    {
      path: {
        alias: 'p',
        default: process.cwd()
      }
    },
    onPreCommit
  )
  .fail(function (msg, err) {
    if (err) {
      throw err
    }
    console.error(msg)
    process.exit(1)
  })
  .help()
  .parse()
