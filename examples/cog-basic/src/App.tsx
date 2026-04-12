import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { COGLayer } from "@developmentseed/deck.gl-geotiff";
import "maplibre-gl/dist/maplibre-gl.css";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import {
  Layer,
  Map as MaplibreMap,
  Source,
  useControl,
} from "react-map-gl/maplibre";

function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

function SwisstopoAttribution() {
  return (
    <>
      &copy; <a href="https://www.swisstopo.ch/">Swisstopo</a>
    </>
  );
}

const SWISSTOPO_TILES_LAYER = "swisstopo-pk1000-tiles-layer";

const COG_OPTIONS: { title: string; url: string; attribution?: ReactNode }[] = [
  {
    title: "Swisstopo National Map 1:1 million",
    url: "https://data.geo.admin.ch/ch.swisstopo.pixelkarte-farbe-pk1000.noscale/swiss-map-raster1000_1000/swiss-map-raster1000_1000_krel_50_2056.tif",
    attribution: <SwisstopoAttribution />,
  },
];

export default function App() {
  const mapRef = useRef<MapRef>(null);
  const [debug, setDebug] = useState(false);
  const [debugOpacity, setDebugOpacity] = useState(0.25);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSwisstopoTiles, setShowSwisstopoTiles] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const cog_layer = new COGLayer({
    id: "cog-layer",
    geotiff: COG_OPTIONS[selectedIndex].url,
    debug,
    debugOpacity,
    onGeoTIFFLoad: (tiff, options) => {
      (window as any).tiff = tiff;
      const { west, south, east, north } = options.geographicBounds;
      mapRef.current?.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        {
          padding: 40,
          duration: 1000,
        },
      );
    },
    beforeId: SWISSTOPO_TILES_LAYER,
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MaplibreMap
        ref={mapRef}
        onLoad={() => setMapReady(true)}
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 3,
          pitch: 0,
          bearing: 0,
        }}
      >
        <Source
          id="swisstopo-pk1000-tiles"
          type="raster"
          tiles={[
            "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe-pk1000.noscale/default/current/3857/{z}/{x}/{y}.jpeg",
          ]}
          tileSize={256}
          bounds={[5.140242, 45.398181, 11.47757, 48.230651]}
          attribution={renderToStaticMarkup(<SwisstopoAttribution />)}
        >
          <Layer
            id={SWISSTOPO_TILES_LAYER}
            type="raster"
            layout={{
              visibility: showSwisstopoTiles ? "visible" : "none",
            }}
          />
        </Source>
        {mapReady && <DeckGLOverlay layers={[cog_layer]} interleaved />}
      </MaplibreMap>

      {/* UI Overlay Container */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            background: "white",
            padding: "16px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: "300px",
            pointerEvents: "auto",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
            Deck.gl-raster Swisstopo example
          </h3>
          <p
            style={{
              fontSize: "12px",
            }}
          >
            This example shows the{" "}
            <a href="https://data.geo.admin.ch/browser/index.html#/collections/ch.swisstopo.pixelkarte-farbe-pk1000.noscale/items/swiss-map-raster1000_1000?.asset=asset-swiss-map-raster1000_1000_krel_50_2056-tif">
              Swisstopo National Map 1:1 million
            </a>{" "}
            rendered from a Cloud-Optimized GeoTIFF image, using{" "}
            <a href="https://github.com/developmentseed/deck.gl-raster">
              deck.gl-raster
            </a>
            , which means that it is reprojected from the Swiss projected
            coordinate system LV95 to Web Mercator in the browser. After
            applying various tweaks, the result looks very similar to
            Swisstopo's pre-rendered Web Mercator tiles of the same data. This
            can be verified using the toggle below. You can find the{" "}
            <a href="https://github.com/rkaravia/deck.gl-raster-swisstopo">
              source code on GitHub
            </a>{" "}
            and some more information in{" "}
            <a href="https://karavia.ch/2026/04/17/deck.gl-raster">
              this blog post
            </a>
            .
          </p>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "4px",
              cursor: "pointer",
            }}
          >
            {COG_OPTIONS.map((opt, i) => (
              <option key={opt.url} value={i}>
                {opt.title}
              </option>
            ))}
          </select>
          {/* <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#666" }}>
            Displaying RGB imagery from New Zealand (NZTM2000 projection)
          </p> */}

          {/* Attribution */}
          {COG_OPTIONS[selectedIndex].attribution && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "11px",
                color: "#666",
              }}
            >
              {COG_OPTIONS[selectedIndex].attribution}
            </p>
          )}

          {/* Debug Controls */}
          <div
            style={{
              padding: "12px 0",
              borderTop: "1px solid #eee",
              marginTop: "12px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={debug}
                onChange={(e) => setDebug(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Overlay Debug Mesh</span>
            </label>

            {debug && (
              <div style={{ marginTop: "8px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "4px",
                  }}
                >
                  Debug Opacity: {debugOpacity.toFixed(2)}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={debugOpacity}
                    onChange={(e) =>
                      setDebugOpacity(parseFloat(e.target.value))
                    }
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </label>
              </div>
            )}

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "12px",
              }}
            >
              <input
                type="checkbox"
                checked={showSwisstopoTiles}
                onChange={(e) => setShowSwisstopoTiles(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              <span>Overlay Swisstopo tiles</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
