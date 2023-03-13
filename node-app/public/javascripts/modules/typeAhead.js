const axios = require("axios");

function searchResultsHTML(stores) {
  return stores
    .map((store) => {
      return `
		<a href="/stores/${store.slug}" class="search__result"><strong>${store.name}</strong>
		</a>
		`;
    })
    .join("");
}

function typeAhead(search) {
  if (!search) return; //stop if no search entered
  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector(".search__results");

  searchInput.on("input", function () {
    //if there is nothing then quit
    if (!this.value) {
      searchResults.style.display = "none";
      return; //stop!
    }
    searchResults.style.display = "block";

    axios.get(`/api/search?q=${this.value}`).then((res) => {
      if (res.data.length) {
        const html = searchResultsHTML(res.data);
        console.log(html);
      }
    });
  });
}

export default typeAhead;
