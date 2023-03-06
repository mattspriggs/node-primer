function autocomplete(input, latInput, lngInput) {
  if (!input) return; //skip this function from running if there is no input
  const dropdown = new google.maps.places.Autocomplete(input);

  dropdown.addListener("place_changes", () => {
    const place = dropdown.getPlace();
    console.log(place);
  });
}

export default autocomplete;
