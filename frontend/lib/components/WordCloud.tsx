import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
// @ts-ignore: d3-cloud has no types
import cloud from "d3-cloud";
import { WordScore } from "@/types";

interface WordCloudProps {
  words: WordScore[];
  width?: number;
  height?: number;
  minFontSize?: number;
  maxFontSize?: number;
}

const defaultWidth = 400;
const defaultHeight = 250;
const defaultMinFont = 12;
const defaultMaxFont = 48;

// Simple hash function for consistent color assignment
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
  }
  return Math.abs(hash);
}

const WordCloud: React.FC<WordCloudProps> = ({
  words,
  width = defaultWidth,
  height = defaultHeight,
  minFontSize = defaultMinFont,
  maxFontSize = defaultMaxFont
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!words || words.length === 0) return;
    // Clear previous SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Normalize values to font size range
    const values = words.map(w => w.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const fontSizeScale = d3.scaleLinear()
      .domain([minValue, maxValue === minValue ? minValue + 1 : maxValue])
      .range([minFontSize, maxFontSize]);

    // Layout
    cloud()
      .size([width, height])
      .words(words.map((d: WordScore) => ({ ...d })))
      .padding(5)
      .rotate((d: any) => (hashString(d.text) % 2 === 0 ? 0 : 90))
      .font("Impact")
      .fontSize((d: any) => fontSizeScale(d.value))
      .random(() => 0.5)
      .on("end", (layoutWords: any[]) => {
        svg
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%")
          .attr("height", "100%")
          .selectAll("g").data([null]).join("g")
          .attr("transform", `translate(${width / 2},${height / 2})`);

        const g = svg.select("g");
        // DATA JOIN with key as word text
        const texts = g.selectAll("text")
          .data(layoutWords, (d: any) => d.text);

        // EXIT
        texts.exit()
          .transition()
          .duration(400)
          .style("opacity", 0)
          .remove();

        // UPDATE
        texts.transition()
          .duration(400)
          .attr("transform", (d: any) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          .style("font-size", (d: any) => `${d.size}px`)
          .style("opacity", 1)
          .style("fill", (d: any) => color(String(hashString(d.text) % 10)));

        // ENTER
        texts.enter()
          .append("text")
          .attr("text-anchor", "middle")
          .attr("transform", (d: any) => `translate(${d.x},${d.y}) rotate(${d.rotate})`)
          .style("font-family", "Impact")
          .style("font-size", (d: any) => `${d.size * 0.7}px`)
          .style("fill", (d: any) => color(String(hashString(d.text) % 10)))
          .style("opacity", 0)
          .text((d: any) => d.text)
          .transition()
          .duration(400)
          .style("font-size", (d: any) => `${d.size}px`)
          .style("opacity", 1);
      })
      .start();
  }, [words, width, height, minFontSize, maxFontSize]);

  return (
    <svg
      ref={svgRef}
      style={{ width: "100%", height: "100%", display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    />
  );
};

export default WordCloud; 