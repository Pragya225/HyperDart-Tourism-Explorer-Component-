import React, { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Divider,
  Typography,
} from "@mui/material";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";

const PLACES_API_URL = "https://api.geoapify.com/v2/places";
const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;
const BROAD_TOURISM_CATEGORY = "tourism.sights";
const EXCLUDED_CATEGORIES = ["catering", "accommodation", "commercial.shopping"];

const attractionIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function parseSearchValue(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function isTourismAttraction(feature) {
  const categories = feature?.properties?.categories;
  const categoryList = Array.isArray(categories) ? categories : [categories];

  return !categoryList.some((category) =>
    EXCLUDED_CATEGORIES.some((excluded) => category?.startsWith(excluded))
  );
}

function getFeatureCoordinates(feature) {
  const properties = feature?.properties || {};
  const geometryCoordinates = feature?.geometry?.coordinates || [];

  return {
    longitude: properties.lon ?? geometryCoordinates[0],
    latitude: properties.lat ?? geometryCoordinates[1],
  };
}

function getRequestedCategories(query) {
  const normalizedQuery = query?.toLowerCase() || "";

  if (normalizedQuery.includes("museum")) return "entertainment.museum";
  if (normalizedQuery.includes("memorial")) return "tourism.sights.memorial";
  if (normalizedQuery.includes("castle")) return "tourism.sights.castle";
  if (normalizedQuery.includes("archaeological")) return "tourism.sights.archaeological_site";

  return BROAD_TOURISM_CATEGORY;
}

function formatCategories(categories) {
  return getDisplayCategories(categories).join(", ") || "Tourist attraction";
}

function getDisplayCategories(categories) {
  const categoryList = Array.isArray(categories) ? categories : [];
  const tourismCategories = categoryList.filter((category) =>
    category?.startsWith("tourism") || category === "entertainment.museum"
  );
  const leafCategories = tourismCategories.filter(
    (category) => !tourismCategories.some(
      (otherCategory) => otherCategory !== category && otherCategory.startsWith(`${category}.`)
    )
  );

  return (leafCategories.length ? leafCategories : tourismCategories)
    .map((category) => category.split(".").pop().replaceAll("_", " "))
    .map((category) => category.replace(/\b\w/g, (letter) => letter.toUpperCase()))
    .filter((category, index, list) => list.indexOf(category) === index);
}

function getCategoryHeading(query, city) {
  const normalizedQuery = query?.toLowerCase() || "";
  let heading = "Places worth discovering";

  if (normalizedQuery.includes("museum")) heading = "Museums worth visiting";
  else if (normalizedQuery.includes("landmark")) heading = "Landmarks worth discovering";
  else if (normalizedQuery.includes("memorial")) heading = "Memorials worth discovering";
  else if (normalizedQuery.includes("archaeological")) heading = "Archaeological sites worth discovering";
  else if (normalizedQuery.includes("castle")) heading = "Castles worth discovering";
  else if (normalizedQuery.includes("viewpoint") || normalizedQuery.includes("view point")) {
    heading = "Viewpoints worth discovering";
  }

  return city ? `${heading} in ${city}` : heading;
}

function MapFocus({ attraction }) {
  const map = useMap();

  useEffect(() => {
    if (!attraction) return;

    const { longitude, latitude } = getFeatureCoordinates(attraction);

    if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
      map.flyTo([Number(latitude), Number(longitude)], 14, { duration: 0.7 });
    }
  }, [attraction, map]);

  return null;
}

function NewComponent(props) {
  const [attractions, setAttractions] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const parsedSearchData = parseSearchValue(props.searchData);
  const searchResult = Array.isArray(parsedSearchData)
    ? parsedSearchData[0]
    : parsedSearchData;
  const hasSearchData = Boolean(searchResult?.entities?.length);
  const query = searchResult?.query || searchResult?.queryTerm || searchResult?._processedQuery;
  const requestedCategories = getRequestedCategories(
    query
  );
  const location = searchResult?.entities
    ?.map((entity) => parseSearchValue(entity?.entityInfo)?.geo)
    ?.map((geo) => parseSearchValue(geo))
    .find((geo) => Number.isFinite(Number(geo?.lat)) && Number.isFinite(Number(geo?.long)));

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setAttractions([]);
    setSelectedAttraction(null);
    setActiveCategory("all");
    setLoading(true);

    async function loadAttractions() {
      if (!hasSearchData) {
        setLoading(false);
        return;
      }

      if (!location || !API_KEY) {
        setError(!API_KEY ? "Tourism results are unavailable right now." : "A location could not be resolved.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        categories: requestedCategories,
        filter: `circle:${location.long},${location.lat},5000`,
        limit: "20",
        apiKey: API_KEY,
      });

      try {
        let response = await fetch(`${PLACES_API_URL}?${params}`, { signal: controller.signal });

        if (!response.ok && requestedCategories !== BROAD_TOURISM_CATEGORY) {
          params.set("categories", BROAD_TOURISM_CATEGORY);
          response = await fetch(`${PLACES_API_URL}?${params}`, { signal: controller.signal });
        }

        if (!response.ok) throw new Error("Places request failed");

        const data = await response.json();
        setAttractions((data.features || []).filter(isTourismAttraction));
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError("We could not load attractions right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAttractions();
    return () => controller.abort();
  }, [hasSearchData, location?.lat, location?.long, requestedCategories]);

  const availableCategories = [...new Set(
    attractions.flatMap((attraction) => getDisplayCategories(attraction.properties?.categories))
  )];
  const visibleAttractions = activeCategory === "all"
    ? attractions
    : attractions.filter((attraction) =>
      getDisplayCategories(attraction.properties?.categories).includes(activeCategory)
    );

  useEffect(() => {
    if (!loading) props?.messageHandlers?.componentLoaded?.();
  }, [loading, props?.messageHandlers]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}><CircularProgress /></Box>;
  }

  if (!hasSearchData) {
    return <Typography color="text.secondary">Search for tourist attractions in a city.</Typography>;
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2 },
        backgroundColor: "#ffffff",
      }}
    >
      {attractions.length === 0 ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <ExploreOutlinedIcon sx={{ fontSize: 42, color: "#6b8179", mb: 1 }} />
          <Typography variant="h6" sx={{ color: "#19352d", fontWeight: 700 }}>
            No attractions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try searching for another city.
          </Typography>
        </Box>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={1}
            sx={{ mb: 1.5 }}
          >
            <Box>
              <Typography variant="body2" sx={{ color: "#527267", fontWeight: 600, mb: 0.25 }}>
                {location?.city || "Tourism"}
              </Typography>
              <Typography variant="h6" component="h1" sx={{ color: "#19352d", fontWeight: 700 }}>
                {getCategoryHeading(query, location?.city)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#527267", fontWeight: 700 }}>
              {visibleAttractions.length} {visibleAttractions.length === 1 ? "place" : "places"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            <Chip
              label="All"
              clickable
              variant={activeCategory === "all" ? "filled" : "outlined"}
              sx={{
                bgcolor: activeCategory === "all" ? "#e1eee8" : "transparent",
                color: activeCategory === "all" ? "#285747" : "#527267",
                borderColor: "#b8d2c7",
                fontWeight: 700,
              }}
              onClick={() => {
                setActiveCategory("all");
                setSelectedAttraction(null);
              }}
            />
            {availableCategories.map((category) => (
              <Chip
                key={category}
                label={category}
                clickable
                variant={activeCategory === category ? "filled" : "outlined"}
                sx={{
                  bgcolor: activeCategory === category ? "#e1eee8" : "transparent",
                  color: activeCategory === category ? "#285747" : "#527267",
                  borderColor: "#b8d2c7",
                  fontWeight: 700,
                }}
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedAttraction(null);
                }}
              />
            ))}
          </Stack>
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid item xs={12} lg={7}>
              <Grid container spacing={2}>
                {visibleAttractions.map((attraction, index) => {
                  const properties = attraction.properties || {};
                  const { longitude, latitude } = getFeatureCoordinates(attraction);
                  const description = properties.description?.trim();
                  const mapsUrl = longitude != null && latitude != null
                    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
                    : "";

                  return (
                    <Grid item key={properties.place_id || `${properties.name}-${index}`} xs={12} sm={6}>
                      <Card
                        onClick={() => setSelectedAttraction(attraction)}
                        sx={{
                          height: "100%",
                          border: "1px solid #dce9e3",
                          borderRadius: 1,
                          boxShadow: "none",
                          transition: "border-color 160ms ease",
                          cursor: "pointer",
                          "&:hover": { borderColor: "#9bbdad" },
                        }}
                      >
                        <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                          <Typography variant="h6" component="h2" sx={{ color: "#19352d", fontWeight: 700, lineHeight: 1.25, mb: 1 }}>
                            {properties.name || "Unnamed attraction"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#bd6d2f", display: "block", mb: 1 }}>
                            {formatCategories(properties.categories)}
                          </Typography>
                          {properties.formatted && (
                            <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1.25 }}>
                              <LocationOnOutlinedIcon sx={{ color: "#bd6d2f", fontSize: 19, mt: "2px" }} />
                              <Typography variant="body2" color="text.secondary">{properties.formatted}</Typography>
                            </Stack>
                          )}
                          {longitude != null && latitude != null && (
                            <Typography variant="caption" sx={{ color: "#527267", display: "block" }}>
                              {latitude}, {longitude}
                            </Typography>
                          )}
                          {description && (
                            <>
                              <Divider sx={{ my: 1.25 }} />
                              <Typography variant="body2" sx={{ color: "#3e514a", lineHeight: 1.6 }}>
                                {description}
                              </Typography>
                            </>
                          )}
                          {mapsUrl && (
                            <Button
                              component="a"
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                              startIcon={<MapOutlinedIcon />}
                              sx={{ mt: 1.75, borderColor: "#b8d2c7", color: "#285747", fontWeight: 700 }}
                            >
                              Open in Maps
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
            <Grid item xs={12} lg={5}>
              <Box
                sx={{
                  height: { xs: 360, lg: "100%" },
                  minHeight: 360,
                  overflow: "hidden",
                  border: "1px solid #dce9e3",
                  borderRadius: 1,
                  boxShadow: "none",
                  "& .leaflet-container": { height: "100%", width: "100%", fontFamily: "inherit" },
                  "& .leaflet-popup-content-wrapper": { borderRadius: 1.5 },
                  "& .leaflet-popup-content": { margin: "14px 16px", minWidth: 180 },
                }}
              >
                <MapContainer
                  center={[Number(location.lat), Number(location.long)]}
                  zoom={13}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapFocus attraction={selectedAttraction} />
                  {visibleAttractions.map((attraction, index) => {
                    const properties = attraction.properties || {};
                    const { longitude, latitude } = getFeatureCoordinates(attraction);

                    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return null;

                    return (
                      <Marker
                        key={properties.place_id || `${properties.name}-${index}`}
                        position={[Number(latitude), Number(longitude)]}
                        icon={attractionIcon}
                        eventHandlers={{ click: () => setSelectedAttraction(attraction) }}
                      >
                        <Popup>
                          <Typography component="strong" sx={{ color: "#19352d", fontWeight: 800 }}>
                            {properties.name || "Unnamed attraction"}
                          </Typography>
                          <Typography variant="caption" component="div" sx={{ color: "#995321", mt: 0.5 }}>
                            {formatCategories(properties.categories)}
                          </Typography>
                          {properties.formatted && (
                            <Typography variant="body2" sx={{ color: "#3e514a", mt: 0.75 }}>
                              {properties.formatted}
                            </Typography>
                          )}
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
export default NewComponent;