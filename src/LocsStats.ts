import { Commit } from 'nodegit'
import fs from 'fs'
import { runGit } from './onPreCommit'
// import debug from 'debug'
// const log = debug('contrib-locs')

export interface ILineStats {
  total_additions: number
  total_deletions: number
}
export interface ISingleUserStat extends ILineStats {
  email: string
  loc: number
  percentageOfTotal: number
}
export const repoStatsFileName = './contrib-locs.json'

export class LocsStatsPerUser {
  lastCommit: Commit | undefined

  setLastCommit(commit: Commit) {
    this.lastCommit = commit
  }
  output: Record<string, ISingleUserStat>

  constructor(isPrecommit: boolean) {
    let parsed
    if (isPrecommit) {
      try {
        const previousOutput = fs.readFileSync(repoStatsFileName, 'utf8')
        parsed = JSON.parse(previousOutput)
      } catch (err) {
        console.warn(
          `seems like the ${repoStatsFileName} does not exist, please run 'contrib-locs first'`
        ) // TODO ask user if we should run the whole init
        throw err
      }
    }

    const initial: Record<string, ISingleUserStat> = {}
    if (parsed && parsed.contributors) {
      parsed.contributors.forEach((contributor: ISingleUserStat) => {
        initial[contributor.email] = contributor
      })
    }
    this.output = initial
  }

  // async addHunk(email: string, hunk: ConvenientHunk) {
  //   if (!this.output[email]) {
  //     this.output[email] = {
  //       email: email,
  //       loc: hunk.newLines(),
  //       percentageOfTotal: 0,
  //     }
  //   } else {
  //     this.output[email].loc += hunk.newLines()
  //   }
  //   log('added line/s', hunk.newLines())
  // }
  async addLineStat(email: string, lineStats: ILineStats) {
    if (!this.output[email]) {
      this.output[email] = {
        email: email,
        loc: lineStats.total_additions + lineStats.total_deletions,
        total_additions: lineStats.total_additions,
        total_deletions: lineStats.total_deletions,
        percentageOfTotal: 0
      }
    } else {
      this.output[email].total_additions += lineStats.total_additions
      this.output[email].total_deletions += lineStats.total_deletions
      this.output[email].loc +=
        lineStats.total_additions + lineStats.total_deletions
    }
  }

  countPercentages() {
    const totalLinesAddedOrRemoved = Object.values(this.output).reduce(
      (sum, contributorStat) => {
        return (
          sum +
          contributorStat.total_additions +
          contributorStat.total_deletions
        )
      },
      0
    )

    Object.values(this.output).forEach((singleUserStat) => {
      const linesChangedByUser =
        singleUserStat.total_additions + singleUserStat.total_deletions
      singleUserStat.loc = linesChangedByUser
      singleUserStat.percentageOfTotal =
        (linesChangedByUser / totalLinesAddedOrRemoved) * 100
    })
  }

  saveAsFile() {
    const execaResult = runGit(process.cwd(), ['rev-parse', 'HEAD'])

    const data = {
      lastCommit: execaResult.stdout.substr(0, 7),
      updatedAt: new Date().toISOString(),
      contributors: Object.values(this.output).sort((a, b) => {
        return b.loc - a.loc
      })
    }
    return fs.writeFileSync(repoStatsFileName, JSON.stringify(data, null, 4))
  }
}
