"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPartyColour, Poll } from "@/lib/poll";
import { Skeleton } from "./ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn } from "@/lib/utils";

export default function CanadaMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [pollData, setPollData] = useState<Poll | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [-95, 62],
      zoom: 3,
    });

    map.current.on("load", () => {
      if (!map.current) return;

      fetch("https://static.noratastic.ca/election-data/2025/canada.geojson.gz")
        .then(async (response) => {
          if (!response.body) throw new Error("No response body");

          const decompressedStream = response.body.pipeThrough(
            new DecompressionStream("gzip")
          );

          const decompressedResponse = new Response(decompressedStream);
          const text = await decompressedResponse.text();
          return JSON.parse(text);
        })
        .then((data) => {
          if (!map.current) return;

          map.current.addSource("canada", {
            type: "geojson",
            data: data as GeoJSON.GeoJSON,
          });

          map.current.addLayer({
            id: "canada-fill",
            type: "fill",
            source: "canada",
            paint: {
              "fill-color": [
                "case",
                ["has", "COL"],
                ["concat", "#", ["get", "COL"]],
                "#a0a0a0",
              ],
              "fill-opacity": 0.8,
            },
          });

          map.current.addLayer({
            id: "canada-outline",
            type: "line",
            source: "canada",
            paint: {
              "line-color": "#808080",
              "line-width": 0.25,
            },
          });

          map.current.on("mouseenter", "canada-fill", () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = "pointer";
            }
          });

          map.current.on("mousemove", "canada-fill", (e) => {
            if (!map.current || !e.features || e.features.length === 0) return;

            const properties = e.features[0].properties;
            if (properties) {
              if (popup.current) {
                popup.current.remove();
              }

              popup.current = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
              })
                .setLngLat(e.lngLat)
                .setHTML(
                  `<div style="padding: 8px; font-weight: 500;">${
                    properties.name || "Unknown"
                  }</div>`
                )
                .addTo(map.current);
            }
          });

          map.current.on("mouseleave", "canada-fill", () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = "";
            }
            if (popup.current) {
              popup.current.remove();
              popup.current = null;
            }
          });

          map.current.on("click", "canada-fill", (e) => {
            if (!map.current || !e.features || e.features.length === 0) return;

            const properties = e.features[0].properties;
            setSelectedPoll(properties.name);
          });
        })
        .catch((error) => {
          console.error("Error loading GeoJSON:", error);
        });
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      popup.current?.remove();
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    setPollData(null);
    if (selectedPoll === null) return;
    const riding = selectedPoll.split("-")[0];
    const pollId = selectedPoll.split("-")[1];
    const fetchPollData = async () => {
      await fetch(
        `https://static.noratastic.ca/election-data/2025/polls/${riding}/${pollId}.json`
      )
        .then((response) => response.json())
        .then((data) => setPollData(data as Poll));
    };

    fetchPollData();
  }, [selectedPoll]);

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div
        ref={mapContainer}
        className="w-full lg:flex-1 rounded-lg shadow-lg relative"
        style={{ minHeight: "600px" }}>
        {selectedPoll && (
          <div className="hidden lg:block absolute top-4 left-4 z-10 w-96">
            <Card className="max-w-96 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base font-bold">
                      {pollData ? (
                        `${pollData.ridingName} - Poll #${pollData.id}`
                      ) : (
                        <Skeleton className="w-48 h-6" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {pollData ? (
                        pollData.pollName
                      ) : (
                        <Skeleton className="w-48 h-4" />
                      )}
                    </CardDescription>
                  </div>
                  <button
                    onClick={() => setSelectedPoll(null)}
                    className="rounded-md p-1 hover:bg-muted transition-colors"
                    aria-label="Close">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {pollData ? (
                  <div className="max-h-[420px] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                          <TableHead>Party</TableHead>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Votes</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pollData.results.map((result) => (
                          <TableRow key={result.candidate}>
                            <TableCell className="text-left">
                              <div
                                className={cn(
                                  getPartyColour(result.party),
                                  "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                                  "w-[54px] flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                                )}>
                                <span className="text-background">
                                  {result.party}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.candidate}
                              {result.ridingWinner ? " * " : ""}
                              {result.incumbent ? " † " : ""}
                            </TableCell>
                            <TableCell className="text-right">
                              {result.votes}
                            </TableCell>
                            <TableCell className="text-right">
                              {Math.round(result.percentage * 100)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right">
                            Total Votes: {pollData.totalVotes}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                    <p className="text-sm text-muted-foreground">
                      * Riding Winner
                      {pollData.results.some((result) => result.incumbent) ? (
                        <span>
                          <br />† Incumbent
                        </span>
                      ) : (
                        ""
                      )}
                    </p>
                  </div>
                ) : (
                  <Skeleton className="w-full h-48" />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {selectedPoll && (
        <div className="lg:hidden w-full">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base font-bold">
                    {pollData ? (
                      `${pollData.ridingName} - Poll #${pollData.id}`
                    ) : (
                      <Skeleton className="w-48 h-6" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {pollData ? (
                      pollData.pollName
                    ) : (
                      <Skeleton className="w-48 h-4" />
                    )}
                  </CardDescription>
                </div>
                <button
                  onClick={() => setSelectedPoll(null)}
                  className="rounded-md p-1 hover:bg-muted transition-colors"
                  aria-label="Close">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {pollData ? (
                <div className="max-h-[420px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Party</TableHead>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pollData.results.map((result) => (
                        <TableRow key={result.candidate}>
                          <TableCell className="text-left">
                            <div
                              className={cn(
                                getPartyColour(result.party),
                                "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                                "w-[54px] flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                              )}>
                              <span className="text-background">
                                {result.party}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {result.candidate}
                            {result.ridingWinner ? " * " : ""}
                            {result.incumbent ? " † " : ""}
                          </TableCell>
                          <TableCell className="text-right">
                            {result.votes}
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round(result.percentage * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={4} className="text-right">
                          Total Votes: {pollData.totalVotes}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  <p className="text-sm text-muted-foreground">
                    * Riding Winner
                    {pollData.results.some((result) => result.incumbent) ? (
                      <span>
                        <br />† Incumbent
                      </span>
                    ) : (
                      ""
                    )}
                  </p>
                </div>
              ) : (
                <Skeleton className="w-full h-48" />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
