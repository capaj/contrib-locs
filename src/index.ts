#!/usr/bin/env node
import { install as installSourceMapSupport } from 'source-map-support';
import git from 'nodegit';
import path from 'path';

export async function main(argv: string[]) {
  console.log('Hello, world!', argv);
  const files: string[] = [];
  const repo = await git.Repository.open(path.resolve(__dirname, '../.git'));
  const firstCommitOnMaster = await repo.getMasterCommit();
  const tree = await firstCommitOnMaster.getTree();
  const walker = tree.walk();
  walker.on('entry', (entry) => {
    console.log(entry.path());
    files.push(entry.path());
  });

  walker.on('end', async () => {
    await Promise.all(
      files.map(async (filePath) => {
        const blame = await git.Blame.file(repo, filePath);
        console.log('blame', blame.getHunkCount());

        let count = 1;
        for (const i = 0; i < blame.getHunkCount(); i++) {
          const hunk = blame.getHunkByIndex(i);
          // @ts-ignore
          const linesInHunk = hunk.linesInHunk();
          console.log('hunk', linesInHunk);
          for (const j = 0; j < linesInHunk; j++) {
            console.log(
              count + ':' + hunk.finalCommitId().toString().substring(0, 8)
            );
            count++;
          }
        }
      })
    );
  });
  walker.start();
}

//
// Boilerplate
//

function onError(err: unknown) {
  console.log(err);
  process.exit(1);
}

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);

installSourceMapSupport();
main(process.argv);
