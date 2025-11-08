import fs from "fs";
import zlib from "zlib";

// jesus

function parseCSV(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result;
}

function getBasePollId(pollId: string): string {
  return pollId.replace(/[A-Z]$/i, "");
}

const parties25 = {
  Liberal: "LPC",
  Conservative: "CPC",
  "Parti Rhinocéros Party": "RHI",
  "NDP-New Democratic Party": "NDP",
  "Animal Protection Party": "APP",
  "Green Party": "GPC",
  Independent: "IND",
  "People's Party - PPC": "PPC",
  Communist: "COM",
  Libertarian: "LBT",
  "Marxist-Leninist": "MAR",
  CFP: "CFP",
  Centrist: "CEN",
  "Bloc Québécois": "BQ",
  "No Affiliation": "NA",
  "Christian Heritage Party": "CHP",
  "United Party of Canada (UP)": "UPC",
  "Marijuana Party": "MJP",
};

const allRidings = fs
  .readdirSync("data-handlers/data/pollbypoll_bureauparbureauCanada/")
  .map((file) => file.replace(".csv", "").slice(-5));

const ridings: Record<string, Riding> = {};

for (let i = 0; i < 343; i++) {
  const riding = allRidings[i];

  const dataFormat1 = fs.readFileSync(
    `data-handlers/data/pollbypoll_bureauparbureauCanada/pollbypoll_bureauparbureau${riding}.csv`,
    "utf8"
  );
  const dataFormat2 = fs.readFileSync(
    `data-handlers/data/pollresults_resultatsbureauCanada/pollresults_resultatsbureau${riding}.csv`,
    "utf8"
  );

  const dataFormat1Lines = dataFormat1.split("\n");
  const dataFormat2Lines = dataFormat2.split("\n");

  const dataFormat1Data = dataFormat1Lines.slice(1);
  const dataFormat2Data = dataFormat2Lines.slice(1);

  const ridingName = parseCSV(dataFormat2Lines[1])[1].replace(/"/g, "");

  const ridingData: Riding = {
    id: riding,
    name: ridingName,
    polls: {},
  };

  for (const line of dataFormat2Data) {
    const data = parseCSV(line);
    if (data.length < 2) {
      continue;
    }

    const originalPollId = data[3].replace(/"/g, "").trim();
    const basePollId = getBasePollId(originalPollId);

    if (!ridingData.polls[basePollId]) {
      const pollName = data[4].replace(/"/g, "").trim();
      let voided = false;

      if (data[5] !== "N" || data[6] !== "N") {
        voided = true;
      }

      const registered = Number(data[9].replace(/"/g, "").trim());
      const rejectedVotes = Number(data[8].replace(/"/g, "").trim());

      const foundLine = dataFormat1Data.find((line) => {
        const parsed = parseCSV(line);
        const linePollId = parsed[2]?.replace(/"/g, "").trim();
        return parsed.length > 2 && getBasePollId(linePollId) === basePollId;
      });
      const l1 = foundLine ? parseCSV(foundLine) : undefined;
      const total =
        l1 && l1.length >= 2
          ? Number(l1[l1.length - 2]?.replace(/"/g, "").trim())
          : 0;
      const turnout = Math.round((total / registered) * 100) / 100;

      const combinedWith = data[7].replace(/"/g, "").trim();
      const baseCombinedWith =
        combinedWith !== "" ? getBasePollId(combinedWith) : undefined;

      const poll: Poll = {
        id: basePollId,
        pollName: pollName,
        ridingName: ridingName,
        results: [],
        totalVotes: total,
        registeredElectors: registered,
        rejectedVotes: rejectedVotes,
        turnout: turnout,
        voided: voided,
        combinedWith: baseCombinedWith,
      };
      ridingData.polls[basePollId] = poll;
    } else {
      const poll = ridingData.polls[basePollId];
      const registered = Number(data[9].replace(/"/g, "").trim());
      const rejectedVotes = Number(data[8].replace(/"/g, "").trim());

      const foundLine = dataFormat1Data.find((line) => {
        const parsed = parseCSV(line);
        const linePollId = parsed[2]?.replace(/"/g, "").trim();
        return parsed.length > 2 && linePollId === originalPollId;
      });
      const l1 = foundLine ? parseCSV(foundLine) : undefined;
      const total =
        l1 && l1.length >= 2
          ? Number(l1[l1.length - 2]?.replace(/"/g, "").trim())
          : 0;

      poll.registeredElectors += registered;
      poll.rejectedVotes += rejectedVotes;
      poll.totalVotes = total;
      poll.turnout =
        Math.round((poll.totalVotes / poll.registeredElectors) * 100) / 100;
    }

    const poll = ridingData.polls[basePollId];
    const winner = data[16].replace(/"/g, "").trim() === "Y";
    const incumbent = data[15].replace(/"/g, "").trim() === "Y";
    const candidate = `${data[12]} ${data[10]}`.replace(/"/g, "");
    const party = data[13].replace(/"/g, "").trim();
    const votes = Number(data[17].replace(/"/g, "").trim());

    const existingResult = poll.results.find(
      (r) =>
        r.candidate === candidate &&
        r.party === (parties25[party as keyof typeof parties25] || party)
    );

    if (existingResult) {
      existingResult.votes += votes;
    } else {
      poll.results.push({
        ridingWinner: winner,
        candidate: candidate,
        party: parties25[party as keyof typeof parties25] || party,
        incumbent: incumbent,
        votes: votes,
        percentage: 0,
        pollWinner: false,
      });
    }
  }

  Object.values(ridingData.polls).forEach((poll) => {
    if (poll.combinedWith) {
      const combinedPoll = ridingData.polls[poll.combinedWith];
      const id = poll.id;
      Object.assign(poll, combinedPoll);
      poll.id = id;
    }

    poll.results.forEach((result) => {
      result.percentage =
        Math.round((result.votes / poll.totalVotes) * 100) / 100;
    });

    poll.results.sort((a, b) => b.votes - a.votes);
    if (poll.results.length > 0) {
      poll.results[0].pollWinner = !poll.voided;
    }
  });
  ridings[riding] = ridingData;
}

fs.writeFileSync(
  "data-handlers/out/riding-data.json",
  JSON.stringify(ridings, null, 2)
);
zlib.gzip(JSON.stringify(ridings), (err, compressed) => {
  if (err) {
    console.error(err);
    return;
  }
  fs.writeFileSync("data-handlers/out/riding-data.json.gz", compressed);
});

Object.values(ridings).forEach((riding) => {
  const ridingDir = `data-handlers/out/polls/${riding.id}`;
  fs.mkdirSync(ridingDir, { recursive: true });

  Object.values(riding.polls).forEach((poll) => {
    const safeFileName = poll.id.replace(/[\/\\:*?"<>|]/g, "_");
    fs.writeFileSync(`${ridingDir}/${safeFileName}.json`, JSON.stringify(poll));
  });
});

export type Riding = {
  id: string;
  name: string;
  polls: Record<string, Poll>;
};

export type Poll = {
  id: string;
  pollName: string;
  ridingName: string;
  results: {
    ridingWinner: boolean;
    candidate: string;
    party: string;
    incumbent: boolean;
    votes: number;
    percentage: number;
    pollWinner: boolean;
  }[];
  totalVotes: number;
  registeredElectors: number;
  rejectedVotes: number;
  turnout: number;
  voided: boolean;
  combinedWith?: string | undefined;
};
