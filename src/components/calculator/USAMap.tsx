import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { geoDistance, geoCentroid } from "d3-geo";

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Quick region mapping
const STATE_REGIONS: Record<string, "southeast" | "northeast" | "southwest" | "midwest"> = {
  "Florida": "southeast", "Georgia": "southeast", "South Carolina": "southeast", "North Carolina": "southeast", "Virginia": "southeast", "Alabama": "southeast", "Tennessee": "southeast", "Mississippi": "southeast", "Arkansas": "southeast", "Louisiana": "southeast",
  "Maine": "northeast", "New Hampshire": "northeast", "Vermont": "northeast", "Massachusetts": "northeast", "Rhode Island": "northeast", "Connecticut": "northeast", "New York": "northeast", "New Jersey": "northeast", "Pennsylvania": "northeast", "Delaware": "northeast", "Maryland": "northeast",
  "Texas": "southwest", "Oklahoma": "southwest", "New Mexico": "southwest", "Arizona": "southwest",
  "California": "southwest", "Nevada": "southwest", "Utah": "southwest", "Colorado": "southwest",
};

// Fallback to midwest
const getRegionForState = (stateName: string) => STATE_REGIONS[stateName] || "midwest";

// Earth radius in miles
const EARTH_RADIUS = 3959;

interface USAMapProps {
  onRouteSelected: (distanceMiles: number, dominantRegion: "southeast" | "northeast" | "southwest" | "midwest") => void;
}

const USAMap: React.FC<USAMapProps> = ({ onRouteSelected }) => {
  const [startPoint, setStartPoint] = useState<{ name: string, coords: [number, number] } | null>(null);
  const [endPoint, setEndPoint] = useState<{ name: string, coords: [number, number] } | null>(null);

  const handleStateClick = (geo: any) => {
    const stateName = geo.properties.name;
    const centroid = geoCentroid(geo);

    if (!startPoint || (startPoint && endPoint)) {
      // Reset and set start
      setStartPoint({ name: stateName, coords: centroid });
      setEndPoint(null);
      onRouteSelected(0, getRegionForState(stateName));
    } else {
      // Set end and calculate distance
      setEndPoint({ name: stateName, coords: centroid });
      
      const distanceRad = geoDistance(startPoint.coords, centroid);
      // Rough road multiplier. Straight line is shorter than road. Road ~ 1.2 * straight line.
      const distanceMiles = distanceRad * EARTH_RADIUS * 1.2;
      
      // Determine dominant region (just pick start point's region for simplicity, or average them)
      const region = getRegionForState(startPoint.name);
      
      // Set a minimum distance so they don't click the same state and get 0 (or just pass 0)
      onRouteSelected(Math.max(Math.round(distanceMiles), 50), region);
    }
  };

  return (
    <div className="relative w-full aspect-[4/3] bg-[#1A1F2B]/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 z-10 bg-[#0B0E14]/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-sm font-medium text-white/90 shadow-2xl">
        {!startPoint && (<span><span className="text-brand-cyan">Step 1:</span> Click a state to set Start Point</span>)}
        {startPoint && !endPoint && (<span><span className="text-brand-orange">Step 2:</span> Click another state to set End Point</span>)}
        {startPoint && endPoint && "Route Plotted. Click anywhere to reset."}
      </div>

      <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isStart = startPoint?.name === geo.properties.name;
              const isEnd = endPoint?.name === geo.properties.name;
              
              let fill = "#2D3748"; // default base
              let stroke = "#1A1F2B";
              
              if (isStart) {
                 fill = "#00E5FF"; // brand-cyan
                 stroke = "#000";
              }
              else if (isEnd) {
                 fill = "#FF6B00"; // brand-orange
                 stroke = "#000";
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1}
                  className="transition-colors duration-200 outline-none cursor-pointer hover:fill-white/40"
                  onClick={() => handleStateClick(geo)}
                />
              );
            })
          }
        </Geographies>
        
        {startPoint && endPoint && (
          <Line
            from={startPoint.coords}
            to={endPoint.coords}
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeDasharray="4 4"
            className="opacity-60"
          />
        )}
        
        {startPoint && (
          <Marker coordinates={startPoint.coords}>
            <circle r={6} fill="#00E5FF" className="animate-pulse" />
          </Marker>
        )}
        
        {endPoint && (
          <Marker coordinates={endPoint.coords}>
             <circle r={6} fill="#FF6B00" className="animate-pulse" />
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
};

export default USAMap;
