import fs from "fs";
import zlib from "zlib";
import { Riding } from "./poll-by-poll";

function getBasePollId(pollId: string): string {
  return pollId.replace(/[A-Z]$/i, "");
}

const ridings: Record<string, Riding> = JSON.parse(
  fs.readFileSync("data-handlers/out/riding-data.json", "utf8")
);

const colours = {
  LPC20: "82060a",
  LPC15: "ae0c14",
  LPC10: "d81219",
  LPC05: "e0454c",
  LPC: "e8767a",

  CPC20: "0b2f5c",
  CPC15: "13427b",
  CPC10: "1c559a",
  CPC05: "4a7db9",
  CPC: "7ba4d8",

  BQ20: "1a8a93",
  BQ15: "2da3ad",
  BQ10: "40b7c0",
  BQ05: "73cad3",
  BQ: "a6dde6",

  NDP20: "b85f00",
  NDP15: "d76e00",
  NDP10: "ec7800",
  NDP05: "f19a40",
  NDP: "f6bc7f",

  GPC20: "2a7023",
  GPC15: "32862a",
  GPC10: "3b9c32",
  GPC05: "68b662",
  GPC: "95d091",

  IND20: "606060",
  IND15: "707070",
  IND10: "808080",
  IND05: "909090",
  IND: "a0a0a0",

  PPC20: "3d2b5c",
  PPC15: "51397a",
  PPC10: "6f5d9a",
  PPC05: "9381b9",
  PPC: "b7a5d8",
};

fs.readFile("data-handlers/data/canada.geojson", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  const geojson = JSON.parse(data);
  const features = geojson.features;
  features.forEach((feature: any) => {
    const split = feature.properties.name.split("-");
    const riding = split[0];
    const pollDivision = split[1];
    const basePollId = getBasePollId(pollDivision);

    const ridingData = ridings[riding];
    if (ridingData) {
      const poll = ridingData.polls[basePollId];
      if (
        poll &&
        poll.results.length >= 2 &&
        poll.results.some((result) => result.votes > 0)
      ) {
        const p2 = poll.results[1].percentage;
        const p1 = poll.results[0].percentage;
        const diff = p1 - p2;
        let num = "";
        if (diff >= 0.2) {
          num = "20";
        } else if (diff >= 0.15) {
          num = "15";
        } else if (diff >= 0.1) {
          num = "10";
        } else if (diff >= 0.05) {
          num = "05";
        } else {
          num = "";
        }

        let party = poll.results[0].party;
        if (!["LPC", "CPC", "NDP", "BQ", "PPC", "GPC"].includes(party)) {
          party = "IND";
        }

        const colorKey = `${party}${num}` as keyof typeof colours;
        feature.properties.COL = colours[colorKey];
      }
    }
  });
  const jsonString = JSON.stringify(geojson);

  zlib.gzip(jsonString, (err, compressed) => {
    if (err) {
      console.error("Error compressing:", err);
      return;
    }

    fs.writeFile("data-handlers/out/canada.geojson.gz", compressed, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log(
        `GeoJSON file has been created successfully at data-handlers/out/canada.geojson.gz`
      );
    });
  });
});
