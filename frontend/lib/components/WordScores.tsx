import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { WordScore } from '../types';
import { dedup } from '@/api/preprocess';

interface WordScoresProps {
  words: WordScore[];
  width?: number;
  height?: number;
}

const defaultWidth = 400;
const defaultHeight = 250;

const WordScores: React.FC<WordScoresProps> = ({
  words,
  width = defaultWidth,
  height = defaultHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  words = dedup(words);

  useEffect(() => {
    if (!words || words.length === 0 || !svgRef.current) return;

    const sortedWords = [...words].sort((a, b) => b.value - a.value);

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 50, bottom: 40, left: 120 };
    const chartWidth = width - margin.left - margin.right;
    const rowHeight = 32;
    const totalContentHeight = sortedWords.length * rowHeight + margin.top + margin.bottom;


    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", totalContentHeight)
      .attr("viewBox", `0 0 ${width} ${totalContentHeight}`)
      .attr("preserveAspectRatio", "xMinYMin meet");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);


    const x = d3.scaleLinear()
      .domain([0, 1])
      .range([0, chartWidth]);

    const y = d3.scaleBand()
      .domain(sortedWords.map(d => d.text))
      .range([0, sortedWords.length * rowHeight])
      .padding(0.2);


    g.selectAll(".bar-bg")
      .data(sortedWords)
      .enter()
      .append("rect")
      .attr("class", "bar-bg")
      .attr("y", d => y(d.text) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", chartWidth)
      .attr("fill", (d, i) => i % 2 === 0 ? "#2d3748" : "#1a202c")
      .attr("rx", 4);


    g.selectAll(".bar")
      .data(sortedWords)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => y(d.text) || 0)
      .attr("height", y.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.value))
      .attr("fill", "#4299e1")
      .attr("rx", 4)
      .style("opacity", 0.7)
      .on("mouseover", function () {
        d3.select(this)
          .style("opacity", 1)
          .style("cursor", "pointer");
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("opacity", 0.7)
          .style("cursor", "default");
      });


    g.selectAll(".text-label")
      .data(sortedWords)
      .enter()
      .append("text")
      .attr("class", "text-label")
      .attr("y", d => (y(d.text) || 0) + y.bandwidth() / 2)
      .attr("x", -10)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", "14px")
      .attr("fill", "#e2e8f0")
      .text(d => d.text);


    g.selectAll(".value-label")
      .data(sortedWords)
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("y", d => (y(d.text) || 0) + y.bandwidth() / 2)
      .attr("x", d => x(d.value) + 5)
      .attr("dominant-baseline", "middle")
      .attr("font-family", "monospace")
      .attr("font-size", "14px")
      .attr("fill", "#e2e8f0")
      .text(d => d.value.toFixed(3));


    g.append("line")
      .attr("x1", x(0.5))
      .attr("x2", x(0.5))
      .attr("y1", 0)
      .attr("y2", sortedWords.length * rowHeight)
      .attr("stroke", "#4a5568")
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 0.5);

  }, [words, width, height]);

  return (
    <div
      ref={containerRef}
      className="word-scores-container"
      style={{
        width: "100%",
        height,
        overflow: "auto",
        position: "relative",
        backgroundColor: "#1a202c",
        borderRadius: "8px",
        padding: "8px"
      }}
    >
      <svg
        ref={svgRef}
        style={{
          display: "block",
          width: "100%"
        }}
      />
    </div>
  );
};

export default WordScores;