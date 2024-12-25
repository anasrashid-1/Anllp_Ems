const API = process.env.GM_API_KEY;


export function getMapPreview(lat, lng){
    const imagePreviewUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=14&size=400x200&maptype=roadmap&markers=color:red%7Clabel:S%7C${lat},${lng}&key=${API}`;
    return imagePreviewUrl;
}


// https://maps.googleapis.com/maps/api/staticmap?center=37.7749,-122.4194&zoom=14&size=400x200&maptype=roadmap&markers=color:red%7Clabel:S%7C37.7749,-122.4194&key=AIzaSyA-Jx6mwJ8lh93RoVUVPyu1TliPMxX09tw
// https://maps.gomaps.pro/maps/api/staticmap?center=37.7749,-122.4194&zoom=14&size=400x200&maptype=roadmap&markers=color:red%7Clabel:S%7C37.7749,-122.4194&key=AlzaSyUuPlIMfgOTxzic6INDdp1K5P0NUWyS2qp