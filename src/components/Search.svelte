<script>
  let src = "search.png";
  let alt = "search icon";
</script>

<main>
  <div class="search-bar">
    <img src="search.png" alt="search-icon" />
    <div class="search-field">
      <form>
        <input type="text" id="search" name="search" placeholder="/Search" />
      </form>
      <!-- /Search -->
    </div>
  </div>
</main>

<style>
  main {
    float: right;
    height: 40px;
  }

  img {
    max-width: 10%;
    max-height: auto;
    padding: 0 10px;
    filter: invert(88%) sepia(21%) saturate(1402%) hue-rotate(163deg)
      brightness(101%) contrast(101%);
  }

  .search-bar {
    display: flex;
    height: 20px;
    width: 200px;
    padding: 10px;
    background-color: rgba(34, 35, 36, 0.75);
    color: #f7f7f7;
    font-weight: 600;
    border-radius: 30px;
  }

  #search {
    all: unset;
    width: 100%;
    text-align: left;
  }
</style>
