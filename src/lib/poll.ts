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

export function getPartyColour(party: string): string {
  switch (party) {
    case "LPC":
      return "bg-[#82060a]";
    case "CPC":
      return "bg-[#1c559a]";
    case "BQ":
      return "bg-[#40b7c0]";
    case "NDP":
      return "bg-[#ec7800]";
    case "GPC":
      return "bg-[#3b9c32]";
    case "PPC":
      return "bg-[#6f5d9a]";
    default:
      return "bg-[#808080]";
  }
}
