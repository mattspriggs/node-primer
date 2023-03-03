function autocomplete(input, latInput, lngInput) {
  if (!input) return; //skip this function from running if there is no input
  const dropdown = new google.maps.places.Autocomplete(input);
}

export default autocomplete;
