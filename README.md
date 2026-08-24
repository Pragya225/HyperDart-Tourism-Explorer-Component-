# Tourism Explorer

## What it does
A HyperDart component that surfaces tourist attractions, landmarks, and points of interest for a city based on natural-language queries like *"landmarks in Rome"* or *"things to do in Paris"*. It resolves the city from `searchData`, understands the requested attraction category from the query (museums, castles, memorials, archaeological sites, etc.), and fetches relevant sights using the Geoapify Places API — while filtering out restaurants, cafes, and lodging.

## Tech Stack
- React (hooks: `useState`, `useEffect`)
- Material UI (MUI) for layout and components
- Leaflet + React-Leaflet for the interactive map
- Geoapify Places API for tourism data
- `AbortController` for race-condition-safe fetching

## Features
- Category detection from query text (museum, castle, memorial, archaeological site, historic place, etc.)
- Excludes non-tourism results (restaurants, hotels, shopping)
- Category filter chips to narrow down results client-side
- Interactive map with markers, popups, and fly-to on selection
- Handles loading, error, empty-results, and no-search-data states
- Falls back to broad tourism search if a specific category request returns no results

## How to Run
1. Clone the repo
2. `npm install`
3. Create a `.env` file in the root with:
   ```
   VITE_GEOAPIFY_API_KEY=your_api_key_here
   ```
   Get a free key at [geoapify.com](https://www.geoapify.com/)
4. `npm run dev`

## Screenshot
<img width="892" height="731" alt="image" src="https://github.com/user-attachments/assets/24fa9743-520a-46d8-b53e-0b3fd41f5ac1" />
<img width="833" height="701" alt="image" src="https://github.com/user-attachments/assets/d890efa5-94ab-4342-bfc7-b7b12dfe8bc9" />

## Demo Video
[Watch the demo]https://drive.google.com/file/d/17SySCXExfbb_hiF7JBw0RxNKAdqa-y8m/view
