import fs from "fs";
import { Riding } from "./poll-by-poll";

const ridings: Record<string, Riding> = JSON.parse(
  fs.readFileSync("data-handlers/out/riding-data.json", "utf8")
);

const pollWinners: Record<string, number> = {};

Object.values(ridings).forEach((riding) => {
  Object.values(riding.polls).forEach((poll) => {
    poll.results.forEach((result) => {
      if (result.pollWinner && result.votes > 0) {
        pollWinners[result.party] = (pollWinners[result.party] || 0) + 1;
      }
    });
  });
});

console.log(pollWinners);
